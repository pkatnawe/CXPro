#!/usr/bin/env python3
"""
Integration test for Slice-09: Full pipeline from document upload to accepted test procedure
Tests the complete flow from Slices 3-9
"""

import pytest
import asyncio
import asyncpg
import os
from datetime import datetime
import json
from unittest.mock import Mock, patch
import uuid

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cx_pro")


async def test_full_pipeline_accept_draft():
    """Test the complete pipeline from document upload to accepting an AI draft"""
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # 1. Create test data - simulate user and project setup (Slice-02)
        org_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        
        await conn.execute("""
            INSERT INTO orgs (id, name, slug, created_at) 
            VALUES ($1, $2, $3, $4)
        """, org_id, 'Test Org', 'test-org', datetime.now())
        
        # Insert test user into auth.users (required for foreign key)
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
        """, user_id, 'test.oca@example.com')
        
        await conn.execute("""
            INSERT INTO users (id, email) 
            VALUES ($1, $2)
        """, user_id, 'test.oca@example.com')
        
        await conn.execute("""
            INSERT INTO memberships (user_id, org_id) 
            VALUES ($1, $2)
        """, user_id, org_id)
        
        await conn.execute("""
            INSERT INTO projects (id, org_id, name, created_at) 
            VALUES ($1, $2, $3, $4)
        """, project_id, org_id, 'Test Project', datetime.now())
        
        participation_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO participations (id, user_id, project_id, role) 
            VALUES ($1, $2, $3, $4)
        """, participation_id, user_id, project_id, 'OCA')
        
        await conn.execute("""
            INSERT INTO assignments (participation_id, role) 
            VALUES ($1, $2)
        """, participation_id, 'OCA')
        
        # 2. Simulate document upload (Slice-03)
        document_id = str(uuid.uuid4())
        
        # Use database function to create document with outbox event
        result = await conn.fetchval("""
            SELECT create_document_with_outbox($1, $2, $3, $4, $5)
        """, document_id, project_id, 'test-submittal.pdf', '/storage/test-submittal.pdf', 50000)
        
        print(f"Document created: {result}")
        
        # 3. Simulate PDF ingestion (Slice-05)
        # Update document status to processing
        await conn.execute("""
            UPDATE documents 
            SET status = 'processing' 
            WHERE id = $1
        """, document_id)
        
        # Create extracted spec
        extracted_spec_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO extracted_specs (
                id, document_id, project_id,
                equipment_type, manufacturer, model, design_specs,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, extracted_spec_id, document_id, project_id,
             'Air Handler Unit', 'Carrier', 'AHU-5000', 
             json.dumps({'cfm': 5000, 'esp': '2.5 in wc'}),
             datetime.now())
        
        # Create document chunks for citations
        chunk_id_1 = str(uuid.uuid4())
        chunk_id_2 = str(uuid.uuid4())
        
        await conn.execute("""
            INSERT INTO document_chunks (
                id, document_id, chunk_text, page_number, bbox, embedding
            ) VALUES 
            ($1, $2, $3, $4, $5, $6::vector),
            ($7, $8, $9, $10, $11, $12::vector)
        """, 
            chunk_id_1, document_id, 'Verify airflow at 5000 CFM', 42, 
            json.dumps({'x': 100, 'y': 200, 'width': 300, 'height': 50}),
            '[' + ','.join(['0.1'] * 1536) + ']',
            chunk_id_2, document_id, 'Check static pressure at 2.5 in wc', 43,
            json.dumps({'x': 100, 'y': 300, 'width': 300, 'height': 50}),
            '[' + ','.join(['0.1'] * 1536) + ']')
        
        # Update document status to indexed
        await conn.execute("""
            UPDATE documents 
            SET status = 'indexed' 
            WHERE id = $1
        """, document_id)
        
        # Emit DocumentIndexed event
        await conn.execute("""
            INSERT INTO outbox (event_type, aggregate_type, aggregate_id, payload)
            VALUES ('DocumentIndexed', 'document', $1, $2)
        """, document_id, json.dumps({'document_id': document_id}))
        
        # 4. Simulate agent execution (Slice-06)
        agent_run_id = str(uuid.uuid4())
        
        # Create agent run
        await conn.execute("""
            INSERT INTO agent_runs (
                id, project_id, agent_type, status,
                input, output, model_version, token_cost,
                created_at, completed_at, latency_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, agent_run_id, project_id, 'CxExecutionAgent', 'completed',
             json.dumps({'extracted_spec_id': extracted_spec_id}),
             json.dumps({'test_procedure_id': None}),
             'gpt-4-turbo', json.dumps({'input_tokens': 1000, 'output_tokens': 500}),
             datetime.now(), datetime.now(), 2500)
        
        # Create test procedure instance using the database function
        test_procedure_id = str(uuid.uuid4())
        result = await conn.fetchval("""
            SELECT create_test_procedure_with_citations(
                $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
                $6::text, $7::text, $8::text, $9::text,
                $10::jsonb, $11::jsonb[]
            )
        """, test_procedure_id, project_id, document_id, extracted_spec_id, agent_run_id,
             'Air Handler Unit', 'Carrier', 'AHU-5000', 'AHU-01',
             json.dumps({
                 'sections': [{
                     'title': 'Functional Tests',
                     'steps': [
                         {'id': '1.1', 'content': 'Verify airflow at design CFM', 'citations': ['cit1']},
                         {'id': '1.2', 'content': 'Check static pressure', 'citations': ['cit2']}
                     ]
                 }]
             }),
             [
                 json.dumps({
                     'step_id': '1.1',
                     'document_chunk_id': chunk_id_1,
                     'citation_text': 'Verify airflow at 5000 CFM',
                     'confidence_score': 0.95,
                     'page_number': 42,
                     'bbox': {'x': 100, 'y': 200, 'width': 300, 'height': 50}
                 }),
                 json.dumps({
                     'step_id': '1.2', 
                     'document_chunk_id': chunk_id_2,
                     'citation_text': 'Check static pressure at 2.5 in wc',
                     'confidence_score': 0.92,
                     'page_number': 43,
                     'bbox': {'x': 100, 'y': 300, 'width': 300, 'height': 50}
                 })
             ])
        
        print(f"Test procedure created: {result}")
        
        # Emit AgentRunCompleted event
        await conn.execute("""
            INSERT INTO outbox (event_type, aggregate_type, aggregate_id, payload)
            VALUES ('AgentRunCompleted', 'agent_run', $1, $2)
        """, agent_run_id, json.dumps({
            'agent_run_id': agent_run_id,
            'test_procedure_instance_id': test_procedure_id
        }))
        
        # 5. Simulate inbox item creation (Slice-07)
        inbox_item_id = str(uuid.uuid4())
        
        result = await conn.fetchval("""
            SELECT create_inbox_item_from_agent_run(
                $1::uuid, $2::uuid, $3::uuid, $4::jsonb
            )
        """, inbox_item_id, user_id, agent_run_id, 
             json.dumps({'test_procedure_instance_id': test_procedure_id}))
        
        print(f"Inbox item created: {result}")
        
        # 6. Test accepting the draft (Slice-09)
        # Call the accept function
        result = await conn.fetchrow("""
            SELECT * FROM accept_draft_test_procedure($1, $2, $3)
        """, test_procedure_id, user_id, inbox_item_id)
        
        print(f"Accept result: {dict(result)}")
        
        # Verify the test procedure is now active
        status = await conn.fetchval("""
            SELECT status FROM test_procedure_instances WHERE id = $1
        """, test_procedure_id)
        
        assert status == 'active', f"Expected status 'active', got '{status}'"
        
        # Verify audit log entry was created
        audit_entry = await conn.fetchrow("""
            SELECT * FROM audit_log_entries 
            WHERE confirmed_ai_run_id = $1
            AND actor_type = 'human'
            AND action = 'accepted_draft'
        """, agent_run_id)
        
        assert audit_entry is not None, "Audit log entry not found"
        assert audit_entry['actor_id'] == user_id
        
        # Verify inbox item was marked as acted
        inbox_state = await conn.fetchval("""
            SELECT action_state FROM inbox_items WHERE id = $1
        """, inbox_item_id)
        
        assert inbox_state == 'acted', f"Expected inbox state 'acted', got '{inbox_state}'"
        
        # Verify TestProcedureInstanceActivated event was emitted
        event = await conn.fetchrow("""
            SELECT * FROM outbox 
            WHERE event_type = 'TestProcedureInstanceActivated'
            AND aggregate_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        """, test_procedure_id)
        
        assert event is not None, "TestProcedureInstanceActivated event not found"
        
        # 7. Test feedback recording
        feedback_result = await conn.fetchval("""
            SELECT record_feedback($1, $2, $3, $4, $5)
        """, agent_run_id, user_id, 'thumbs_up', 'Great work!', None)
        
        assert feedback_result is not None, "Feedback not recorded"
        
        # Verify feedback was saved
        feedback = await conn.fetchrow("""
            SELECT * FROM feedback_records 
            WHERE agent_run_id = $1 AND created_by = $2
        """, agent_run_id, user_id)
        
        assert feedback is not None, "Feedback record not found"
        assert feedback['feedback_type'] == 'thumbs_up'
        assert feedback['feedback_text'] == 'Great work!'
        
        print("✅ All integration tests passed!")
        
    finally:
        # Cleanup test data (handle variables that might not be defined if test failed early)
        try:
            await conn.execute("DELETE FROM feedback_records WHERE org_id = $1", org_id)
            await conn.execute("DELETE FROM audit_log_entries WHERE org_id = $1", org_id)
            await conn.execute("DELETE FROM inbox_items WHERE user_id = $1", user_id)
            if 'test_procedure_id' in locals():
                await conn.execute("DELETE FROM citations WHERE test_procedure_instance_id = $1", test_procedure_id)
            await conn.execute("DELETE FROM test_procedure_instances WHERE project_id = $1", project_id)
            await conn.execute("DELETE FROM agent_runs WHERE project_id = $1", project_id)
            if 'document_id' in locals():
                await conn.execute("DELETE FROM document_chunks WHERE document_id = $1", document_id)
                await conn.execute("DELETE FROM extracted_specs WHERE document_id = $1", document_id)
            await conn.execute("DELETE FROM documents WHERE project_id = $1", project_id)
            if 'participation_id' in locals():
                await conn.execute("DELETE FROM assignments WHERE participation_id = $1", participation_id)
                await conn.execute("DELETE FROM participations WHERE project_id = $1", project_id)
            await conn.execute("DELETE FROM projects WHERE id = $1", project_id)
            await conn.execute("DELETE FROM memberships WHERE user_id = $1", user_id)
            await conn.execute("DELETE FROM users WHERE id = $1", user_id)
            await conn.execute("DELETE FROM auth.users WHERE id = $1", user_id)
            await conn.execute("DELETE FROM orgs WHERE id = $1", org_id)
            await conn.execute("DELETE FROM outbox WHERE metadata->>'org_id' = $1", org_id)
        except Exception as e:
            print(f"Cleanup error (can be ignored): {e}")
        
        await conn.close()


if __name__ == "__main__":
    asyncio.run(test_full_pipeline_accept_draft())
    print("✅ Integration test completed successfully!")