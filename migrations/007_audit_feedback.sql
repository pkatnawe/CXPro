-- Slice-09: Audit log and feedback tables for test procedure acceptance

-- Audit log entries table
CREATE TABLE IF NOT EXISTS audit_log_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Actor information
    actor_type text NOT NULL CHECK (actor_type IN ('human', 'ai', 'system')),
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Action details
    action text NOT NULL,
    target_type text,
    target_id uuid,
    
    -- For human confirmations of AI work
    confirmed_ai_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
    
    -- Additional context
    metadata jsonb,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Feedback records table for thumb up/down on AI responses
CREATE TABLE IF NOT EXISTS feedback_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    test_procedure_instance_id uuid REFERENCES test_procedure_instances(id) ON DELETE CASCADE,
    agent_run_id uuid REFERENCES agent_runs(id) ON DELETE CASCADE,
    message_id text,
    
    -- Feedback details
    feedback_type text NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down')),
    feedback_text text,
    
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_project ON audit_log_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log_entries(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_confirmed_run ON audit_log_entries(confirmed_ai_run_id);

CREATE INDEX IF NOT EXISTS idx_feedback_test_procedure ON feedback_records(test_procedure_instance_id);
CREATE INDEX IF NOT EXISTS idx_feedback_agent_run ON feedback_records(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_by ON feedback_records(created_by);

-- Enable RLS
ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_log_entries
CREATE POLICY audit_log_select ON audit_log_entries
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY audit_log_insert ON audit_log_entries
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

-- RLS policies for feedback_records
CREATE POLICY feedback_select ON feedback_records
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY feedback_insert ON feedback_records
    FOR INSERT
    WITH CHECK (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
        AND created_by = auth.uid()
    );

CREATE POLICY feedback_update ON feedback_records
    FOR UPDATE
    USING (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
        AND created_by = auth.uid()
    );