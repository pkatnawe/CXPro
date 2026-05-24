-- Outbox Dispatcher Infrastructure for Slice-04
-- NOTIFY/LISTEN + fallback poll system with idempotency tracking

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_unprocessed_outbox_events(TEXT, INTEGER);
DROP FUNCTION IF EXISTS mark_event_dispatched(UUID, TEXT);
DROP FUNCTION IF EXISTS is_event_dispatched(UUID, TEXT);

-- Function to notify subscribers when new outbox events are created
CREATE OR REPLACE FUNCTION notify_outbox_events()
RETURNS trigger AS $$
BEGIN
    -- Notify all subscribers about the new outbox event
    PERFORM pg_notify('outbox_events', json_build_object(
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'created_at', NEW.created_at
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-notify on outbox inserts
DROP TRIGGER IF EXISTS outbox_notify_trigger ON outbox;
CREATE TRIGGER outbox_notify_trigger
    AFTER INSERT ON outbox
    FOR EACH ROW
    EXECUTE FUNCTION notify_outbox_events();

-- Function to get unprocessed outbox events for a subscriber
CREATE OR REPLACE FUNCTION get_unprocessed_outbox_events(p_subscriber_name TEXT, p_limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    event_data JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.event_type, o.event_data, o.created_at
    FROM outbox o
    LEFT JOIN outbox_dispatches od ON od.outbox_id = o.id AND od.subscriber_name = p_subscriber_name
    WHERE od.id IS NULL -- Not yet dispatched to this subscriber
    ORDER BY o.created_at ASC
    LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark an event as dispatched (idempotency-safe)
CREATE OR REPLACE FUNCTION mark_event_dispatched(
    p_event_id UUID,
    p_subscriber_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    row_count INTEGER;
BEGIN
    INSERT INTO outbox_dispatches (outbox_id, subscriber_name)
    VALUES (p_event_id, p_subscriber_name)
    ON CONFLICT (outbox_id, subscriber_name) DO NOTHING;
    
    -- Return true if the insert happened (was not duplicate)
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an event has been dispatched to a subscriber
CREATE OR REPLACE FUNCTION is_event_dispatched(
    p_event_id UUID,
    p_subscriber_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM outbox_dispatches 
        WHERE outbox_id = p_event_id AND subscriber_name = p_subscriber_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for cleanup of old dispatched events (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_outbox_events(older_than_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete outbox events older than specified days that have been dispatched to all known subscribers
    WITH dispatched_events AS (
        SELECT outbox_id
        FROM outbox_dispatches
        GROUP BY outbox_id
        HAVING COUNT(DISTINCT subscriber_name) >= 2 -- Assuming 2 subscribers: nextjs and python
    )
    DELETE FROM outbox o
    WHERE o.created_at < (now() - interval '1 day' * older_than_days)
    AND o.id IN (SELECT outbox_id FROM dispatched_events);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for efficient polling queries (simplified)
CREATE INDEX IF NOT EXISTS idx_outbox_created_at_processing 
ON outbox(created_at);

-- Add index for efficient subscriber queries
CREATE INDEX IF NOT EXISTS idx_outbox_dispatches_subscriber_created 
ON outbox_dispatches(subscriber_name, dispatched_at);