"""
ExtractedSpec extractor for Slice-05.
DSPy module that extracts structured specifications from submittal cut sheets.
REQUIRES citations to be included in the output.
"""

import dspy
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json


@dataclass
class Citation:
    """Citation linking extracted data to source chunks."""
    chunk_id: str
    page_number: int
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float
    relevance_score: float


@dataclass  
class ExtractedSpec:
    """Structured specification data extracted from submittal cut sheet."""
    equipment_type: str
    manufacturer: str
    model: str
    design_specs: Dict[str, Any]
    citations: List[Citation]
    confidence: float


class SpecExtractionSignature(dspy.Signature):
    """Extract structured specifications from submittal cut sheet chunks with required citations."""
    
    document_chunks = dspy.InputField(desc="List of text chunks from the submittal cut sheet document")
    equipment_type = dspy.OutputField(desc="Type of equipment (e.g., 'pump', 'valve', 'motor', 'filter')")
    manufacturer = dspy.OutputField(desc="Equipment manufacturer name")
    model = dspy.OutputField(desc="Equipment model number or name")
    design_specifications = dspy.OutputField(
        desc="JSON object with design specifications (capacity, pressure, materials, dimensions, etc.)"
    )
    citations = dspy.OutputField(
        desc="REQUIRED: JSON array of citations linking each extracted field to specific chunks. Format: [{'field': 'manufacturer', 'chunk_index': 0, 'confidence': 0.9}, ...]"
    )


class SubmittalSpecExtractor(dspy.Module):
    """
    DSPy module for extracting specifications from submittal cut sheets.
    Enforces citation requirements and structured output.
    """
    
    def __init__(self):
        super().__init__()
        self.extractor = dspy.ChainOfThought(SpecExtractionSignature)
    
    def forward(self, document_chunks: List[Dict[str, Any]]) -> Optional[ExtractedSpec]:
        """
        Extract structured specifications from document chunks.
        
        Args:
            document_chunks: List of chunks with content, metadata, and IDs
            
        Returns:
            ExtractedSpec object or None if extraction fails/low confidence
        """
        if not document_chunks:
            return None
        
        # Format chunks for DSPy input
        chunks_text = self._format_chunks_for_dspy(document_chunks)
        
        try:
            # Run DSPy extraction
            result = self.extractor(document_chunks=chunks_text)
            
            # Parse and validate result
            extracted_spec = self._parse_extraction_result(result, document_chunks)
            
            # Validate citations requirement
            if not extracted_spec or not extracted_spec.citations:
                print("REFUSAL: No citations provided, extraction not reliable")
                return None
            
            return extracted_spec
            
        except Exception as e:
            print(f"Extraction failed: {e}")
            return None
    
    def _format_chunks_for_dspy(self, chunks: List[Dict[str, Any]]) -> str:
        """Format chunks as text input for DSPy."""
        formatted_chunks = []
        
        for i, chunk in enumerate(chunks):
            chunk_text = f"[Chunk {i}] Page {chunk['page_number']}: {chunk['content']}"
            formatted_chunks.append(chunk_text)
        
        return "\n\n".join(formatted_chunks)
    
    def _parse_extraction_result(self, result, chunks: List[Dict[str, Any]]) -> Optional[ExtractedSpec]:
        """Parse DSPy result into structured ExtractedSpec."""
        try:
            # Parse design specs JSON
            design_specs = json.loads(result.design_specifications)
            
            # Parse citations JSON
            citations_data = json.loads(result.citations)
            citations = self._build_citations(citations_data, chunks)
            
            # Calculate overall confidence based on citations
            confidence = self._calculate_confidence(citations)
            
            # Require minimum confidence threshold
            if confidence < 0.6:
                print(f"REFUSAL: Confidence too low ({confidence:.2f})")
                return None
            
            return ExtractedSpec(
                equipment_type=result.equipment_type,
                manufacturer=result.manufacturer,
                model=result.model,
                design_specs=design_specs,
                citations=citations,
                confidence=confidence
            )
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Failed to parse extraction result: {e}")
            return None
    
    def _build_citations(self, citations_data: List[Dict], chunks: List[Dict[str, Any]]) -> List[Citation]:
        """Build Citation objects from DSPy output."""
        citations = []
        
        for citation_info in citations_data:
            try:
                chunk_index = citation_info['chunk_index']
                
                if 0 <= chunk_index < len(chunks):
                    chunk = chunks[chunk_index]
                    
                    citation = Citation(
                        chunk_id=chunk.get('id', ''),
                        page_number=chunk['page_number'],
                        bbox_x=chunk['bbox_x'],
                        bbox_y=chunk['bbox_y'],
                        bbox_width=chunk['bbox_width'],
                        bbox_height=chunk['bbox_height'],
                        relevance_score=citation_info.get('confidence', 0.5)
                    )
                    
                    citations.append(citation)
                
            except (KeyError, IndexError, TypeError):
                continue  # Skip malformed citations
        
        return citations
    
    def _calculate_confidence(self, citations: List[Citation]) -> float:
        """Calculate overall confidence based on citation quality."""
        if not citations:
            return 0.0
        
        # Average citation relevance scores
        avg_relevance = sum(c.relevance_score for c in citations) / len(citations)
        
        # Boost confidence if we have multiple citations
        citation_count_boost = min(len(citations) * 0.1, 0.3)
        
        return min(avg_relevance + citation_count_boost, 1.0)


class SpecExtractionValidator:
    """Validates extraction results and enforces citation requirements."""
    
    @staticmethod
    def validate_extraction(extracted_spec: Optional[ExtractedSpec]) -> bool:
        """
        Validate that extraction meets requirements.
        Key requirement: must have citations.
        """
        if not extracted_spec:
            return False
        
        # Must have all required fields
        required_fields = ['equipment_type', 'manufacturer', 'model']
        for field in required_fields:
            if not getattr(extracted_spec, field, '').strip():
                return False
        
        # Must have citations (key requirement from acceptance criteria)
        if not extracted_spec.citations:
            return False
        
        # Must have reasonable confidence
        if extracted_spec.confidence < 0.6:
            return False
        
        return True


# Testing and configuration
def configure_dspy():
    """Configure DSPy for spec extraction."""
    import os
    
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        lm = dspy.OpenAI(model='gpt-3.5-turbo', api_key=openai_key)
        dspy.settings.configure(lm=lm)
    else:
        print("WARNING: No OpenAI key found for DSPy configuration")


if __name__ == "__main__":
    # Test the citation requirement
    configure_dspy()
    
    extractor = SubmittalSpecExtractor()
    validator = SpecExtractionValidator()
    
    print("SubmittalSpecExtractor initialized successfully")
    print("Key requirement: Citations must be provided or extraction will be refused")
    
    # Test with sample chunks
    sample_chunks = [
        {
            'id': 'chunk_1',
            'content': 'Grundfos CR 15-3 Centrifugal Pump',
            'page_number': 1,
            'bbox_x': 0.0,
            'bbox_y': 100.0,
            'bbox_width': 500.0,
            'bbox_height': 50.0
        }
    ]
    
    print(f"Sample extraction with {len(sample_chunks)} chunks configured")