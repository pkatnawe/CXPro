"""
Test suite for Slice-06: AI drafts checklist from ExtractedSpec.
Tests the full pipeline from DocumentIndexed event to draft TestProcedureInstance creation.
"""

import asyncio
import json
import os
import uuid
from pathlib import Path
from datetime import datetime

import asyncpg
import pytest
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)


@pytest.fixture
async def db_pool():
    """Create database connection pool for tests."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set")
    
    pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
    yield pool
    await pool.close()


@pytest.fixture
async def test_data(db_pool):
    """Create test data for agent execution."""
    async with db_pool.acquire() as conn:
        # Create test org and project
        org_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        document_id = str(uuid.uuid4())
        spec_id = str(uuid.uuid4())
        
        # Create org
        await conn.execute("""
            INSERT INTO orgs (id, name, slug, created_at)
            VALUES ($1, $2, $3, now())
        """, org_id, "Test Org", "test-org")
        
        # Create project
        await conn.execute("""
            INSERT INTO projects (id, org_id, name, created_at)
            VALUES ($1, $2, $3, now())
        """, project_id, org_id, "Test Project")
        
        # Create document
        await conn.execute("""
            INSERT INTO documents (
                id, project_id, filename, original_filename,
                file_size, mime_type, storage_path, status, 
                uploaded_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
        """, document_id, project_id, "test-submittal.pdf", "test-submittal.pdf",
             1024000, "application/pdf", f"documents/{project_id}/test-submittal.pdf",
             "indexed", str(uuid.uuid4()))
        
        # Create extracted spec
        design_specs = {
            "cooling_capacity": "200 tons",
            "power": "150 kW",
            "refrigerant": "R-134a",
            "flow_rate": "480 GPM",
            "entering_water_temp": "54°F",
            "leaving_water_temp": "44°F"
        }
        
        await conn.execute("""
            INSERT INTO extracted_specs (
                id, document_id, equipment_type,
                manufacturer, model, design_specs, extracted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, now())
        """, spec_id, document_id, "Chiller",
             "Carrier", "30XA-200", json.dumps(design_specs))
        
        # Create document chunks with embeddings
        chunk_ids = []
        chunks_data = [
            ("The chiller shall provide 200 tons of cooling capacity at design conditions.", 5, [100, 200, 500, 250]),
            ("System shall maintain refrigerant pressure within manufacturer limits.", 7, [100, 300, 500, 350]),
            ("Chilled water flow rate shall be verified at 480 GPM using calibrated meter.", 8, [100, 400, 500, 450]),
            ("Verify control system programming including setpoints and alarms.", 12, [100, 150, 500, 200]),
            ("Power consumption shall be measured at various load conditions.", 15, [100, 250, 500, 300])
        ]
        
        for text, page, bbox in chunks_data:
            chunk_id = str(uuid.uuid4())
            chunk_ids.append(chunk_id)
            
            # Create mock embedding (1536 dimensions)
            embedding = [0.1] * 1536
            
            await conn.execute("""
                INSERT INTO document_chunks (
                    id, document_id, content, page_number,
                    bbox_x, bbox_y, bbox_width, bbox_height, embedding, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
            """, chunk_id, document_id, text, page,
                 bbox[0], bbox[1], bbox[2]-bbox[0], bbox[3]-bbox[1], embedding)
        
        return {
            "org_id": org_id,
            "project_id": project_id,
            "document_id": document_id,
            "spec_id": spec_id,
            "chunk_ids": chunk_ids
        }


async def test_agent_run_creation(db_pool, test_data):
    """Test that agent runs are created properly."""
    from cx_execution_agent import CxExecutionAgent
    
    agent = CxExecutionAgent(db_pool)
    
    # Create initial state
    state = {
        "document_id": test_data["document_id"],
        "project_id": test_data["project_id"],
        "org_id": test_data["org_id"],
        "extracted_spec": None,
        "document_chunks": None,
        "checklist_steps": None,
        "overall_confidence": None,
        "agent_run_id": None,
        "start_time": datetime.utcnow(),
        "error": None,
        "refusal_reason": None,
        "token_cost": None
    }
    
    # Start agent run
    state = await agent.start_agent_run(state)
    
    assert state["agent_run_id"] is not None
    
    # Verify in database
    async with db_pool.acquire() as conn:
        run = await conn.fetchrow("""
            SELECT * FROM agent_runs WHERE id = $1
        """, state["agent_run_id"])
        
        assert run is not None
        assert run["status"] == "running"
        assert run["agent_type"] == "cx_execution"
        assert run["project_id"] == test_data["project_id"]


async def test_spec_and_chunk_retrieval(db_pool, test_data):
    """Test retrieval of extracted spec and document chunks."""
    from cx_execution_agent import CxExecutionAgent
    
    agent = CxExecutionAgent(db_pool)
    
    state = {
        "document_id": test_data["document_id"],
        "project_id": test_data["project_id"],
        "org_id": test_data["org_id"],
        "extracted_spec": None,
        "document_chunks": None,
        "checklist_steps": None,
        "overall_confidence": None,
        "agent_run_id": str(uuid.uuid4()),
        "start_time": datetime.utcnow(),
        "error": None,
        "refusal_reason": None,
        "token_cost": None
    }
    
    # Retrieve spec and chunks
    state = await agent.retrieve_spec_and_chunks(state)
    
    assert state["extracted_spec"] is not None
    assert state["extracted_spec"]["equipment_type"] == "Chiller"
    assert state["extracted_spec"]["manufacturer"] == "Carrier"
    assert state["document_chunks"] is not None
    assert len(state["document_chunks"]) > 0


async def test_confidence_check_passes(db_pool, test_data):
    """Test that confidence check passes with good data."""
    from cx_execution_agent import CxExecutionAgent
    
    agent = CxExecutionAgent(db_pool)
    
    # Create state with good data
    state = {
        "extracted_spec": {
            "equipment_type": "Chiller",
            "manufacturer": "Carrier",
            "model": "30XA-200"
        },
        "document_chunks": [
            {"id": "chunk1", "text": "Test", "similarity": 0.85},
            {"id": "chunk2", "text": "Test", "similarity": 0.80},
            {"id": "chunk3", "text": "Test", "similarity": 0.75},
            {"id": "chunk4", "text": "Test", "similarity": 0.72}
        ],
        "error": None,
        "refusal_reason": None
    }
    
    state = await agent.check_retrieval_confidence(state)
    
    assert state.get("refusal_reason") is None
    assert agent.route_after_confidence_check(state) == "generate"


async def test_confidence_check_refuses_low_quality(db_pool, test_data):
    """Test that confidence check refuses with low quality data."""
    from cx_execution_agent import CxExecutionAgent
    
    agent = CxExecutionAgent(db_pool)
    
    # Create state with poor similarity scores
    state = {
        "extracted_spec": {
            "equipment_type": "Chiller"
        },
        "document_chunks": [
            {"id": "chunk1", "text": "Test", "similarity": 0.45},
            {"id": "chunk2", "text": "Test", "similarity": 0.40}
        ],
        "error": None,
        "refusal_reason": None
    }
    
    state = await agent.check_retrieval_confidence(state)
    
    assert state.get("refusal_reason") is not None
    assert "low relevance" in state["refusal_reason"].lower()
    assert agent.route_after_confidence_check(state) == "refuse"


async def test_checklist_generation_requires_citations():
    """Test that checklist generation enforces citations."""
    from generate_checklist import GenerateL2Checklist, create_test_fixture
    import dspy
    
    # Configure DSPy
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not set")
    
    dspy.configure(
        lm=dspy.LM(
            model="gemini/gemini-1.5-flash",
            api_key=api_key,
            temperature=0.3
        )
    )
    
    generator = GenerateL2Checklist()
    test_data = create_test_fixture()
    
    # Generate with retry
    prediction = generator.generate_with_retry(**test_data, max_retries=2)
    
    if prediction:
        # Verify all steps have citations
        assert hasattr(prediction, 'checklist_steps')
        assert len(prediction.checklist_steps) >= 5
        
        for step in prediction.checklist_steps:
            assert step.citation_chunk_id is not None
            assert step.citation_text is not None
            assert step.citation_confidence > 0
            
        # Verify citation validation works
        assert generator.validate_citations(prediction) is True
        
        # Test validation fails without citations
        prediction.checklist_steps[0].citation_chunk_id = None
        assert generator.validate_citations(prediction) is False


async def test_draft_procedure_creation(db_pool, test_data):
    """Test creation of draft test procedure with citations."""
    async with db_pool.acquire() as conn:
        # Prepare test data
        agent_run_id = str(uuid.uuid4())
        
        # Create agent run first
        await conn.execute("""
            INSERT INTO agent_runs (
                id, project_id, document_id, agent_type, model_version,
                status, input, org_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, agent_run_id, test_data["project_id"], test_data["document_id"],
             "cx_execution", "test", "running", json.dumps({}), test_data["org_id"])
        
        # Prepare checklist and citations
        checklist_body = {
            "steps": [
                {
                    "step_id": "1.1",
                    "description": "Verify cooling capacity",
                    "expected_result": "200 tons at design conditions"
                },
                {
                    "step_id": "1.2",
                    "description": "Check refrigerant pressure",
                    "expected_result": "Within manufacturer limits"
                }
            ]
        }
        
        citations = [
            {
                "document_chunk_id": test_data["chunk_ids"][0],
                "step_id": "1.1",
                "citation_text": "200 tons cooling capacity",
                "confidence_score": 0.85,
                "page_number": 5,
                "bbox": [100, 200, 500, 250]
            },
            {
                "document_chunk_id": test_data["chunk_ids"][1],
                "step_id": "1.2",
                "citation_text": "refrigerant pressure limits",
                "confidence_score": 0.80,
                "page_number": 7,
                "bbox": [100, 300, 500, 350]
            }
        ]
        
        # Create test procedure with citations
        procedure_id = await conn.fetchval("""
            SELECT create_test_procedure_with_citations(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
        """,
            test_data["project_id"],
            test_data["document_id"],
            test_data["spec_id"],
            agent_run_id,
            "Chiller",
            "Carrier",
            "30XA-200",
            "TEST-001",
            json.dumps(checklist_body),
            json.dumps(citations),
            test_data["org_id"]
        )
        
        assert procedure_id is not None
        
        # Verify procedure created
        procedure = await conn.fetchrow("""
            SELECT * FROM test_procedure_instances WHERE id = $1
        """, procedure_id)
        
        assert procedure is not None
        assert procedure["status"] == "draft"
        assert procedure["actor_type"] == "ai"
        assert procedure["equipment_type"] == "Chiller"
        
        # Verify citations created
        citation_count = await conn.fetchval("""
            SELECT COUNT(*) FROM citations WHERE test_procedure_instance_id = $1
        """, procedure_id)
        
        assert citation_count == 2
        
        # Verify AgentRunCompleted event emitted
        event = await conn.fetchrow("""
            SELECT * FROM outbox 
            WHERE event_type = 'AgentRunCompleted' 
            AND resource_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        """, agent_run_id)
        
        assert event is not None
        assert event["payload"]["test_procedure_instance_id"] == str(procedure_id)


async def test_ai_refusal_recording(db_pool, test_data):
    """Test that AI refusals are recorded properly."""
    async with db_pool.acquire() as conn:
        agent_run_id = str(uuid.uuid4())
        
        # Create agent run
        await conn.execute("""
            INSERT INTO agent_runs (
                id, project_id, document_id, agent_type, model_version,
                status, input, org_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, agent_run_id, test_data["project_id"], test_data["document_id"],
             "cx_execution", "test", "running", json.dumps({}), test_data["org_id"])
        
        # Record refusal
        refusal_reason = "Insufficient document context for reliable checklist generation"
        
        await conn.execute("""
            SELECT record_ai_refusal($1, $2, $3, $4)
        """, agent_run_id, refusal_reason, test_data["project_id"], test_data["document_id"])
        
        # Verify agent run updated
        run = await conn.fetchrow("""
            SELECT * FROM agent_runs WHERE id = $1
        """, agent_run_id)
        
        assert run["status"] == "refused"
        assert run["refusal_reason"] == refusal_reason
        
        # Verify AIRefusal event emitted
        event = await conn.fetchrow("""
            SELECT * FROM outbox
            WHERE event_type = 'AIRefusal'
            AND resource_id = $1
        """, agent_run_id)
        
        assert event is not None
        assert event["payload"]["refusal_reason"] == refusal_reason


async def test_full_pipeline_integration(db_pool, test_data):
    """Test the full pipeline from DocumentIndexed to draft creation."""
    from cx_execution_agent import CxExecutionAgent
    
    # Skip if no API key
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set - skipping full integration test")
    
    agent = CxExecutionAgent(db_pool)
    
    # Simulate DocumentIndexed event
    event_payload = {
        "document_id": test_data["document_id"],
        "project_id": test_data["project_id"],
        "org_id": test_data["org_id"]
    }
    
    # Process event
    await agent.process_document_indexed(event_payload)
    
    # Give it time to complete
    await asyncio.sleep(5)
    
    # Verify results
    async with db_pool.acquire() as conn:
        # Check for completed agent run
        run = await conn.fetchrow("""
            SELECT * FROM agent_runs
            WHERE document_id = $1
            AND status IN ('completed', 'refused')
            ORDER BY created_at DESC
            LIMIT 1
        """, test_data["document_id"])
        
        assert run is not None
        
        if run["status"] == "completed":
            # Check for draft procedure
            procedure = await conn.fetchrow("""
                SELECT * FROM test_procedure_instances
                WHERE document_id = $1
                AND status = 'draft'
                ORDER BY created_at DESC
                LIMIT 1
            """, test_data["document_id"])
            
            if procedure:
                assert procedure["actor_type"] == "ai"
                
                # Check for citations
                citation_count = await conn.fetchval("""
                    SELECT COUNT(*) FROM citations
                    WHERE test_procedure_instance_id = $1
                """, procedure["id"])
                
                assert citation_count >= 5  # Should have at least 5 citations
        elif run["status"] == "refused":
            assert run["refusal_reason"] is not None
            
            # Check for refusal event
            event = await conn.fetchrow("""
                SELECT * FROM outbox
                WHERE event_type = 'AIRefusal'
                AND resource_id = $1
            """, run["id"])
            
            assert event is not None


# Run all tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])