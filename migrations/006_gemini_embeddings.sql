-- Migrate document_chunks.embedding from OpenAI ada-002 (1536) to
-- Gemini text-embedding-004 (768). Per the PRD the AI stack should be
-- Gemini end to end; Ralph's Slice-05 implementation used OpenAI by mistake.
--
-- pgvector cannot ALTER a vector(N) column to a different N, so we drop
-- and re-add the column (and the dependent ivfflat index + search function).
-- Any existing embeddings are lost; re-ingest documents after migrating.

BEGIN;

-- Drop the search function before changing column type (it references vector(1536)).
DROP FUNCTION IF EXISTS search_document_chunks(vector, real, integer);

-- Drop the dependent ivfflat index.
DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- Drop and re-add the embedding column at the new dimension.
ALTER TABLE document_chunks DROP COLUMN embedding;
ALTER TABLE document_chunks ADD COLUMN embedding vector(768);

-- Recreate the cosine-similarity index for the new dimension.
CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Recreate the search function with the new vector dimension.
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding vector(768),
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

COMMIT;
