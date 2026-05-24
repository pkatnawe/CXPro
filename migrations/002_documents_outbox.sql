-- Documents and Outbox tables for Slice-03
-- PDF upload flow with Supabase Storage, status tracking, and transactional outbox

-- Documents table for tracking uploaded PDFs
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL CHECK (mime_type = 'application/pdf'),
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('uploaded', 'processing', 'indexed', 'failed')) DEFAULT 'uploaded',
    failure_reason TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Outbox table for transactional event emission
CREATE TABLE outbox (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on outbox (though it's internal, good practice)
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- Outbox dispatches tracking table for exactly-once processing
CREATE TABLE outbox_dispatches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    outbox_id UUID NOT NULL REFERENCES outbox(id) ON DELETE CASCADE,
    subscriber_name TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(outbox_id, subscriber_name)
);

-- Enable RLS on outbox_dispatches
ALTER TABLE outbox_dispatches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents (org-level isolation)
CREATE POLICY "Users can only see documents from their organization"
    ON documents
    FOR ALL
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- RLS Policies for outbox (only internal system access)
CREATE POLICY "System only access to outbox"
    ON outbox
    FOR ALL
    USING (false); -- Block all direct user access

-- RLS Policies for outbox_dispatches (only internal system access)
CREATE POLICY "System only access to outbox_dispatches"
    ON outbox_dispatches
    FOR ALL
    USING (false); -- Block all direct user access

-- Function to create document and outbox entry transactionally
CREATE OR REPLACE FUNCTION create_document_with_outbox(
    p_project_id UUID,
    p_filename TEXT,
    p_original_filename TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT,
    p_storage_path TEXT,
    p_uploaded_by UUID
) RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    -- Insert document record
    INSERT INTO documents (
        project_id, 
        filename, 
        original_filename, 
        file_size, 
        mime_type, 
        storage_path, 
        uploaded_by,
        status
    ) VALUES (
        p_project_id,
        p_filename,
        p_original_filename,
        p_file_size,
        p_mime_type,
        p_storage_path,
        p_uploaded_by,
        'uploaded'
    ) RETURNING id INTO document_id;
    
    -- Insert outbox event in same transaction
    INSERT INTO outbox (event_type, event_data)
    VALUES (
        'document_uploaded',
        jsonb_build_object(
            'document_id', document_id,
            'project_id', p_project_id,
            'filename', p_filename,
            'storage_path', p_storage_path,
            'uploaded_by', p_uploaded_by,
            'timestamp', now()
        )
    );
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update document status and emit events
CREATE OR REPLACE FUNCTION update_document_status(
    p_document_id UUID,
    p_status TEXT,
    p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    doc_record RECORD;
BEGIN
    -- Update document status
    UPDATE documents 
    SET status = p_status, 
        failure_reason = p_failure_reason,
        updated_at = now()
    WHERE id = p_document_id
    RETURNING * INTO doc_record;
    
    -- Emit corresponding event based on status
    IF p_status = 'indexed' THEN
        INSERT INTO outbox (event_type, event_data)
        VALUES (
            'document_indexed',
            jsonb_build_object(
                'document_id', p_document_id,
                'project_id', doc_record.project_id,
                'filename', doc_record.filename,
                'storage_path', doc_record.storage_path,
                'timestamp', now()
            )
        );
    ELSIF p_status = 'failed' THEN
        INSERT INTO outbox (event_type, event_data)
        VALUES (
            'document_failed',
            jsonb_build_object(
                'document_id', p_document_id,
                'project_id', doc_record.project_id,
                'filename', doc_record.filename,
                'failure_reason', p_failure_reason,
                'timestamp', now()
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for efficient queries
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_outbox_processed_at ON outbox(processed_at) WHERE processed_at IS NULL;
CREATE INDEX idx_outbox_created_at ON outbox(created_at);
CREATE INDEX idx_outbox_dispatches_outbox_subscriber ON outbox_dispatches(outbox_id, subscriber_name);

-- Enable Realtime for documents table
ALTER PUBLICATION supabase_realtime ADD TABLE documents;