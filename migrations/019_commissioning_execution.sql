-- Commissioning Execution tables: test_procedure_templates, asset_type_template_links, test_procedure_instances
-- Follows the participations-based RLS pattern from migrations 001-018

-- test_procedure_templates: authored checklists/test procedures (L1-L5)
CREATE TABLE test_procedure_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4', 'L5')),
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, name)
);

ALTER TABLE test_procedure_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_procedure_templates_select" ON test_procedure_templates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_templates.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_templates_insert" ON test_procedure_templates FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_templates.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_templates_update" ON test_procedure_templates FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_templates.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_templates_delete" ON test_procedure_templates FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_templates.project_id
        AND participations.user_id = auth.uid()
    ));

-- asset_type_template_links: m2m link between AssetType and TestProcedureTemplate
CREATE TABLE asset_type_template_links (
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
    test_procedure_template_id UUID NOT NULL REFERENCES test_procedure_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (asset_type_id, test_procedure_template_id)
);

ALTER TABLE asset_type_template_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_type_template_links_select" ON asset_type_template_links FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM test_procedure_templates tpt
        JOIN participations p ON p.project_id = tpt.project_id
        WHERE tpt.id = asset_type_template_links.test_procedure_template_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "asset_type_template_links_insert" ON asset_type_template_links FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM test_procedure_templates tpt
        JOIN participations p ON p.project_id = tpt.project_id
        WHERE tpt.id = asset_type_template_links.test_procedure_template_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "asset_type_template_links_delete" ON asset_type_template_links FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM test_procedure_templates tpt
        JOIN participations p ON p.project_id = tpt.project_id
        WHERE tpt.id = asset_type_template_links.test_procedure_template_id
        AND p.user_id = auth.uid()
    ));

-- test_procedure_instances: individual executions of a template against an Asset or System
CREATE TABLE test_procedure_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES test_procedure_templates(id) ON DELETE RESTRICT,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    level TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    CHECK ((asset_id IS NOT NULL) != (system_id IS NOT NULL))
);

ALTER TABLE test_procedure_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_procedure_instances_select" ON test_procedure_instances FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_instances.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_instances_insert" ON test_procedure_instances FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_instances.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_instances_update" ON test_procedure_instances FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_instances.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "test_procedure_instances_delete" ON test_procedure_instances FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = test_procedure_instances.project_id
        AND participations.user_id = auth.uid()
    ));

-- Indexes for common queries
CREATE INDEX idx_test_procedure_templates_project_id ON test_procedure_templates(project_id);
CREATE INDEX idx_test_procedure_templates_level ON test_procedure_templates(project_id, level);
CREATE INDEX idx_asset_type_template_links_template_id ON asset_type_template_links(test_procedure_template_id);
CREATE INDEX idx_asset_type_template_links_asset_type_id ON asset_type_template_links(asset_type_id);
CREATE INDEX idx_test_procedure_instances_project_id ON test_procedure_instances(project_id);
CREATE INDEX idx_test_procedure_instances_template_id ON test_procedure_instances(template_id);
CREATE INDEX idx_test_procedure_instances_asset_id ON test_procedure_instances(asset_id);
CREATE INDEX idx_test_procedure_instances_system_id ON test_procedure_instances(system_id);
CREATE INDEX idx_test_procedure_instances_status ON test_procedure_instances(project_id, status);
