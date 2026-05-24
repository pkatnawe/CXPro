"""
PDF ingestion pipeline for Slice-05.
Consumes DocumentUploaded events and processes PDFs through:
1. Document type detection
2. PDF chunking with embeddings
3. Spec extraction for submittal cut sheets
"""

import asyncio
import asyncpg
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv

from document_detector import DocumentTypeDetector, DocumentType, configure_dspy
from pdf_chunker import PDFChunker
from spec_extractor import SubmittalSpecExtractor, SpecExtractionValidator


class IngestionPipeline:
    """
    Main ingestion pipeline that processes DocumentUploaded events.
    Implements the complete Slice-05 processing workflow.
    """
    
    def __init__(self):
        self.detector = DocumentTypeDetector()
        self.chunker = PDFChunker()
        self.extractor = SubmittalSpecExtractor()
        self.validator = SpecExtractionValidator()
        self.db_pool = None
        
        # Configure DSPy for AI modules
        configure_dspy()
    
    async def start(self):
        """Start the ingestion pipeline."""
        # Set up database connection
        await self._setup_database()
        
        # Register as outbox subscriber
        await self._register_subscriber()
        
        print("Ingestion pipeline started, listening for document_uploaded events...")
        
        # Start event processing loop
        await self._process_events()
    
    async def _setup_database(self):
        """Set up database connection pool."""
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        self.db_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
    
    async def _register_subscriber(self):
        """Register this pipeline as an outbox subscriber."""
        subscriber_name = "ingestion_pipeline"
        
        async with self.db_pool.acquire() as conn:
            # Check if we need to create a subscriber registry table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS outbox_subscribers (
                    name TEXT PRIMARY KEY,
                    event_types TEXT[] NOT NULL,
                    last_processed_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
            """)
            
            # Register this subscriber for document_uploaded events
            await conn.execute("""
                INSERT INTO outbox_subscribers (name, event_types)
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET event_types = $2;
            """, subscriber_name, ['document_uploaded'])
    
    async def _process_events(self):
        """Main event processing loop."""
        subscriber_name = "ingestion_pipeline"
        
        while True:
            try:
                # Get unprocessed events
                events = await self._get_unprocessed_events(subscriber_name)
                
                for event in events:
                    await self._process_document_uploaded(event)
                    await self._mark_event_processed(event['id'], subscriber_name)
                
                # Wait before next poll
                await asyncio.sleep(5)
                
            except Exception as e:
                print(f"Error in event processing loop: {e}")
                await asyncio.sleep(10)
    
    async def _get_unprocessed_events(self, subscriber_name: str) -> List[Dict[str, Any]]:
        """Get unprocessed document_uploaded events."""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT o.id, o.event_type, o.event_data, o.created_at
                FROM outbox o
                WHERE o.event_type = 'document_uploaded'
                AND NOT EXISTS (
                    SELECT 1 FROM outbox_dispatches od
                    WHERE od.outbox_id = o.id AND od.subscriber_name = $1
                )
                ORDER BY o.created_at ASC
                LIMIT 10;
            """, subscriber_name)
            
            return [dict(row) for row in rows]
    
    async def _mark_event_processed(self, event_id: str, subscriber_name: str):
        """Mark an event as processed by this subscriber."""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO outbox_dispatches (outbox_id, subscriber_name)
                VALUES ($1, $2)
                ON CONFLICT (outbox_id, subscriber_name) DO NOTHING;
            """, event_id, subscriber_name)
    
    async def _process_document_uploaded(self, event: Dict[str, Any]):
        """Process a single document_uploaded event."""
        event_data = event['event_data']
        document_id = event_data['document_id']
        storage_path = event_data['storage_path']
        
        print(f"Processing document {document_id}: {storage_path}")
        
        try:
            # Update document status to processing
            await self._update_document_status(document_id, 'processing')
            
            # Step 1: Detect document type
            document_type = self._detect_document_type(storage_path)
            print(f"Detected document type: {document_type.value}")
            
            # Step 2: Chunk the PDF and generate embeddings
            chunks = self.chunker.process_pdf(storage_path)
            print(f"Generated {len(chunks)} chunks")
            
            # Step 3: Store chunks in database
            chunk_ids = await self._store_chunks(document_id, chunks)
            
            # Step 4: Extract specifications if it's a submittal cut sheet
            if document_type == DocumentType.SUBMITTAL_CUT_SHEET:
                await self._extract_and_store_specs(document_id, chunks, chunk_ids)
            
            # Step 5: Update document status to indexed
            await self._update_document_status(document_id, 'indexed')
            
            print(f"Successfully processed document {document_id}")
            
        except Exception as e:
            print(f"Error processing document {document_id}: {e}")
            await self._update_document_status(document_id, 'failed', str(e))
    
    def _detect_document_type(self, storage_path: str) -> DocumentType:
        """Detect document type using DSPy classifier."""
        try:
            return self.detector.forward(storage_path)
        except Exception as e:
            print(f"Document type detection failed: {e}")
            return DocumentType.UNKNOWN
    
    async def _store_chunks(self, document_id: str, chunks: List) -> List[str]:
        """Store document chunks in database and return chunk IDs."""
        chunk_ids = []
        
        async with self.db_pool.acquire() as conn:
            for chunk in chunks:
                chunk_id = await conn.fetchval("""
                    INSERT INTO document_chunks (
                        document_id, content, embedding, page_number,
                        bbox_x, bbox_y, bbox_width, bbox_height
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id;
                """, 
                    document_id,
                    chunk.content,
                    chunk.embedding,
                    chunk.page_number,
                    chunk.bbox_x,
                    chunk.bbox_y,
                    chunk.bbox_width,
                    chunk.bbox_height
                )
                
                chunk_ids.append(str(chunk_id))
        
        return chunk_ids
    
    async def _extract_and_store_specs(self, document_id: str, chunks: List, chunk_ids: List[str]):
        """Extract specifications for submittal cut sheet and store in database."""
        try:
            # Prepare chunks for extraction
            chunk_data = []
            for chunk, chunk_id in zip(chunks, chunk_ids):
                chunk_info = {
                    'id': chunk_id,
                    'content': chunk.content,
                    'page_number': chunk.page_number,
                    'bbox_x': chunk.bbox_x,
                    'bbox_y': chunk.bbox_y,
                    'bbox_width': chunk.bbox_width,
                    'bbox_height': chunk.bbox_height
                }
                chunk_data.append(chunk_info)
            
            # Extract specifications
            extracted_spec = self.extractor.forward(chunk_data)
            
            # Validate extraction
            if not self.validator.validate_extraction(extracted_spec):
                print(f"Spec extraction failed validation for document {document_id}")
                return
            
            # Store extracted specs
            async with self.db_pool.acquire() as conn:
                spec_id = await conn.fetchval("""
                    INSERT INTO extracted_specs (
                        document_id, equipment_type, manufacturer, model,
                        design_specs, extraction_confidence
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id;
                """,
                    document_id,
                    extracted_spec.equipment_type,
                    extracted_spec.manufacturer,
                    extracted_spec.model,
                    json.dumps(extracted_spec.design_specs),
                    extracted_spec.confidence
                )
                
                print(f"Stored extracted specs {spec_id} for document {document_id}")
            
        except Exception as e:
            print(f"Spec extraction failed for document {document_id}: {e}")
    
    async def _update_document_status(self, document_id: str, status: str, failure_reason: Optional[str] = None):
        """Update document processing status."""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                SELECT update_document_status($1, $2, $3);
            """, document_id, status, failure_reason)


async def main():
    """Main entry point for the ingestion pipeline."""
    load_dotenv()
    
    pipeline = IngestionPipeline()
    await pipeline.start()


if __name__ == "__main__":
    asyncio.run(main())