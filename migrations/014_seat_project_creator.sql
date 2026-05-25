-- Migration 014: Seat project creator with four DisciplineScopes and four Assignments
--
-- When an OCA creates a project, they should immediately be seated on it with
-- participations and assignments across all four standard discipline scopes.
-- This ensures the project appears on their dashboard immediately after creation.
--
-- The function creates:
-- 1. The project itself
-- 2. Four discipline_scopes: Mechanical, Electrical, Controls, General Construction  
-- 3. One participation row for the creator (auth.uid())
-- 4. Four assignment rows linking the participation to each discipline_scope
--
-- Uses SECURITY DEFINER to bypass RLS and ON CONFLICT DO NOTHING for idempotency.

CREATE OR REPLACE FUNCTION create_project_with_discipline(
    project_name TEXT,
    project_description TEXT,
    org_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project_id UUID;
    v_user_id UUID;
    v_discipline_scope_id UUID;
    v_discipline_names TEXT[] := ARRAY['Mechanical', 'Electrical', 'Controls', 'General Construction'];
    v_discipline_name TEXT;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user';
    END IF;
    
    -- Create the project
    INSERT INTO projects (id, org_id, name, description, created_at, updated_at)
    VALUES (gen_random_uuid(), org_id, project_name, project_description, NOW(), NOW())
    RETURNING id INTO v_project_id;
    
    -- Create the four standard discipline scopes
    FOREACH v_discipline_name IN ARRAY v_discipline_names
    LOOP
        INSERT INTO discipline_scopes (id, project_id, name, created_at)
        VALUES (gen_random_uuid(), v_project_id, v_discipline_name, NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Create participation for the creator
    INSERT INTO participations (id, user_id, project_id, created_at)
    VALUES (gen_random_uuid(), v_user_id, v_project_id, NOW())
    ON CONFLICT (user_id, project_id) DO NOTHING;
    
    -- Create assignments for each discipline scope
    FOR v_discipline_scope_id IN 
        SELECT id FROM discipline_scopes WHERE project_id = v_project_id
    LOOP
        INSERT INTO assignments (id, user_id, discipline_scope_id, created_at)
        VALUES (gen_random_uuid(), v_user_id, v_discipline_scope_id, NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN v_project_id;
END;
$$;

-- Set ownership and grant permissions
ALTER FUNCTION create_project_with_discipline(TEXT, TEXT, UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION create_project_with_discipline(TEXT, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION create_project_with_discipline IS
'Creates a project with four standard discipline scopes and seats the creator with participations and assignments. Callable by authenticated users.';