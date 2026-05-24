-- Slice-09: Accept draft functionality with audit and event emission

-- Function to accept a draft test procedure (transitions draft -> active)
CREATE OR REPLACE FUNCTION accept_draft_test_procedure(
    p_test_procedure_id uuid,
    p_user_id uuid,
    p_inbox_item_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_procedure test_procedure_instances;
    v_project_id uuid;
    v_org_id uuid;
    v_agent_run_id uuid;
    v_audit_id uuid;
    v_outbox_id uuid;
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
    
    -- Verify user has OCA role in the project
    IF NOT EXISTS (
        SELECT 1
        FROM participations p
        JOIN assignments a ON a.participation_id = p.id
        WHERE p.user_id = p_user_id
        AND p.project_id = v_project_id
        AND a.role = 'OCA'
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
    
    -- Emit TestProcedureInstanceActivated event
    INSERT INTO outbox (
        event_type,
        aggregate_type,
        aggregate_id,
        payload,
        metadata
    ) VALUES (
        'TestProcedureInstanceActivated',
        'test_procedure_instance',
        p_test_procedure_id,
        jsonb_build_object(
            'test_procedure_instance_id', p_test_procedure_id,
            'project_id', v_project_id,
            'activated_by', p_user_id,
            'activated_at', now(),
            'audit_log_id', v_audit_id,
            'previous_agent_run_id', v_agent_run_id
        ),
        jsonb_build_object(
            'org_id', v_org_id
        )
    ) RETURNING id INTO v_outbox_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'test_procedure_id', p_test_procedure_id,
        'audit_log_id', v_audit_id,
        'outbox_id', v_outbox_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record feedback on an agent run
CREATE OR REPLACE FUNCTION record_feedback(
    p_agent_run_id uuid,
    p_user_id uuid,
    p_feedback_type text,
    p_feedback_text text DEFAULT NULL,
    p_message_id text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_feedback_id uuid;
    v_org_id uuid;
    v_test_procedure_id uuid;
BEGIN
    -- Get org_id from agent_run's project
    SELECT o.id INTO v_org_id
    FROM agent_runs ar
    JOIN projects p ON p.id = ar.project_id
    JOIN orgs o ON o.id = p.org_id
    WHERE ar.id = p_agent_run_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Agent run not found or invalid project: %', p_agent_run_id;
    END IF;
    
    -- Get test_procedure_instance_id if exists
    SELECT id INTO v_test_procedure_id
    FROM test_procedure_instances
    WHERE agent_run_id = p_agent_run_id
    LIMIT 1;
    
    -- Insert or update feedback record
    INSERT INTO feedback_records (
        test_procedure_instance_id,
        agent_run_id,
        message_id,
        feedback_type,
        feedback_text,
        created_by,
        org_id
    ) VALUES (
        v_test_procedure_id,
        p_agent_run_id,
        p_message_id,
        p_feedback_type,
        p_feedback_text,
        p_user_id,
        v_org_id
    )
    ON CONFLICT (agent_run_id, created_by, COALESCE(message_id, ''))
    DO UPDATE SET
        feedback_type = EXCLUDED.feedback_type,
        feedback_text = EXCLUDED.feedback_text,
        created_at = now()
    RETURNING id INTO v_feedback_id;
    
    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for feedback to prevent duplicate feedback per user per agent run/message
-- Only add if table exists (Slice-07 already created it)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback_records') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'unique_feedback_per_user_per_run_message'
        ) THEN
            ALTER TABLE feedback_records 
            ADD CONSTRAINT unique_feedback_per_user_per_run_message 
            UNIQUE (agent_run_id, created_by, message_id);
        END IF;
    END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_draft_test_procedure TO authenticated;
GRANT EXECUTE ON FUNCTION record_feedback TO authenticated;