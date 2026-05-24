"""
DSPy GenerateL2Checklist module with REQUIRED citations.
Generates Level 2 commissioning checklists from extracted specifications.
"""

import dspy
from typing import List, Optional
from pydantic import BaseModel, Field


class ChecklistStep(BaseModel):
    """Single checklist step with required citation."""
    step_id: str = Field(description="Step identifier like '1.1', '1.2'")
    description: str = Field(description="Clear, actionable test step")
    expected_result: str = Field(description="What should happen when step is performed")
    citation_chunk_id: str = Field(description="UUID of document chunk supporting this step")
    citation_text: str = Field(description="Relevant text from the source document")
    citation_confidence: float = Field(ge=0.0, le=1.0, description="Confidence in citation relevance")


class GenerateL2ChecklistSignature(dspy.Signature):
    """Generate a Level 2 commissioning checklist with citations."""
    
    equipment_type: str = dspy.InputField(
        desc="Type of equipment (e.g., 'Chiller', 'Pump', 'Fan Coil Unit')"
    )
    manufacturer: str = dspy.InputField(
        desc="Equipment manufacturer"
    )
    model: str = dspy.InputField(
        desc="Equipment model number"
    )
    extracted_spec: str = dspy.InputField(
        desc="JSON of extracted specifications including design parameters"
    )
    document_chunks: str = dspy.InputField(
        desc="JSON array of relevant document chunks with IDs, text, and metadata"
    )
    
    checklist_steps: List[ChecklistStep] = dspy.OutputField(
        desc="List of 5-10 actionable test steps with REQUIRED citations. Each step MUST cite a specific document chunk.",
        min_items=5,
        max_items=10
    )
    overall_confidence: float = dspy.OutputField(
        desc="Overall confidence in the checklist quality (0.0-1.0)",
        ge=0.0,
        le=1.0
    )


class GenerateL2Checklist(dspy.Module):
    """DSPy module for generating L2 commissioning checklists with mandatory citations."""
    
    def __init__(self):
        super().__init__()
        self.generator = dspy.ChainOfThought(GenerateL2ChecklistSignature)
        
    def forward(
        self,
        equipment_type: str,
        manufacturer: str,
        model: str,
        extracted_spec: str,
        document_chunks: str
    ) -> dspy.Prediction:
        """
        Generate checklist with citations.
        
        Returns:
            dspy.Prediction with checklist_steps and overall_confidence
        """
        return self.generator(
            equipment_type=equipment_type,
            manufacturer=manufacturer,
            model=model,
            extracted_spec=extracted_spec,
            document_chunks=document_chunks
        )
    
    def validate_citations(self, prediction: dspy.Prediction) -> bool:
        """
        Validate that all steps have citations.
        
        Returns:
            True if all steps have valid citations, False otherwise
        """
        if not hasattr(prediction, 'checklist_steps'):
            return False
            
        for step in prediction.checklist_steps:
            if not step.citation_chunk_id or not step.citation_text:
                return False
            if step.citation_confidence < 0.3:  # Minimum confidence threshold
                return False
                
        return True
    
    def generate_with_retry(
        self,
        equipment_type: str,
        manufacturer: str,
        model: str,
        extracted_spec: str,
        document_chunks: str,
        max_retries: int = 3
    ) -> Optional[dspy.Prediction]:
        """
        Generate checklist with retries if citations are missing.
        
        Returns:
            Prediction if successful, None if all retries fail
        """
        for attempt in range(max_retries):
            try:
                prediction = self.forward(
                    equipment_type=equipment_type,
                    manufacturer=manufacturer,
                    model=model,
                    extracted_spec=extracted_spec,
                    document_chunks=document_chunks
                )
                
                if self.validate_citations(prediction):
                    return prediction
                    
                print(f"Attempt {attempt + 1}: Missing or low-confidence citations, retrying...")
                
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                
        return None  # All retries failed


def create_test_fixture():
    """Create a test fixture to verify citation requirement enforcement."""
    import json
    
    # Sample extracted spec
    extracted_spec = {
        "equipment_type": "Chiller",
        "manufacturer": "Carrier",
        "model": "30XA-200",
        "design_specs": {
            "cooling_capacity": "200 tons",
            "power": "150 kW",
            "refrigerant": "R-134a",
            "flow_rate": "480 GPM",
            "entering_water_temp": "54°F",
            "leaving_water_temp": "44°F"
        }
    }
    
    # Sample document chunks with IDs
    document_chunks = [
        {
            "id": "chunk_001",
            "text": "The chiller shall provide 200 tons of cooling capacity at design conditions with entering water temperature of 54°F and leaving water temperature of 44°F.",
            "page": 5,
            "bbox": [100, 200, 500, 250]
        },
        {
            "id": "chunk_002",
            "text": "System shall maintain refrigerant pressure within manufacturer specified limits. R-134a refrigerant charge shall be verified during commissioning.",
            "page": 7,
            "bbox": [100, 300, 500, 350]
        },
        {
            "id": "chunk_003",
            "text": "Chilled water flow rate shall be verified at 480 GPM using calibrated flow meter. Record actual flow rate and compare to design.",
            "page": 8,
            "bbox": [100, 400, 500, 450]
        },
        {
            "id": "chunk_004",
            "text": "Verify control system programming including setpoints, alarms, and safety interlocks. Test all alarm conditions and verify proper response.",
            "page": 12,
            "bbox": [100, 150, 500, 200]
        },
        {
            "id": "chunk_005",
            "text": "Power consumption shall be measured at various load conditions (25%, 50%, 75%, 100%) and recorded for performance verification.",
            "page": 15,
            "bbox": [100, 250, 500, 300]
        }
    ]
    
    return {
        "equipment_type": "Chiller",
        "manufacturer": "Carrier",
        "model": "30XA-200",
        "extracted_spec": json.dumps(extracted_spec),
        "document_chunks": json.dumps(document_chunks)
    }


if __name__ == "__main__":
    # Test the module
    import os
    
    # Configure DSPy
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment")
        exit(1)
        
    dspy.configure(
        lm=dspy.LM(
            model="gemini/gemini-1.5-flash",
            api_key=api_key,
            temperature=0.3  # Lower temperature for more consistent citations
        )
    )
    
    # Create generator
    generator = GenerateL2Checklist()
    
    # Get test data
    test_data = create_test_fixture()
    
    # Generate with retry to ensure citations
    print("Generating L2 checklist with required citations...")
    prediction = generator.generate_with_retry(**test_data)
    
    if prediction:
        print(f"\n✅ Successfully generated checklist with {len(prediction.checklist_steps)} steps")
        print(f"Overall confidence: {prediction.overall_confidence:.2f}")
        
        for step in prediction.checklist_steps:
            print(f"\nStep {step.step_id}: {step.description}")
            print(f"  Expected: {step.expected_result}")
            print(f"  Citation: {step.citation_text[:100]}...")
            print(f"  Chunk ID: {step.citation_chunk_id}")
            print(f"  Confidence: {step.citation_confidence:.2f}")
    else:
        print("\n❌ Failed to generate checklist with proper citations after all retries")
        print("This would trigger an AI refusal event in production")