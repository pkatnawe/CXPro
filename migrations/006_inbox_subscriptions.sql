-- Slice-07: Inbox-as-home with subscriptions and inbox items

-- Subscriptions table - users subscribe to specific event types
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- What to subscribe to
    event_type text NOT NULL,
    resource_type text, -- Optional: filter by resource type (e.g., 'agent_run')
    
    -- Subscription metadata
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    
    -- Ensure unique subscription per user/project/event combo
    UNIQUE(user_id, project_id, event_type, resource_type)
);

-- Inbox items - materialized notifications for users
CREATE TABLE IF NOT EXISTS inbox_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Source of the inbox item
    source_event_type text NOT NULL,
    source_resource_id uuid,
    source_resource_type text,
    
    -- Item metadata
    title text NOT NULL,
    description text,
    item_type text NOT NULL CHECK (item_type IN ('ai_draft', 'ai_refusal', 'other')),
    action_state text NOT NULL CHECK (action_state IN ('pending', 'acted', 'dismissed')),
    
    -- Linked entities
    test_procedure_instance_id uuid REFERENCES test_procedure_instances(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
    
    -- Display metadata
    metadata jsonb, -- Additional data for rendering (e.g., asset_tag, manufacturer)
    priority integer DEFAULT 0, -- Higher number = higher priority
    bucket_date date DEFAULT CURRENT_DATE, -- For daily bucketing
    
    -- Timestamps
    created_at timestamptz DEFAULT now() NOT NULL,
    acted_at timestamptz,
    
    -- RLS
    org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_project ON subscriptions(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_event_type ON subscriptions(event_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_inbox_items_user ON inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_project ON inbox_items(project_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_action_state ON inbox_items(action_state);
CREATE INDEX IF NOT EXISTS idx_inbox_items_bucket_date ON inbox_items(bucket_date DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_items_pending ON inbox_items(user_id, action_state) WHERE action_state = 'pending';

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY subscriptions_select ON subscriptions
    FOR SELECT
    USING (user_id = auth.uid() OR org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY subscriptions_insert ON subscriptions
    FOR INSERT
    WITH CHECK (user_id = auth.uid() AND org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY subscriptions_update ON subscriptions
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY subscriptions_delete ON subscriptions
    FOR DELETE
    USING (user_id = auth.uid());

-- RLS policies for inbox_items
CREATE POLICY inbox_items_select ON inbox_items
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY inbox_items_insert ON inbox_items
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY inbox_items_update ON inbox_items
    FOR UPDATE
    USING (user_id = auth.uid());

-- Function to auto-create subscriptions for OCA users on project assignment
CREATE OR REPLACE FUNCTION auto_subscribe_oca_to_project()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role text;
    v_org_id uuid;
BEGIN
    -- Get user's role and org_id
    SELECT m.role, m.org_id INTO v_user_role, v_org_id
    FROM memberships m
    WHERE m.user_id = NEW.user_id
    AND m.org_id = (SELECT org_id FROM projects WHERE id = NEW.project_id);
    
    -- Only auto-subscribe OCA users
    IF v_user_role = 'OCA' THEN
        -- Subscribe to AgentRunCompleted events
        INSERT INTO subscriptions (user_id, project_id, event_type, resource_type, org_id)
        VALUES (NEW.user_id, NEW.project_id, 'AgentRunCompleted', 'agent_run', v_org_id)
        ON CONFLICT (user_id, project_id, event_type, resource_type) DO NOTHING;
        
        -- Subscribe to AIRefusal events
        INSERT INTO subscriptions (user_id, project_id, event_type, resource_type, org_id)
        VALUES (NEW.user_id, NEW.project_id, 'AIRefusal', 'agent_run', v_org_id)
        ON CONFLICT (user_id, project_id, event_type, resource_type) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-subscription on participation creation
CREATE TRIGGER auto_subscribe_on_participation
    AFTER INSERT ON participations
    FOR EACH ROW
    EXECUTE FUNCTION auto_subscribe_oca_to_project();

-- Function to create inbox item from agent run completed event
CREATE OR REPLACE FUNCTION create_inbox_item_from_agent_run(
    p_event_payload jsonb,
    p_event_type text
) RETURNS void AS $$
DECLARE
    v_project_id uuid;
    v_agent_run_id uuid;
    v_test_procedure_id uuid;
    v_document_id uuid;
    v_subscription record;
    v_item_type text;
    v_title text;
    v_description text;
    v_metadata jsonb;
    v_refusal_reason text;
    v_document_name text;
    v_equipment_type text;
    v_asset_tag text;
BEGIN
    -- Extract IDs from event payload
    v_project_id := (p_event_payload->>'project_id')::uuid;
    v_agent_run_id := (p_event_payload->>'agent_run_id')::uuid;
    v_document_id := (p_event_payload->>'document_id')::uuid;
    
    IF p_event_type = 'AgentRunCompleted' THEN
        v_test_procedure_id := (p_event_payload->>'test_procedure_instance_id')::uuid;
        v_item_type := 'ai_draft';
        
        -- Get document and test procedure metadata
        SELECT d.name INTO v_document_name 
        FROM documents d WHERE d.id = v_document_id;
        
        SELECT tpi.equipment_type, tpi.asset_tag 
        INTO v_equipment_type, v_asset_tag
        FROM test_procedure_instances tpi 
        WHERE tpi.id = v_test_procedure_id;
        
        v_title := 'AI drafted checklist for ' || COALESCE(v_equipment_type, 'equipment');
        v_description := 'Review the AI-generated checklist from ' || COALESCE(v_document_name, 'uploaded document');
        v_metadata := jsonb_build_object(
            'asset_tag', v_asset_tag,
            'equipment_type', v_equipment_type,
            'document_name', v_document_name
        );
        
    ELSIF p_event_type = 'AIRefusal' THEN
        v_item_type := 'ai_refusal';
        v_refusal_reason := p_event_payload->>'refusal_reason';
        
        -- Get document name
        SELECT d.name INTO v_document_name 
        FROM documents d WHERE d.id = v_document_id;
        
        v_title := 'AI needs more information';
        v_description := 'Unable to generate checklist: ' || COALESCE(v_refusal_reason, 'Low confidence in available documents');
        v_metadata := jsonb_build_object(
            'refusal_reason', v_refusal_reason,
            'document_name', v_document_name
        );
    ELSE
        RETURN; -- Unknown event type, skip
    END IF;
    
    -- Find all active subscriptions for this event type in this project
    FOR v_subscription IN
        SELECT s.user_id, s.org_id
        FROM subscriptions s
        WHERE s.project_id = v_project_id
        AND s.event_type = p_event_type
        AND s.active = true
    LOOP
        -- Create inbox item for each subscribed user
        INSERT INTO inbox_items (
            user_id,
            project_id,
            source_event_type,
            source_resource_id,
            source_resource_type,
            title,
            description,
            item_type,
            action_state,
            test_procedure_instance_id,
            document_id,
            agent_run_id,
            metadata,
            org_id
        ) VALUES (
            v_subscription.user_id,
            v_project_id,
            p_event_type,
            v_agent_run_id,
            'agent_run',
            v_title,
            v_description,
            v_item_type,
            'pending',
            v_test_procedure_id,
            v_document_id,
            v_agent_run_id,
            v_metadata,
            v_subscription.org_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark inbox item as acted
CREATE OR REPLACE FUNCTION mark_inbox_item_acted(
    p_inbox_item_id uuid,
    p_user_id uuid
) RETURNS void AS $$
BEGIN
    UPDATE inbox_items
    SET action_state = 'acted',
        acted_at = now()
    WHERE id = p_inbox_item_id
    AND user_id = p_user_id
    AND action_state = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Update trigger for inbox items to notify via realtime
CREATE OR REPLACE FUNCTION notify_inbox_item_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the specific user channel about inbox changes
    PERFORM pg_notify(
        'inbox_' || NEW.user_id::text,
        json_build_object(
            'action', TG_OP,
            'item_id', NEW.id,
            'project_id', NEW.project_id,
            'item_type', NEW.item_type
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inbox_items_notify
    AFTER INSERT OR UPDATE ON inbox_items
    FOR EACH ROW
    EXECUTE FUNCTION notify_inbox_item_change();