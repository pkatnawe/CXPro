-- Party model for multi-tenant organization structure
-- Organizations -> Users (via memberships) -> Projects (via participations) -> Assignments

-- Organizations table
CREATE TABLE orgs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on orgs
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Memberships - users belonging to orgs
CREATE TABLE memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OCA', 'cx_engineer')),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, org_id)
);

-- Enable RLS on memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Discipline scopes
CREATE TABLE discipline_scopes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on discipline_scopes
ALTER TABLE discipline_scopes ENABLE ROW LEVEL SECURITY;

-- Participations - users participating in projects
CREATE TABLE participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, project_id)
);

-- Enable RLS on participations
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- Assignments - user assignments to discipline scopes
CREATE TABLE assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discipline_scope_id UUID NOT NULL REFERENCES discipline_scopes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, discipline_scope_id)
);

-- Enable RLS on assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cross-org isolation

-- Users can only see themselves
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can only see orgs they belong to
CREATE POLICY "Users can view orgs they belong to" ON orgs
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Users can only see their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

-- Users can only see projects in their orgs
CREATE POLICY "Users can view projects in their orgs" ON projects
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Users can only see discipline scopes in projects they have access to
CREATE POLICY "Users can view discipline scopes in accessible projects" ON discipline_scopes
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- Users can only see participations in projects they have access to
CREATE POLICY "Users can view participations in accessible projects" ON participations
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- Users can only see assignments in discipline scopes they have access to
CREATE POLICY "Users can view assignments in accessible discipline scopes" ON assignments
    FOR SELECT USING (
        discipline_scope_id IN (
            SELECT ds.id FROM discipline_scopes ds
            JOIN projects p ON p.id = ds.project_id
            JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- Insert policies for creating data (only OCA role can create orgs and projects)

-- Users can insert into users table (for signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- OCA can create projects
CREATE POLICY "OCA can create projects" ON projects
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role = 'OCA'
        )
    );

-- OCA can create discipline scopes
CREATE POLICY "OCA can create discipline scopes" ON discipline_scopes
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid() AND m.role = 'OCA'
        )
    );

-- Create trigger to automatically create user record on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create organization and make user OCA
CREATE OR REPLACE FUNCTION create_org_with_membership(
    org_name TEXT,
    org_slug TEXT
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Insert org
    INSERT INTO orgs (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Make current user an OCA member
    INSERT INTO memberships (user_id, org_id, role)
    VALUES (auth.uid(), new_org_id, 'OCA');
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create project with automatic discipline scope
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
    
    -- Auto-create 'Mechanical' discipline scope
    INSERT INTO discipline_scopes (project_id, name, description)
    VALUES (new_project_id, 'Mechanical', 'Mechanical engineering discipline scope');
    
    RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user by email
CREATE OR REPLACE FUNCTION invite_user_by_email(
    invite_email TEXT,
    org_id UUID,
    project_id UUID,
    user_role TEXT DEFAULT 'cx_engineer'
)
RETURNS UUID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id
    FROM users
    WHERE email = invite_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', invite_email;
    END IF;
    
    -- Create membership if doesn't exist
    INSERT INTO memberships (user_id, org_id, role)
    VALUES (target_user_id, org_id, user_role)
    ON CONFLICT (user_id, org_id) DO NOTHING;
    
    -- Create participation if doesn't exist
    INSERT INTO participations (user_id, project_id)
    VALUES (target_user_id, project_id)
    ON CONFLICT (user_id, project_id) DO NOTHING;
    
    RETURN target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;