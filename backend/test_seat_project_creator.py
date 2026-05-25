#!/usr/bin/env python3
"""
Integration test for Migration 014: Seat project creator + four DisciplineScopes + four Assignments
Tests that create_project_with_discipline function properly seats the creator
"""

import pytest
import asyncio
import asyncpg
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")


@pytest.mark.integration
async def test_create_project_with_discipline():
    """Test that create_project_with_discipline properly seats the creator with 4 discipline scopes"""
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Setup test data
    org_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    project_id = None
    project_id2 = None
    project_id3 = None
    
    try:
        # Start a transaction since we need to use SET LOCAL
        async with conn.transaction():
            # Create org
            await conn.execute("""
                INSERT INTO orgs (id, name, slug, created_at) 
                VALUES ($1, $2, $3, $4)
            """, org_id, 'Test Org', 'test-org', datetime.now())
            
            # Create user (simulating an OCA)
            await conn.execute("""
                INSERT INTO auth.users (id, email) 
                VALUES ($1, $2)
                ON CONFLICT (id) DO NOTHING
            """, user_id, 'test.oca@example.com')
            
            await conn.execute("""
                INSERT INTO users (id, email) 
                VALUES ($1, $2)
                ON CONFLICT (id) DO NOTHING
            """, user_id, 'test.oca@example.com')
            
            await conn.execute("""
                INSERT INTO memberships (user_id, org_id, role) 
                VALUES ($1, $2, $3)
            """, user_id, org_id, 'OCA')
            
            # Set the authenticated user context for RLS
            await conn.execute(f"""
                SET LOCAL role TO authenticated;
                SET LOCAL "request.jwt.claim.sub" TO '{user_id}';
            """)
            
            # Call the function as the OCA
            project_id = await conn.fetchval("""
                SELECT create_project_with_discipline($1, $2, $3)
            """, 'Test Project', 'Test project description', org_id)
            
            assert project_id is not None, "Project ID should be returned"
            
            # Verify project was created
            project = await conn.fetchrow("""
                SELECT * FROM projects WHERE id = $1
            """, project_id)
            assert project is not None, "Project should exist"
            assert project['name'] == 'Test Project'
            assert project['description'] == 'Test project description'
            assert str(project['org_id']) == org_id
            
            # Verify exactly 4 discipline_scopes were created
            discipline_scopes = await conn.fetch("""
                SELECT * FROM discipline_scopes WHERE project_id = $1 ORDER BY name
            """, project_id)
            
            assert len(discipline_scopes) == 4, f"Expected 4 discipline_scopes, got {len(discipline_scopes)}"
            
            expected_disciplines = ['Controls', 'Electrical', 'General Construction', 'Mechanical']
            actual_disciplines = sorted([ds['name'] for ds in discipline_scopes])
            assert actual_disciplines == expected_disciplines, f"Expected {expected_disciplines}, got {actual_disciplines}"
            
            # Verify exactly 1 participation was created for the user
            participations = await conn.fetch("""
                SELECT * FROM participations WHERE user_id = $1 AND project_id = $2
            """, user_id, project_id)
            
            assert len(participations) == 1, f"Expected 1 participation, got {len(participations)}"
            participation = participations[0]
            
            # Verify exactly 4 assignments were created (one per discipline_scope)
            assignments = await conn.fetch("""
                SELECT a.*, ds.name as discipline_name 
                FROM assignments a
                JOIN discipline_scopes ds ON a.discipline_scope_id = ds.id
                WHERE a.user_id = $1 AND ds.project_id = $2
                ORDER BY ds.name
            """, user_id, project_id)
            
            assert len(assignments) == 4, f"Expected 4 assignments, got {len(assignments)}"
            
            for assignment in assignments:
                assert assignment['discipline_name'] in expected_disciplines
            
            # Test idempotency - calling the function again should not create duplicates
            project_id2 = await conn.fetchval("""
                SELECT create_project_with_discipline($1, $2, $3)
            """, 'Test Project 2', 'Another test project', org_id)
            
            # Check that still only one participation exists for the first project
            participations_after = await conn.fetch("""
                SELECT * FROM participations WHERE user_id = $1 AND project_id = $2
            """, user_id, project_id)
            assert len(participations_after) == 1, "Participation count should remain 1 (idempotent)"
            
            print("✅ All tests for create_project_with_discipline passed!")
        
        # Additional test outside transaction to verify RLS bypass    
        async with conn.transaction():
            # Set authenticated user without postgres superuser
            await conn.execute(f"""
                SET LOCAL role TO authenticated;
                SET LOCAL "request.jwt.claim.sub" TO '{user_id}';
            """)
            
            # Should still be able to call the function
            project_id3 = await conn.fetchval("""
                SELECT create_project_with_discipline($1, $2, $3)
            """, 'Test Project 3', 'RLS bypass test', org_id)
            assert project_id3 is not None, "Function should work with RLS bypass"
            
    finally:
        # Cleanup test data
        try:
            # Clean up in reverse order of dependencies
            for pid in [project_id, project_id2, project_id3]:
                if pid:
                    await conn.execute("DELETE FROM assignments WHERE user_id = $1 AND discipline_scope_id IN (SELECT id FROM discipline_scopes WHERE project_id = $2)", user_id, pid)
                    await conn.execute("DELETE FROM participations WHERE project_id = $1", pid)
                    await conn.execute("DELETE FROM discipline_scopes WHERE project_id = $1", pid)
                    await conn.execute("DELETE FROM projects WHERE id = $1", pid)
            
            await conn.execute("DELETE FROM memberships WHERE user_id = $1", user_id)
            await conn.execute("DELETE FROM users WHERE id = $1", user_id)
            await conn.execute("DELETE FROM auth.users WHERE id = $1", user_id)
            await conn.execute("DELETE FROM orgs WHERE id = $1", org_id)
        except Exception as e:
            print(f"Cleanup error (can be ignored): {e}")
        
        await conn.close()


if __name__ == "__main__":
    asyncio.run(test_create_project_with_discipline())