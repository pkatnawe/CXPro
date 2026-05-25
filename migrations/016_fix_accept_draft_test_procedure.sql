-- Migration 016: Fix accept_draft_test_procedure to read role from memberships table
-- 
-- Architecture Decision (from docs/architecture.md section 2.3 Context 10):
-- The role lives in the memberships table (User × Org relationship), NOT in assignments.
-- Assignments table only connects users to discipline_scopes, without a role column.
-- The correct permission check should join through memberships to get the user's OCA role.

CREATE OR REPLACE FUNCTION accept_draft_test_procedure(
    p_test_procedure_id uuid,
    p_user_id uuid,
    p_inbox_item_id uuid DEFAULT NULL
) RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_procedure test_procedure_instances;
    v_project_id uuid;
    v_org_id uuid;
    v_agent_run_id uuid;
    v_audit_id uuid;
BEGIN
    -- Get the test procedure with lock for update
    SELECT * INTO v_procedure
    FROM test_procedure_instances
    WHERE id = p_test_procedure_id
    FOR UPDATE;
    
    -- Validate the procedure exists and is in draft status
    IF v_procedure.id IS NULL THEN
        RAISE EXCEPTION 'Test procedure not found: %', p_test_procedure_id;
    END IF;
    
    IF v_procedure.status != 'draft' THEN
        RAISE EXCEPTION 'Test procedure is not in draft status: %', v_procedure.status;
    END IF;
    
    -- Get project and org info
    SELECT project_id, agent_run_id INTO v_project_id, v_agent_run_id
    FROM test_procedure_instances
    WHERE id = p_test_procedure_id;
    
    SELECT org_id INTO v_org_id
    FROM projects
    WHERE id = v_project_id;
    
    -- Verify user has OCA role in the project's organization
    -- Fix: Read role from memberships table, not assignments
    IF NOT EXISTS (
        SELECT 1
        FROM memberships m
        WHERE m.user_id = p_user_id
        AND m.org_id = v_org_id
        AND m.role = 'OCA'
    ) THEN
        RAISE EXCEPTION 'User does not have OCA role for this project';
    END IF;
    
    -- Update test procedure status to active
    UPDATE test_procedure_instances
    SET status = 'active',
        updated_at = now()
    WHERE id = p_test_procedure_id;
    
    -- Create audit log entry
    INSERT INTO audit_log_entries (
        project_id,
        actor_type,
        actor_id,
        action,
        target_type,
        target_id,
        confirmed_ai_run_id,
        metadata,
        org_id
    ) VALUES (
        v_project_id,
        'human',
        p_user_id,
        'accepted_draft',
        'test_procedure_instance',
        p_test_procedure_id,
        v_agent_run_id,
        jsonb_build_object(
            'previous_status', 'draft',
            'new_status', 'active',
            'accepted_at', now()
        ),
        v_org_id
    ) RETURNING id INTO v_audit_id;
    
    -- Update inbox item if provided
    IF p_inbox_item_id IS NOT NULL THEN
        UPDATE inbox_items
        SET action_state = 'acted',
            metadata = COALESCE(metadata, '{}'::jsonb) || 
                       jsonb_build_object('accepted_at', now(), 'accepted_by', p_user_id)
        WHERE id = p_inbox_item_id
        AND user_id = p_user_id;
    END IF;
    
    -- Skip outbox event emission - table doesn't exist yet
    -- This would emit TestProcedureInstanceActivated event once outbox table is created
    
    RETURN jsonb_build_object(
        'success', true,
        'test_procedure_id', p_test_procedure_id,
        'audit_log_id', v_audit_id
    );
END;
$$;

-- Restore ownership to postgres as per canonical safeguard
ALTER FUNCTION accept_draft_test_procedure(uuid, uuid, uuid) OWNER TO postgres;

-- Ensure authenticated role can execute the function
GRANT EXECUTE ON FUNCTION accept_draft_test_procedure TO authenticated;