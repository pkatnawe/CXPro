-- Asset Registry tables: spaces, asset_types, systems, asset_system_memberships, assets, points
-- Follows the participations-based RLS pattern from migrations 001-017

-- spaces: recursive location hierarchy (campus, building, floor, wing, department, data_hall, rack_row, room)
CREATE TABLE spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_space_id UUID REFERENCES spaces(id) ON DELETE RESTRICT,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    ordinal INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, parent_space_id, name),
    CHECK (parent_space_id != id)
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spaces_select" ON spaces FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = spaces.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "spaces_insert" ON spaces FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = spaces.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "spaces_update" ON spaces FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = spaces.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "spaces_delete" ON spaces FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = spaces.project_id
        AND participations.user_id = auth.uid()
    ));

-- asset_types: catalog templates for classes of Asset
CREATE TABLE asset_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    expected_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, name)
);

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_types_select" ON asset_types FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = asset_types.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "asset_types_insert" ON asset_types FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = asset_types.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "asset_types_update" ON asset_types FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = asset_types.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "asset_types_delete" ON asset_types FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = asset_types.project_id
        AND participations.user_id = auth.uid()
    ));

-- systems: logical groupings of Assets (recursive tree via parent_system_id)
CREATE TABLE systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_system_id UUID REFERENCES systems(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, parent_system_id, name)
);

ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "systems_select" ON systems FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = systems.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "systems_insert" ON systems FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = systems.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "systems_update" ON systems FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = systems.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "systems_delete" ON systems FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = systems.project_id
        AND participations.user_id = auth.uid()
    ));

-- assets: physical/logical equipment (recursive tree via parent_asset_id)
CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_asset_id UUID REFERENCES assets(id) ON DELETE RESTRICT,
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    tag TEXT NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired', 'decommissioned')),
    manufacturer TEXT,
    model TEXT,
    serial TEXT,
    nameplate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    retired_at TIMESTAMPTZ,
    decommissioned_at TIMESTAMPTZ
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_assets_tag_active ON assets (project_id, tag)
    WHERE status != 'retired';

CREATE POLICY "assets_select" ON assets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = assets.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "assets_insert" ON assets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = assets.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "assets_update" ON assets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = assets.project_id
        AND participations.user_id = auth.uid()
    ));

CREATE POLICY "assets_delete" ON assets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM participations
        WHERE participations.project_id = assets.project_id
        AND participations.user_id = auth.uid()
    ));

-- asset_system_memberships: many-to-many Asset <-> System
CREATE TABLE asset_system_memberships (
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (asset_id, system_id)
);

ALTER TABLE asset_system_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_system_memberships_select" ON asset_system_memberships FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = asset_system_memberships.asset_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "asset_system_memberships_insert" ON asset_system_memberships FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = asset_system_memberships.asset_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "asset_system_memberships_delete" ON asset_system_memberships FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = asset_system_memberships.asset_id
        AND p.user_id = auth.uid()
    ));

-- points: signal-level tags owned by an Asset (ISA-S5.1)
CREATE TABLE points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    description TEXT,
    signal_type TEXT,
    range_low NUMERIC,
    range_high NUMERIC,
    engineering_units TEXT,
    last_cal_date DATE,
    cal_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (asset_id, tag)
);

ALTER TABLE points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_select" ON points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = points.asset_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "points_insert" ON points FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = points.asset_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "points_update" ON points FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = points.asset_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "points_delete" ON points FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM assets a
        JOIN participations p ON p.project_id = a.project_id
        WHERE a.id = points.asset_id
        AND p.user_id = auth.uid()
    ));

-- Indexes for common queries
CREATE INDEX idx_spaces_project_id ON spaces(project_id);
CREATE INDEX idx_spaces_parent_space_id ON spaces(parent_space_id);
CREATE INDEX idx_asset_types_project_id ON asset_types(project_id);
CREATE INDEX idx_systems_project_id ON systems(project_id);
CREATE INDEX idx_systems_parent_system_id ON systems(parent_system_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_parent_asset_id ON assets(parent_asset_id);
CREATE INDEX idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX idx_assets_space_id ON assets(space_id);
CREATE INDEX idx_assets_status ON assets(project_id, status);
CREATE INDEX idx_asset_system_memberships_system_id ON asset_system_memberships(system_id);
CREATE INDEX idx_points_asset_id ON points(asset_id);
