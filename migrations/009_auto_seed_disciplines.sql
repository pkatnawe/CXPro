-- Update create_project_with_discipline to auto-seed all four canonical disciplines
-- US-001: Auto-seed all four DisciplineScopes on project creation

CREATE OR REPLACE FUNCTION create_project_with_discipline(
    project_name TEXT,
    project_description TEXT,
    org_id UUID
)
RETURNS UUID AS $$
DECLARE
    new_project_id UUID;
BEGIN
    -- Insert project
    INSERT INTO projects (name, description, org_id)
    VALUES (project_name, project_description, org_id)
    RETURNING id INTO new_project_id;
    
    -- Auto-create all four canonical discipline scopes
    INSERT INTO discipline_scopes (project_id, name, description)
    VALUES 
        (new_project_id, 'Mechanical', 'Mechanical engineering discipline scope'),
        (new_project_id, 'Electrical', 'Electrical engineering discipline scope'),
        (new_project_id, 'Controls', 'Controls engineering discipline scope'),
        (new_project_id, 'General Construction', 'General construction discipline scope');
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;