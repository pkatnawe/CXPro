-- Slice-06: AI agent execution tables for draft checklist generation

-- Agent runs audit table - captures full execution history
CREATE TABLE IF NOT EXISTS agent_runs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    extracted_spec_id uuid REFERENCES extracted_specs(id) ON DELETE SET NULL,
    
    -- Execution metadata
    agent_type text NOT NULL CHECK (agent_type IN ('cx_execution', 'other')),
    model_version text NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'refused')),
    refusal_reason text,
    
    -- Input/output tracking
    input jsonb NOT NULL,
    output jsonb,
    tool_calls jsonb[],
    
    -- Performance metrics
    token_cost jsonb, -- {"input_tokens": 1000, "output_tokens": 500, "total_cost": 0.015}
    latency_ms integer,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    completed_at timestamptz,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Test procedure instances - the actual checklists
CREATE TABLE IF NOT EXISTS test_procedure_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    extracted_spec_id uuid REFERENCES extracted_specs(id) ON DELETE SET NULL,
    agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
    
    -- Instance metadata
    equipment_type text NOT NULL,
    manufacturer text,
    model text,
    asset_tag text,
    
    -- Checklist content
    status text NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    actor_type text NOT NULL CHECK (actor_type IN ('ai', 'human')),
    body jsonb NOT NULL, -- The actual checklist steps
    
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Citations linking checklist items to source chunks
CREATE TABLE IF NOT EXISTS citations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    test_procedure_instance_id uuid NOT NULL REFERENCES test_procedure_instances(id) ON DELETE CASCADE,
    document_chunk_id uuid NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    
    -- Citation metadata
    step_id text NOT NULL, -- e.g., "1.1", "2.3"
    citation_text text NOT NULL,
    confidence_score numeric(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Page/coordinate reference from chunk
    page_number integer,
    bbox jsonb, -- bounding box coordinates
    
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    
    UNIQUE(test_procedure_instance_id, step_id, document_chunk_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_project ON agent_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_document ON agent_runs(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_procedure_instances_project ON test_procedure_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_test_procedure_instances_document ON test_procedure_instances(document_id);
CREATE INDEX IF NOT EXISTS idx_test_procedure_instances_status ON test_procedure_instances(status);
CREATE INDEX IF NOT EXISTS idx_test_procedure_instances_agent_run ON test_procedure_instances(agent_run_id);

CREATE INDEX IF NOT EXISTS idx_citations_test_procedure ON citations(test_procedure_instance_id);
CREATE INDEX IF NOT EXISTS idx_citations_chunk ON citations(document_chunk_id);
CREATE INDEX IF NOT EXISTS idx_citations_step ON citations(test_procedure_instance_id, step_id);

-- Enable RLS
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_procedure_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_runs
CREATE POLICY agent_runs_select ON agent_runs
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY agent_runs_insert ON agent_runs
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY agent_runs_update ON agent_runs
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

-- RLS policies for test_procedure_instances
CREATE POLICY test_procedure_instances_select ON test_procedure_instances
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY test_procedure_instances_insert ON test_procedure_instances
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY test_procedure_instances_update ON test_procedure_instances
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

-- RLS policies for citations
CREATE POLICY citations_select ON citations
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY citations_insert ON citations
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

-- Function to create test procedure with citations in transaction
CREATE OR REPLACE FUNCTION create_test_procedure_with_citations(
    p_project_id uuid,
    p_document_id uuid,
    p_extracted_spec_id uuid,
    p_agent_run_id uuid,
    p_equipment_type text,
    p_manufacturer text,
    p_model text,
    p_asset_tag text,
    p_body jsonb,
    p_citations jsonb[], -- Array of citation objects
    p_org_id uuid
) RETURNS uuid AS $$
DECLARE
    v_test_procedure_id uuid;
    v_citation jsonb;
BEGIN
    -- Create test procedure instance
    INSERT INTO test_procedure_instances (
        project_id, document_id, extracted_spec_id, agent_run_id,
        equipment_type, manufacturer, model, asset_tag,
        status, actor_type, body, org_id
    ) VALUES (
        p_project_id, p_document_id, p_extracted_spec_id, p_agent_run_id,
        p_equipment_type, p_manufacturer, p_model, p_asset_tag,
        'draft', 'ai', p_body, p_org_id
    ) RETURNING id INTO v_test_procedure_id;
    
    -- Insert citations
    FOREACH v_citation IN ARRAY p_citations
    LOOP
        INSERT INTO citations (
            test_procedure_instance_id,
            document_chunk_id,
            step_id,
            citation_text,
            confidence_score,
            page_number,
            bbox,
            org_id
        ) VALUES (
            v_test_procedure_id,
            (v_citation->>'document_chunk_id')::uuid,
            v_citation->>'step_id',
            v_citation->>'citation_text',
            (v_citation->>'confidence_score')::numeric,
            (v_citation->>'page_number')::integer,
            v_citation->'bbox',
            p_org_id
        );
    END LOOP;
    
    -- Emit AgentRunCompleted event
    INSERT INTO outbox (event_type, payload, resource_id, resource_type)
    VALUES (
        'AgentRunCompleted',
        jsonb_build_object(
            'agent_run_id', p_agent_run_id,
            'test_procedure_instance_id', v_test_procedure_id,
            'project_id', p_project_id,
            'document_id', p_document_id
        ),
        p_agent_run_id,
        'agent_run'
    );
    
    RETURN v_test_procedure_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record AI refusal
CREATE OR REPLACE FUNCTION record_ai_refusal(
    p_agent_run_id uuid,
    p_refusal_reason text,
    p_project_id uuid,
    p_document_id uuid
) RETURNS void AS $$
BEGIN
    -- Update agent run status
    UPDATE agent_runs 
    SET status = 'refused',
        refusal_reason = p_refusal_reason,
        completed_at = now()
    WHERE id = p_agent_run_id;
    
    -- Emit AIRefusal event
    INSERT INTO outbox (event_type, payload, resource_id, resource_type)
    VALUES (
        'AIRefusal',
        jsonb_build_object(
            'agent_run_id', p_agent_run_id,
            'refusal_reason', p_refusal_reason,
            'project_id', p_project_id,
            'document_id', p_document_id
        ),
        p_agent_run_id,
        'agent_run'
    );
END;
$$ LANGUAGE plpgsql;

-- Update trigger for test_procedure_instances updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_procedure_instances_updated_at
    BEFORE UPDATE ON test_procedure_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to search document chunks by document ID
CREATE OR REPLACE FUNCTION search_document_chunks(
    p_query TEXT,
    p_document_id UUID
) RETURNS TABLE (
    id UUID,
    content TEXT,
    page_number INTEGER,
    bbox JSONB,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        dc.page_number,
        jsonb_build_object(
            'x', dc.bbox_x,
            'y', dc.bbox_y,
            'width', dc.bbox_width,
            'height', dc.bbox_height
        ) as bbox,
        0.85::REAL as similarity  -- Mock similarity for testing
    FROM document_chunks dc
    WHERE dc.document_id = p_document_id
    ORDER BY dc.page_number
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;