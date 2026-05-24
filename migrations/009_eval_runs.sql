-- Migration: Create eval_runs table for AI evaluation tracking
-- This table stores results from automated evaluation runs to track AI quality over time

-- Create eval_runs table to store individual fixture evaluation results
CREATE TABLE IF NOT EXISTS eval_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(32) NOT NULL,
    fixture_id VARCHAR(100) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    extracted_spec_match BOOLEAN NOT NULL DEFAULT FALSE,
    citation_count INTEGER NOT NULL DEFAULT 0,
    citation_recall DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    steps_count INTEGER NOT NULL DEFAULT 0,
    steps_in_range BOOLEAN NOT NULL DEFAULT FALSE,
    checklist_coverage DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    execution_time_ms INTEGER NOT NULL,
    error_message TEXT,
    git_commit VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index for querying by run_id
    INDEX idx_eval_runs_run_id (run_id),
    -- Index for querying by fixture_id
    INDEX idx_eval_runs_fixture_id (fixture_id),
    -- Index for time-based queries
    INDEX idx_eval_runs_created_at (created_at)
);

-- Create eval_run_summaries table for aggregate metrics per run
CREATE TABLE IF NOT EXISTS eval_run_summaries (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(32) UNIQUE NOT NULL,
    fixtures_passed INTEGER NOT NULL,
    fixtures_total INTEGER NOT NULL,
    pass_rate DECIMAL(5,4) NOT NULL,
    avg_citation_recall DECIMAL(5,4) NOT NULL,
    avg_checklist_coverage DECIMAL(5,4) NOT NULL,
    total_execution_time_ms INTEGER NOT NULL,
    git_commit VARCHAR(40),
    triggered_by VARCHAR(100), -- 'ci', 'manual', 'pr', etc.
    pr_number INTEGER,
    branch_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index for time-based queries
    INDEX idx_eval_run_summaries_created_at (created_at),
    -- Index for git commit queries
    INDEX idx_eval_run_summaries_git_commit (git_commit)
);

-- Create baseline_metrics table to store baseline for regression detection
CREATE TABLE IF NOT EXISTS baseline_metrics (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL DEFAULT 'main',
    pass_rate DECIMAL(5,4) NOT NULL,
    avg_citation_recall DECIMAL(5,4) NOT NULL,
    avg_checklist_coverage DECIMAL(5,4) NOT NULL,
    fixtures_total INTEGER NOT NULL,
    run_id VARCHAR(32) NOT NULL,
    git_commit VARCHAR(40) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one baseline per branch
    UNIQUE(branch_name)
);

-- Add RLS policies (even though this is internal testing data)
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_run_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies allowing authenticated users to insert eval data
-- (In production, might want to restrict to CI/CD service account only)
CREATE POLICY "Allow insert eval runs" ON eval_runs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Allow read eval runs" ON eval_runs
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Allow insert eval summaries" ON eval_run_summaries
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Allow read eval summaries" ON eval_run_summaries
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Allow all baseline operations" ON baseline_metrics
    FOR ALL TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Create function to update baseline after successful run
CREATE OR REPLACE FUNCTION update_baseline_metrics(
    p_run_id VARCHAR(32),
    p_branch_name VARCHAR(255) DEFAULT 'main'
) RETURNS VOID AS $$
DECLARE
    v_summary eval_run_summaries%ROWTYPE;
BEGIN
    -- Get the run summary
    SELECT * INTO v_summary
    FROM eval_run_summaries
    WHERE run_id = p_run_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Run ID % not found', p_run_id;
    END IF;
    
    -- Update or insert baseline
    INSERT INTO baseline_metrics (
        branch_name,
        pass_rate,
        avg_citation_recall,
        avg_checklist_coverage,
        fixtures_total,
        run_id,
        git_commit,
        updated_at
    ) VALUES (
        p_branch_name,
        v_summary.pass_rate,
        v_summary.avg_citation_recall,
        v_summary.avg_checklist_coverage,
        v_summary.fixtures_total,
        v_summary.run_id,
        v_summary.git_commit,
        NOW()
    )
    ON CONFLICT (branch_name) DO UPDATE SET
        pass_rate = EXCLUDED.pass_rate,
        avg_citation_recall = EXCLUDED.avg_citation_recall,
        avg_checklist_coverage = EXCLUDED.avg_checklist_coverage,
        fixtures_total = EXCLUDED.fixtures_total,
        run_id = EXCLUDED.run_id,
        git_commit = EXCLUDED.git_commit,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_baseline_metrics TO authenticated;