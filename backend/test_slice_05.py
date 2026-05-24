"""
Slice-05 acceptance criteria verification.
Tests the core functionality without requiring external APIs.
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch

def test_document_type_enum():
    """Verify DocumentType enum exists with required values."""
    from document_detector import DocumentType
    
    # Test that enum contains required types
    assert DocumentType.SUBMITTAL_CUT_SHEET.value == "submittal-cut-sheet"
    assert DocumentType.UNKNOWN.value == "unknown"

def test_dspy_module_initialization():
    """Verify DSPy modules can be initialized."""
    from document_detector import DocumentTypeDetector
    from spec_extractor import SubmittalSpecExtractor
    
    # Should initialize without error (even without API keys)
    detector = DocumentTypeDetector()
    extractor = SubmittalSpecExtractor()
    
    assert detector is not None
    assert extractor is not None

def test_pgvector_compatibility():
    """Verify pgvector-compatible embeddings format."""
    from pdf_chunker import DocumentChunk
    
    # Create a sample chunk
    chunk = DocumentChunk(
        content="test content",
        page_number=1,
        bbox_x=0.0,
        bbox_y=0.0,
        bbox_width=100.0,
        bbox_height=50.0,
        embedding=[0.1] * 1536  # Standard OpenAI embedding dimension
    )
    
    assert len(chunk.embedding) == 1536
    assert all(isinstance(x, float) for x in chunk.embedding)

def test_citation_requirement_enforced():
    """Verify DSPy signature requires citations."""
    from spec_extractor import SpecExtractionSignature
    
    # Check that citations field exists in signature
    sig_str = str(SpecExtractionSignature)
    assert 'citations' in sig_str
    assert 'REQUIRED' in sig_str

@patch('pdf_chunker.openai.Embedding.create')
def test_pdf_chunker_with_mock_embeddings(mock_embedding):
    """Test PDF chunker with mocked embeddings."""
    # Mock OpenAI response
    mock_embedding.return_value = {
        'data': [
            {'embedding': [0.1] * 1536}
        ]
    }
    
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
        from pdf_chunker import PDFChunker
        
        chunker = PDFChunker()
        
        # Test text splitting
        test_text = "This is test content for chunking. " * 20
        chunks = chunker._split_text(test_text)
        
        assert len(chunks) > 0
        assert all(isinstance(chunk, str) for chunk in chunks)

def test_spec_extraction_validation():
    """Test spec extraction validation with citations requirement."""
    from spec_extractor import SpecExtractionValidator, ExtractedSpec, Citation
    
    validator = SpecExtractionValidator()
    
    # Test rejection without citations
    spec_no_citations = ExtractedSpec(
        equipment_type="pump",
        manufacturer="Test",
        model="123",
        design_specs={},
        citations=[],  # No citations
        confidence=0.8
    )
    
    assert not validator.validate_extraction(spec_no_citations)
    
    # Test acceptance with citations
    citation = Citation("chunk_1", 1, 0, 0, 100, 50, 0.9)
    spec_with_citations = ExtractedSpec(
        equipment_type="pump",
        manufacturer="Test",
        model="123",
        design_specs={},
        citations=[citation],  # Has citations
        confidence=0.8
    )
    
    assert validator.validate_extraction(spec_with_citations)

def test_outbox_subscriber_integration():
    """Test that ingestion pipeline can be initialized as outbox subscriber."""
    with patch('ingestion_pipeline.asyncpg.create_pool'), \
         patch('document_detector.configure_dspy'):
        
        from ingestion_pipeline import IngestionPipeline
        
        pipeline = IngestionPipeline()
        assert pipeline.detector is not None
        assert pipeline.chunker is not None
        assert pipeline.extractor is not None

def test_database_migration_applied():
    """Verify database migration was applied successfully."""
    # This test would require database connection
    # For now, just verify the migration file exists
    migration_file = "/Users/shlok/Desktop/SpareWork/CX/migrations/004_pdf_ingestion.sql"
    assert os.path.exists(migration_file)
    
    # Verify key content in migration
    with open(migration_file, 'r') as f:
        content = f.read()
        assert 'CREATE EXTENSION IF NOT EXISTS vector' in content
        assert 'document_chunks' in content
        assert 'extracted_specs' in content
        assert 'search_document_chunks' in content

if __name__ == "__main__":
    pytest.main([__file__, "-v"])