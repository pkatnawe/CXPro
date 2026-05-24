"""
PDF chunker for Slice-05.
Extracts text chunks from PDFs with positioning metadata and generates embeddings.
"""

import fitz  # PyMuPDF
import numpy as np
from typing import List, Dict, Any, Tuple
import openai
import os
from dataclasses import dataclass


@dataclass
class DocumentChunk:
    """Represents a chunk of text from a PDF with metadata."""
    content: str
    page_number: int
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float
    embedding: List[float]


class PDFChunker:
    """
    Chunks PDF documents into text segments with positioning metadata
    and generates embeddings for vector similarity search.
    """
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._setup_openai()
    
    def _setup_openai(self):
        """Configure OpenAI for embeddings."""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable required for embeddings")
        
        openai.api_key = api_key
    
    def process_pdf(self, pdf_path: str) -> List[DocumentChunk]:
        """
        Process a PDF file and extract chunks with embeddings.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of DocumentChunk objects with content, position, and embeddings
        """
        chunks = []
        
        try:
            doc = fitz.open(pdf_path)
            
            for page_num in range(len(doc)):
                page_chunks = self._extract_page_chunks(doc, page_num)
                chunks.extend(page_chunks)
            
            doc.close()
            
            # Generate embeddings for all chunks
            self._add_embeddings(chunks)
            
            return chunks
            
        except Exception as e:
            print(f"Error processing PDF {pdf_path}: {e}")
            return []
    
    def _extract_page_chunks(self, doc: fitz.Document, page_num: int) -> List[DocumentChunk]:
        """Extract text chunks from a single PDF page."""
        page = doc[page_num]
        page_text = page.get_text()
        
        if not page_text.strip():
            return []
        
        # Get page dimensions for normalized coordinates
        page_rect = page.rect
        
        # Split text into chunks
        text_chunks = self._split_text(page_text)
        
        chunks = []
        for i, chunk_text in enumerate(text_chunks):
            if not chunk_text.strip():
                continue
            
            # Estimate bounding box for this chunk
            # For simplicity, distribute chunks vertically across the page
            chunk_height = page_rect.height / max(len(text_chunks), 1)
            y_position = i * chunk_height
            
            chunk = DocumentChunk(
                content=chunk_text.strip(),
                page_number=page_num + 1,  # 1-indexed
                bbox_x=0.0,
                bbox_y=y_position,
                bbox_width=page_rect.width,
                bbox_height=chunk_height,
                embedding=[]  # Will be filled later
            )
            
            chunks.append(chunk)
        
        return chunks
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        if not text:
            return []
        
        # Simple character-based chunking with overlap
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at word boundary
            if end < len(text):
                # Look backwards for a space or punctuation
                for i in range(end, max(start, end - 100), -1):
                    if text[i] in ' \n\t.!?;:':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start forward with overlap
            start = end - self.chunk_overlap
            if start <= 0:
                start = end
        
        return chunks
    
    def _add_embeddings(self, chunks: List[DocumentChunk]):
        """Generate embeddings for all chunks using OpenAI API."""
        if not chunks:
            return
        
        # Batch process embeddings
        texts = [chunk.content for chunk in chunks]
        embeddings = self._get_embeddings_batch(texts)
        
        # Assign embeddings back to chunks
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding
    
    def _get_embeddings_batch(self, texts: List[str], model: str = "text-embedding-ada-002") -> List[List[float]]:
        """Get embeddings for a batch of texts."""
        try:
            # OpenAI embedding API
            response = openai.Embedding.create(
                model=model,
                input=texts
            )
            
            return [item['embedding'] for item in response['data']]
            
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            # Return zero embeddings as fallback
            embedding_dim = 1536  # ada-002 dimension
            return [[0.0] * embedding_dim for _ in texts]
    
    def get_chunk_metadata(self, chunk: DocumentChunk) -> Dict[str, Any]:
        """Get metadata dictionary for database storage."""
        return {
            'content': chunk.content,
            'page_number': chunk.page_number,
            'bbox_x': chunk.bbox_x,
            'bbox_y': chunk.bbox_y,
            'bbox_width': chunk.bbox_width,
            'bbox_height': chunk.bbox_height,
            'embedding': chunk.embedding
        }


# Example usage and testing
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    chunker = PDFChunker()
    print("PDF chunker initialized successfully")
    print(f"Chunk size: {chunker.chunk_size}, Overlap: {chunker.chunk_overlap}")
    
    # Test with a sample text
    test_text = "This is a test document. " * 50
    chunks = chunker._split_text(test_text)
    print(f"Sample text split into {len(chunks)} chunks")