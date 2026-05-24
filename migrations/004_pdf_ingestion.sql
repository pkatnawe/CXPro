-- PDF Ingestion pipeline tables for Slice-05
-- Document chunks with pgvector embeddings and ExtractedSpec data

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table for PDF content with embeddings
CREATE TABLE document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    page_number INTEGER NOT NULL,
    bbox_x REAL NOT NULL,
    bbox_y REAL NOT NULL,
    bbox_width REAL NOT NULL,
    bbox_height REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Extracted specifications table for submittal cut sheets
CREATE TABLE extracted_specs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    equipment_type TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    design_specs JSONB NOT NULL,
    extracted_at TIMESTAMPTZ DEFAULT now(),
    extraction_confidence REAL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1)
);

-- Enable RLS on extracted_specs
ALTER TABLE extracted_specs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_chunks (org-level isolation)
CREATE POLICY "Users can only see chunks from their organization documents"
    ON document_chunks
    FOR ALL
    USING (
        document_id IN (
            SELECT d.id FROM documents d
            INNER JOIN projects p ON p.id = d.project_id
            INNER JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- RLS Policies for extracted_specs (org-level isolation)  
CREATE POLICY "Users can only see extracted specs from their organization documents"
    ON extracted_specs
    FOR ALL
    USING (
        document_id IN (
            SELECT d.id FROM documents d
            INNER JOIN projects p ON p.id = d.project_id
            INNER JOIN memberships m ON m.org_id = p.org_id
            WHERE m.user_id = auth.uid()
        )
    );

-- Indexes for efficient queries
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_page ON document_chunks(document_id, page_number);
CREATE INDEX idx_extracted_specs_document_id ON extracted_specs(document_id);
CREATE INDEX idx_extracted_specs_equipment ON extracted_specs(equipment_type, manufacturer, model);

-- Vector similarity index for semantic search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to perform similarity search on document chunks
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding vector(1536),
    similarity_threshold REAL DEFAULT 0.8,
    max_results INTEGER DEFAULT 10
) RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    content TEXT,
    similarity REAL,
    page_number INTEGER,
    bbox_x REAL,
    bbox_y REAL,
    bbox_width REAL,
    bbox_height REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) as similarity,
        dc.page_number,
        dc.bbox_x,
        dc.bbox_y,
        dc.bbox_width,
        dc.bbox_height
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    INNER JOIN projects p ON p.id = d.project_id
    INNER JOIN memberships m ON m.org_id = p.org_id
    WHERE m.user_id = auth.uid()
    AND 1 - (dc.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;