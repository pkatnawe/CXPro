"""
Document type detector for Slice-05.
DSPy module that classifies PDF documents by type.
Returns enum values (not strings) to avoid string parsing issues.
"""

import dspy
from enum import Enum
from typing import Optional
import fitz  # PyMuPDF


class DocumentType(Enum):
    """Document type classification enum"""
    SUBMITTAL_CUT_SHEET = "submittal-cut-sheet"
    SPECIFICATION = "specification"
    DRAWING = "drawing"
    MANUAL = "manual"
    UNKNOWN = "unknown"


class DocumentClassifierSignature(dspy.Signature):
    """Classify document type based on text content."""
    
    text_content = dspy.InputField(desc="First 2000 characters of document text")
    document_type = dspy.OutputField(
        desc="Document type classification. Must be one of: submittal-cut-sheet, specification, drawing, manual, unknown"
    )


class DocumentTypeDetector(dspy.Module):
    """
    DSPy module for document type detection.
    Analyzes PDF content and returns structured document type enum.
    """
    
    def __init__(self):
        super().__init__()
        self.classifier = dspy.ChainOfThought(DocumentClassifierSignature)
    
    def forward(self, pdf_path: str) -> DocumentType:
        """
        Classify document type from PDF file.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            DocumentType enum value
        """
        # Extract text from first few pages
        text_content = self._extract_text_sample(pdf_path)
        
        # Run DSPy classification
        result = self.classifier(text_content=text_content)
        
        # Convert string result to enum
        return self._parse_document_type(result.document_type)
    
    def _extract_text_sample(self, pdf_path: str, max_chars: int = 2000) -> str:
        """Extract text sample from PDF for classification."""
        try:
            doc = fitz.open(pdf_path)
            text_parts = []
            chars_collected = 0
            
            # Extract text from first 3 pages or until max_chars
            for page_num in range(min(3, len(doc))):
                if chars_collected >= max_chars:
                    break
                
                page = doc[page_num]
                page_text = page.get_text()
                
                remaining_chars = max_chars - chars_collected
                text_parts.append(page_text[:remaining_chars])
                chars_collected += len(page_text)
            
            doc.close()
            return " ".join(text_parts)
            
        except Exception as e:
            print(f"Error extracting text from {pdf_path}: {e}")
            return ""
    
    def _parse_document_type(self, type_string: str) -> DocumentType:
        """Parse DSPy output string to DocumentType enum."""
        type_string = type_string.lower().strip()
        
        # Map common variations to enum values
        type_mapping = {
            "submittal-cut-sheet": DocumentType.SUBMITTAL_CUT_SHEET,
            "submittal cut sheet": DocumentType.SUBMITTAL_CUT_SHEET,
            "submittal": DocumentType.SUBMITTAL_CUT_SHEET,
            "cut sheet": DocumentType.SUBMITTAL_CUT_SHEET,
            "specification": DocumentType.SPECIFICATION,
            "spec": DocumentType.SPECIFICATION,
            "drawing": DocumentType.DRAWING,
            "blueprint": DocumentType.DRAWING,
            "manual": DocumentType.MANUAL,
            "handbook": DocumentType.MANUAL,
            "unknown": DocumentType.UNKNOWN
        }
        
        return type_mapping.get(type_string, DocumentType.UNKNOWN)


def configure_dspy():
    """Configure DSPy with OpenAI model."""
    import os
    
    api_key = os.getenv('GEMINI_API_KEY')  # Using Gemini per PRD
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    # For now use OpenAI (can switch to Gemini later if needed)
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        lm = dspy.OpenAI(model='gpt-3.5-turbo', api_key=openai_key)
        dspy.settings.configure(lm=lm)
    else:
        # Fallback to a basic configuration
        print("WARNING: No OpenAI key found, using default DSPy configuration")


# Example usage and testing
if __name__ == "__main__":
    # Configure DSPy
    configure_dspy()
    
    # Create detector
    detector = DocumentTypeDetector()
    
    print("Document type detector initialized successfully")
    print(f"Available document types: {[dt.value for dt in DocumentType]}")