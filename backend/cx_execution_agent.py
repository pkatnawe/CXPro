"""
CxExecutionAgent using LangGraph to process DocumentIndexed events.
Generates draft test procedure instances with full audit logging.
"""

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, TypedDict
from enum import Enum

import asyncpg
import dspy
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from generate_checklist import GenerateL2Checklist, ChecklistStep


class AgentState(TypedDict):
    """State maintained throughout agent execution."""
    document_id: str
    project_id: str
    org_id: str
    extracted_spec: Optional[Dict[str, Any]]
    document_chunks: Optional[List[Dict[str, Any]]]
    checklist_steps: Optional[List[ChecklistStep]]
    overall_confidence: Optional[float]
    agent_run_id: Optional[str]
    start_time: datetime
    error: Optional[str]
    refusal_reason: Optional[str]
    token_cost: Optional[Dict[str, Any]]


class CxExecutionAgent:
    """Agent for processing DocumentIndexed events and generating checklists."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
        self.generator = GenerateL2Checklist()
        self.graph = self._build_graph()
        
        # Configure DSPy
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
            
        dspy.configure(
            lm=dspy.LM(
                model="gemini/gemini-1.5-flash",
                api_key=api_key,
                temperature=0.3
            )
        )
        
    def _build_graph(self) -> CompiledStateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("start_agent_run", self.start_agent_run)
        workflow.add_node("retrieve_spec_and_chunks", self.retrieve_spec_and_chunks)
        workflow.add_node("check_retrieval_confidence", self.check_retrieval_confidence)
        workflow.add_node("generate_checklist", self.generate_checklist)
        workflow.add_node("save_draft_procedure", self.save_draft_procedure)
        workflow.add_node("record_refusal", self.record_refusal)
        workflow.add_node("complete_agent_run", self.complete_agent_run)
        workflow.add_node("handle_error", self.handle_error)
        
        # Add edges
        workflow.add_edge("start_agent_run", "retrieve_spec_and_chunks")
        workflow.add_edge("retrieve_spec_and_chunks", "check_retrieval_confidence")
        
        # Conditional routing after confidence check
        workflow.add_conditional_edges(
            "check_retrieval_confidence",
            self.route_after_confidence_check,
            {
                "generate": "generate_checklist",
                "refuse": "record_refusal",
                "error": "handle_error"
            }
        )
        
        workflow.add_edge("generate_checklist", "save_draft_procedure")
        workflow.add_edge("save_draft_procedure", "complete_agent_run")
        workflow.add_edge("record_refusal", "complete_agent_run")
        workflow.add_edge("handle_error", "complete_agent_run")
        workflow.add_edge("complete_agent_run", END)
        
        # Set entry point
        workflow.set_entry_point("start_agent_run")
        
        return workflow.compile()
        
    async def start_agent_run(self, state: AgentState) -> AgentState:
        """Initialize agent run record."""
        async with self.db_pool.acquire() as conn:
            agent_run_id = str(uuid.uuid4())
            
            input_data = {
                "document_id": state["document_id"],
                "project_id": state["project_id"],
                "event_type": "DocumentIndexed"
            }
            
            await conn.execute("""
                INSERT INTO agent_runs (
                    id, project_id, document_id, agent_type, model_version,
                    status, input, org_id, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, 
                agent_run_id,
                state["project_id"],
                state["document_id"],
                "cx_execution",
                "gemini-1.5-flash",
                "running",
                json.dumps(input_data),
                state["org_id"],
                datetime.utcnow()
            )
            
            state["agent_run_id"] = agent_run_id
            state["start_time"] = datetime.utcnow()
            
        return state
        
    async def retrieve_spec_and_chunks(self, state: AgentState) -> AgentState:
        """Retrieve extracted spec and relevant document chunks."""
        async with self.db_pool.acquire() as conn:
            # Get extracted spec
            spec_row = await conn.fetchrow("""
                SELECT id, equipment_type, manufacturer, model, design_specs
                FROM extracted_specs 
                WHERE document_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            """, state["document_id"])
            
            if spec_row:
                state["extracted_spec"] = {
                    "id": str(spec_row["id"]),
                    "equipment_type": spec_row["equipment_type"],
                    "manufacturer": spec_row["manufacturer"],
                    "model": spec_row["model"],
                    "design_specs": spec_row["design_specs"]
                }
                
                # Get relevant document chunks using similarity search
                chunks = await conn.fetch("""
                    SELECT * FROM search_document_chunks($1, $2, 20)
                """,
                    f"{spec_row['equipment_type']} {spec_row['manufacturer']} {spec_row['model']} commissioning test procedure checklist",
                    state["document_id"]
                )
                
                state["document_chunks"] = [
                    {
                        "id": str(chunk["id"]),
                        "text": chunk["content"],
                        "page": chunk["page_number"],
                        "bbox": chunk["bbox"],
                        "similarity": float(chunk["similarity"])
                    }
                    for chunk in chunks
                ]
            else:
                state["error"] = "No extracted spec found for document"
                
        return state
        
    def route_after_confidence_check(self, state: AgentState) -> str:
        """Route based on retrieval confidence."""
        if state.get("error"):
            return "error"
        elif state.get("refusal_reason"):
            return "refuse"
        else:
            return "generate"
            
    async def check_retrieval_confidence(self, state: AgentState) -> AgentState:
        """Check if we have sufficient data to generate checklist."""
        if not state.get("extracted_spec"):
            state["refusal_reason"] = "No extracted specifications available"
            return state
            
        if not state.get("document_chunks") or len(state["document_chunks"]) < 3:
            state["refusal_reason"] = "Insufficient document context for reliable checklist generation"
            return state
            
        # Check similarity scores
        high_confidence_chunks = [
            c for c in state["document_chunks"] 
            if c.get("similarity", 0) > 0.7
        ]
        
        if len(high_confidence_chunks) < 2:
            state["refusal_reason"] = "Document chunks have low relevance scores - need more specific documentation"
            return state
            
        return state
        
    async def generate_checklist(self, state: AgentState) -> AgentState:
        """Generate L2 checklist with citations."""
        try:
            # Prepare input
            spec = state["extracted_spec"]
            chunks = state["document_chunks"]
            
            # Track tokens (simplified - would use actual token counter in production)
            input_tokens = len(json.dumps(spec)) // 4 + len(json.dumps(chunks)) // 4
            
            # Generate with retry for citations
            prediction = self.generator.generate_with_retry(
                equipment_type=spec["equipment_type"],
                manufacturer=spec["manufacturer"],
                model=spec["model"],
                extracted_spec=json.dumps(spec),
                document_chunks=json.dumps(chunks)
            )
            
            if prediction and hasattr(prediction, 'checklist_steps'):
                state["checklist_steps"] = prediction.checklist_steps
                state["overall_confidence"] = prediction.overall_confidence
                
                # Estimate output tokens
                output_tokens = len(json.dumps([s.dict() for s in prediction.checklist_steps])) // 4
                
                state["token_cost"] = {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_cost": (input_tokens * 0.000001) + (output_tokens * 0.000002)  # Example pricing
                }
            else:
                state["refusal_reason"] = "Failed to generate checklist with proper citations after multiple attempts"
                
        except Exception as e:
            state["error"] = f"Generation failed: {str(e)}"
            
        return state
        
    async def save_draft_procedure(self, state: AgentState) -> AgentState:
        """Save draft test procedure instance with citations."""
        if not state.get("checklist_steps"):
            state["error"] = "No checklist steps to save"
            return state
            
        async with self.db_pool.acquire() as conn:
            spec = state["extracted_spec"]
            
            # Prepare checklist body
            checklist_body = {
                "steps": [
                    {
                        "step_id": step.step_id,
                        "description": step.description,
                        "expected_result": step.expected_result
                    }
                    for step in state["checklist_steps"]
                ]
            }
            
            # Prepare citations
            citations = [
                {
                    "document_chunk_id": step.citation_chunk_id,
                    "step_id": step.step_id,
                    "citation_text": step.citation_text,
                    "confidence_score": step.citation_confidence,
                    "page_number": next(
                        (c["page"] for c in state["document_chunks"] if c["id"] == step.citation_chunk_id),
                        None
                    ),
                    "bbox": next(
                        (c["bbox"] for c in state["document_chunks"] if c["id"] == step.citation_chunk_id),
                        None
                    )
                }
                for step in state["checklist_steps"]
            ]
            
            # Call database function to create procedure with citations
            result = await conn.fetchval("""
                SELECT create_test_procedure_with_citations(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                )
            """,
                state["project_id"],
                state["document_id"],
                spec["id"],
                state["agent_run_id"],
                spec["equipment_type"],
                spec["manufacturer"],
                spec["model"],
                f"{spec['manufacturer']}-{spec['model']}-001",  # Asset tag
                json.dumps(checklist_body),
                json.dumps(citations),
                state["org_id"]
            )
            
            state["test_procedure_id"] = str(result)
            
        return state
        
    async def record_refusal(self, state: AgentState) -> AgentState:
        """Record AI refusal with reason."""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                SELECT record_ai_refusal($1, $2, $3, $4)
            """,
                state["agent_run_id"],
                state["refusal_reason"],
                state["project_id"],
                state["document_id"]
            )
            
        return state
        
    async def complete_agent_run(self, state: AgentState) -> AgentState:
        """Complete agent run with final status and metrics."""
        async with self.db_pool.acquire() as conn:
            # Calculate latency
            latency_ms = int((datetime.utcnow() - state["start_time"]).total_seconds() * 1000)
            
            # Determine final status
            if state.get("error"):
                status = "failed"
            elif state.get("refusal_reason"):
                status = "refused"
            else:
                status = "completed"
                
            # Prepare output
            output = {}
            if state.get("test_procedure_id"):
                output["test_procedure_id"] = state["test_procedure_id"]
                output["checklist_steps_count"] = len(state.get("checklist_steps", []))
                output["overall_confidence"] = state.get("overall_confidence")
            elif state.get("refusal_reason"):
                output["refusal_reason"] = state["refusal_reason"]
            elif state.get("error"):
                output["error"] = state["error"]
                
            # Update agent run
            await conn.execute("""
                UPDATE agent_runs
                SET status = $1,
                    output = $2,
                    token_cost = $3,
                    latency_ms = $4,
                    completed_at = $5,
                    refusal_reason = $6
                WHERE id = $7
            """,
                status,
                json.dumps(output),
                json.dumps(state.get("token_cost", {})),
                latency_ms,
                datetime.utcnow(),
                state.get("refusal_reason"),
                state["agent_run_id"]
            )
            
        return state
        
    async def handle_error(self, state: AgentState) -> AgentState:
        """Handle errors during execution."""
        print(f"Error in agent execution: {state.get('error')}")
        return state
        
    async def process_document_indexed(self, event_payload: Dict[str, Any]) -> None:
        """Process a DocumentIndexed event."""
        initial_state: AgentState = {
            "document_id": event_payload["document_id"],
            "project_id": event_payload["project_id"],
            "org_id": event_payload["org_id"],
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
        
        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)
        
        # Log result
        if final_state.get("test_procedure_id"):
            print(f"✅ Created draft test procedure: {final_state['test_procedure_id']}")
        elif final_state.get("refusal_reason"):
            print(f"⚠️ AI refused: {final_state['refusal_reason']}")
        else:
            print(f"❌ Error: {final_state.get('error')}")


async def register_with_dispatcher(db_pool: asyncpg.Pool):
    """Register the agent with the outbox dispatcher."""
    from outbox_dispatcher import OutboxDispatcher
    
    # Create agent
    agent = CxExecutionAgent(db_pool)
    
    # Create dispatcher
    dispatcher = OutboxDispatcher(db_pool, "cx_execution_agent")
    
    # Register handler
    async def handle_document_indexed(payload: Dict[str, Any]) -> None:
        await agent.process_document_indexed(payload)
        
    dispatcher.register_handler("DocumentIndexed", handle_document_indexed)
    
    print("✅ CxExecutionAgent registered for DocumentIndexed events")
    
    # Start dispatcher
    await dispatcher.start()


if __name__ == "__main__":
    # Test the agent standalone
    import sys
    from pathlib import Path
    
    # Add parent directory to path for imports
    sys.path.append(str(Path(__file__).parent))
    
    async def test_agent():
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv("../.env.local")
        
        # Create connection pool
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("Error: DATABASE_URL not found")
            return
            
        pool = await asyncpg.create_pool(db_url, min_size=1, max_size=5)
        
        try:
            # Register and start agent
            await register_with_dispatcher(pool)
            
        finally:
            await pool.close()
    
    # Run test
    asyncio.run(test_agent())