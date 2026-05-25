"""Integration test for accept_draft_test_procedure function migration 016."""

import asyncio
import uuid
import pytest
import asyncpg
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")


@pytest.mark.integration
async def test_accept_draft_test_procedure_with_memberships():
    """Test that accept_draft_test_procedure reads role from memberships table."""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Start transaction for test isolation
        await conn.execute("BEGIN")
        
        # Create test org
        test_org_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO orgs (id, name, slug, created_at) VALUES ($1, $2, $3, $4)",
            test_org_id,
            "Test Organization",
            "test-org",
            datetime.now()
        )
        
        # Create test users
        oca_user_id = str(uuid.uuid4())
        cx_engineer_id = str(uuid.uuid4())
        no_membership_user_id = str(uuid.uuid4())
        
        # Insert into auth.users first (parent table)
        await conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            oca_user_id,
            "oca@test.com"
        )
        
        await conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            cx_engineer_id,
            "engineer@test.com"
        )
        
        await conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            no_membership_user_id,
            "nomembership@test.com"
        )
        
        # Then insert into users table (our app table)
        await conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            oca_user_id,
            "oca@test.com",
            datetime.now()
        )
        
        await conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            cx_engineer_id,
            "engineer@test.com",
            datetime.now()
        )
        
        await conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            no_membership_user_id,
            "nomembership@test.com",
            datetime.now()
        )
        
        # Create memberships - OCA for first user, cx_engineer for second
        await conn.execute(
            "INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)",
            oca_user_id,
            test_org_id,
            "OCA"
        )
        
        await conn.execute(
            "INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)",
            cx_engineer_id,
            test_org_id,
            "cx_engineer"
        )
        
        # Create test project
        test_project_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO projects (id, name, org_id, created_at) VALUES ($1, $2, $3, $4)",
            test_project_id,
            "Test Project",
            test_org_id,
            datetime.now()
        )
        
        # Create participations for the users (without assignments since they don't have roles)
        await conn.execute(
            "INSERT INTO participations (user_id, project_id, created_at) VALUES ($1, $2, $3)",
            oca_user_id,
            test_project_id,
            datetime.now()
        )
        
        await conn.execute(
            "INSERT INTO participations (user_id, project_id, created_at) VALUES ($1, $2, $3)",
            cx_engineer_id,
            test_project_id,
            datetime.now()
        )
        
        # Create agent run
        agent_run_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO agent_runs (id, agent_type, model_version, status, project_id, input, org_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            agent_run_id,
            "cx_execution",
            "test-v1",
            "completed",
            test_project_id,
            '{"test": "data"}',
            test_org_id,
            datetime.now()
        )
        
        # Create draft test procedure
        test_procedure_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO test_procedure_instances (id, project_id, status, equipment_type, actor_type, body, agent_run_id, org_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            test_procedure_id,
            test_project_id,
            "draft",
            "Test Equipment",
            "ai",
            '{"steps": []}',
            agent_run_id,
            test_org_id,
            datetime.now()
        )
        
        # Test 1: OCA should be able to accept the draft
        result = await conn.fetchval(
            "SELECT accept_draft_test_procedure($1::uuid, $2::uuid, NULL::uuid)",
            test_procedure_id,
            oca_user_id
        )
        
        # Parse result if it's a JSON string
        if isinstance(result, str):
            result = json.loads(result)
        
        assert result["success"] == True, "OCA should be able to accept draft"
        
        # Verify status changed to active
        status = await conn.fetchval(
            "SELECT status FROM test_procedure_instances WHERE id = $1",
            test_procedure_id
        )
        assert status == "active", "Test procedure should be active after OCA accepts"
        
        # Create another draft for the cx_engineer test
        test_procedure_id_2 = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO test_procedure_instances (id, project_id, status, equipment_type, actor_type, body, agent_run_id, org_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            test_procedure_id_2,
            test_project_id,
            "draft",
            "Test Equipment 2",
            "ai",
            '{"steps": []}',
            agent_run_id,
            test_org_id,
            datetime.now()
        )
        
        # Test 2: cx_engineer should NOT be able to accept the draft
        try:
            await conn.fetchval(
                "SELECT accept_draft_test_procedure($1::uuid, $2::uuid, NULL::uuid)",
                test_procedure_id_2,
                cx_engineer_id
            )
            assert False, "cx_engineer should not be able to accept draft"
        except asyncpg.exceptions.RaiseError as e:
            assert "User does not have OCA role" in str(e), f"Expected permission error, got: {str(e)}"
        
        # Rollback and start a new transaction for the next test
        await conn.execute("ROLLBACK")
        await conn.execute("BEGIN")
        
        # Re-create test data for third test since we rolled back
        await conn.execute(
            "INSERT INTO orgs (id, name, slug, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
            test_org_id,
            "Test Organization",
            "test-org",
            datetime.now()
        )
        
        await conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            no_membership_user_id,
            "nomembership@test.com"
        )
        
        await conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            no_membership_user_id,
            "nomembership@test.com",
            datetime.now()
        )
        
        await conn.execute(
            "INSERT INTO projects (id, name, org_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
            test_project_id,
            "Test Project",
            test_org_id,
            datetime.now()
        )
        
        await conn.execute(
            """INSERT INTO agent_runs (id, agent_type, model_version, status, project_id, input, org_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING""",
            agent_run_id,
            "cx_execution",
            "test-v1",
            "completed",
            test_project_id,
            '{"test": "data"}',
            test_org_id,
            datetime.now()
        )
        
        # Create another draft for the no membership test
        test_procedure_id_3 = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO test_procedure_instances (id, project_id, status, equipment_type, actor_type, body, agent_run_id, org_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            test_procedure_id_3,
            test_project_id,
            "draft",
            "Test Equipment 3",
            "ai",
            '{"steps": []}',
            agent_run_id,
            test_org_id,
            datetime.now()
        )
        
        # Test 3: User with no membership should NOT be able to accept the draft
        try:
            await conn.fetchval(
                "SELECT accept_draft_test_procedure($1::uuid, $2::uuid, NULL::uuid)",
                test_procedure_id_3,
                no_membership_user_id
            )
            assert False, "User with no membership should not be able to accept draft"
        except asyncpg.exceptions.RaiseError as e:
            assert "User does not have OCA role" in str(e), f"Expected permission error, got: {str(e)}"
        
        print("All tests passed!")
        
    finally:
        # Rollback the transaction to clean up test data
        await conn.execute("ROLLBACK")
        await conn.close()


if __name__ == "__main__":
    asyncio.run(test_accept_draft_test_procedure_with_memberships())