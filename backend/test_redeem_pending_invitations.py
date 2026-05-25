#!/usr/bin/env python3
"""
Integration test for redeeming pending invitations
Tests that pending invitations are automatically redeemed when a user signs up
"""

import pytest
import asyncio
import asyncpg
import os
from datetime import datetime, timedelta
import uuid
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")


@pytest.mark.integration
async def test_redeem_pending_invitations():
    """Test redemption of pending invitations on user signup"""
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Define test variables
    test_email = 'newuser@test.com'
    new_user_id = str(uuid.uuid4())
    
    try:
        # Clean up any existing test data first - more thorough cleanup
        await conn.execute("DELETE FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email = $1)", test_email)
        await conn.execute("DELETE FROM participations WHERE user_id IN (SELECT id FROM users WHERE email = $1)", test_email)
        await conn.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = $1)", test_email)
        await conn.execute("DELETE FROM pending_invitations WHERE email = $1", test_email)
        await conn.execute("DELETE FROM users WHERE email = $1", test_email)
        await conn.execute("DELETE FROM auth.users WHERE email = $1", test_email)
        
        # Setup test data
        org1_id = str(uuid.uuid4())
        org2_id = str(uuid.uuid4())
        project1_id = str(uuid.uuid4())
        project2_id = str(uuid.uuid4())
        inviter_id = str(uuid.uuid4())
        
        # Create orgs
        await conn.execute("""
            INSERT INTO orgs (id, name, slug, created_at) 
            VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
        """, org1_id, 'Test Org 1', 'test-org-1', datetime.now(),
            org2_id, 'Test Org 2', 'test-org-2', datetime.now())
        
        # Create projects with discipline scopes
        await conn.execute("""
            INSERT INTO projects (id, org_id, name, created_at) 
            VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
        """, project1_id, org1_id, 'Test Project 1', datetime.now(),
            project2_id, org2_id, 'Test Project 2', datetime.now())
        
        # Create discipline scopes for each project
        discipline1_id = str(uuid.uuid4())
        discipline2_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO discipline_scopes (id, project_id, name, created_at)
            VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
        """, discipline1_id, project1_id, 'Mechanical', datetime.now(),
            discipline2_id, project2_id, 'Electrical', datetime.now())
        
        # Create inviter user
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
        """, inviter_id, 'inviter@test.com')
        
        await conn.execute("""
            INSERT INTO users (id, email) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
        """, inviter_id, 'inviter@test.com')
        
        # Create pending invitations with unique tokens
        # Valid invitation 1: OCA role for org1/project1
        invite1_id = str(uuid.uuid4())
        token1 = f"token_{uuid.uuid4().hex[:16]}"
        await conn.execute("""
            INSERT INTO pending_invitations (
                id, email, org_id, project_id, role, discipline_scope_id, 
                token, invited_by, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, invite1_id, test_email, org1_id, project1_id, 'OCA', discipline1_id,
            token1, inviter_id, datetime.now() + timedelta(days=7), datetime.now())
        
        # Valid invitation 2: cx_engineer role for org2/project2
        invite2_id = str(uuid.uuid4())
        token2 = f"token_{uuid.uuid4().hex[:16]}"
        await conn.execute("""
            INSERT INTO pending_invitations (
                id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, invite2_id, test_email, org2_id, project2_id, 'cx_engineer', discipline2_id,
            token2, inviter_id, datetime.now() + timedelta(days=7), datetime.now())
        
        # Expired invitation (should not be redeemed)
        invite3_id = str(uuid.uuid4())
        token3 = f"token_{uuid.uuid4().hex[:16]}"
        await conn.execute("""
            INSERT INTO pending_invitations (
                id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, invite3_id, test_email, org1_id, project1_id, 'cx_engineer', discipline1_id,
            token3, inviter_id, datetime.now() - timedelta(days=1), datetime.now())
        
        # Already accepted invitation (should not be re-redeemed)
        invite4_id = str(uuid.uuid4())
        token4 = f"token_{uuid.uuid4().hex[:16]}"
        await conn.execute("""
            INSERT INTO pending_invitations (
                id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, accepted_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, invite4_id, test_email, org1_id, project1_id, 'cx_engineer', discipline1_id,
            token4, inviter_id, datetime.now() + timedelta(days=7), datetime.now(), datetime.now())
        
        # Debug: Check invitations BEFORE signup
        invite_before = await conn.fetch("""
            SELECT id, expires_at > NOW() as not_expired, accepted_at 
            FROM pending_invitations WHERE email = $1
        """, test_email)
        print(f"DEBUG: Before signup - Found {len(invite_before)} invitations")
        for inv in invite_before:
            print(f"  - Not Expired: {inv['not_expired']}, Accepted: {inv['accepted_at'] is not None}")
        
        # TEST: Simulate user signup - this should trigger handle_new_user which calls redeem_pending_invitations
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
        """, new_user_id, test_email)
        
        # The trigger should have created the user and redeemed invitations
        # Wait a moment for trigger to complete
        import asyncio
        await asyncio.sleep(0.1)
        
        # Debug: Check invitations AFTER signup
        invite_after = await conn.fetch("""
            SELECT id, expires_at > NOW() as not_expired, accepted_at 
            FROM pending_invitations WHERE email = $1
        """, test_email)
        print(f"DEBUG: After signup - Found {len(invite_after)} invitations")
        for inv in invite_after:
            print(f"  - Not Expired: {inv['not_expired']}, Accepted: {inv['accepted_at'] is not None}")
        
        # Count how many invitations were redeemed (should be 2: invite1 and invite2)
        # Only count those that were:
        # - Not expired when accepted
        # - Not previously accepted (invite4 was already accepted)
        redeemed_count = 0
        for i, inv_before in enumerate(invite_before):
            inv_after = invite_after[i]
            # Was it redeemed during signup? (not accepted before, but accepted after)
            if inv_before['accepted_at'] is None and inv_after['accepted_at'] is not None:
                redeemed_count += 1
                print(f"DEBUG: Invitation {i+1} was redeemed")
        
        # Assertions
        assert redeemed_count == 2, f"Expected 2 invitations to be redeemed, got {redeemed_count}"
        
        # Verify memberships were created
        membership1 = await conn.fetchrow("""
            SELECT * FROM memberships WHERE user_id = $1 AND org_id = $2
        """, new_user_id, org1_id)
        assert membership1 is not None, "Membership for org1 not created"
        assert membership1['role'] == 'OCA', f"Expected OCA role, got {membership1['role']}"
        
        membership2 = await conn.fetchrow("""
            SELECT * FROM memberships WHERE user_id = $1 AND org_id = $2
        """, new_user_id, org2_id)
        assert membership2 is not None, "Membership for org2 not created"
        assert membership2['role'] == 'cx_engineer', f"Expected cx_engineer role, got {membership2['role']}"
        
        # Verify participations were created
        participation1 = await conn.fetchrow("""
            SELECT * FROM participations WHERE user_id = $1 AND project_id = $2
        """, new_user_id, project1_id)
        assert participation1 is not None, "Participation for project1 not created"
        
        participation2 = await conn.fetchrow("""
            SELECT * FROM participations WHERE user_id = $1 AND project_id = $2
        """, new_user_id, project2_id)
        assert participation2 is not None, "Participation for project2 not created"
        
        # Verify assignments were created
        assignment1 = await conn.fetchrow("""
            SELECT * FROM assignments WHERE user_id = $1 AND discipline_scope_id = $2
        """, new_user_id, discipline1_id)
        assert assignment1 is not None, "Assignment for discipline1 not created"
        
        assignment2 = await conn.fetchrow("""
            SELECT * FROM assignments WHERE user_id = $1 AND discipline_scope_id = $2
        """, new_user_id, discipline2_id)
        assert assignment2 is not None, "Assignment for discipline2 not created"
        
        # Verify invitations were marked as accepted
        invite1_check = await conn.fetchrow("""
            SELECT accepted_at FROM pending_invitations WHERE id = $1
        """, invite1_id)
        assert invite1_check['accepted_at'] is not None, "Invitation 1 not marked as accepted"
        
        invite2_check = await conn.fetchrow("""
            SELECT accepted_at FROM pending_invitations WHERE id = $1
        """, invite2_id)
        assert invite2_check['accepted_at'] is not None, "Invitation 2 not marked as accepted"
        
        # Verify expired invitation was not accepted
        invite3_check = await conn.fetchrow("""
            SELECT accepted_at FROM pending_invitations WHERE id = $1
        """, invite3_id)
        assert invite3_check['accepted_at'] is None, "Expired invitation should not be accepted"
        
        # Test: No invitations scenario
        no_invite_user_id = str(uuid.uuid4())
        no_invite_count = await conn.fetchval("""
            SELECT redeem_pending_invitations($1, $2)
        """, no_invite_user_id, 'nobody@test.com')
        assert no_invite_count == 0, f"Expected 0 redemptions for user with no invites, got {no_invite_count}"
        
        print("✅ All test_redeem_pending_invitations assertions passed!")
        
    finally:
        # Cleanup
        try:
            await conn.execute("DELETE FROM assignments WHERE user_id IN ($1, $2)", new_user_id, no_invite_user_id if 'no_invite_user_id' in locals() else new_user_id)
            await conn.execute("DELETE FROM participations WHERE user_id IN ($1, $2)", new_user_id, no_invite_user_id if 'no_invite_user_id' in locals() else new_user_id)
            await conn.execute("DELETE FROM memberships WHERE user_id IN ($1, $2, $3)", new_user_id, inviter_id, no_invite_user_id if 'no_invite_user_id' in locals() else new_user_id)
            await conn.execute("DELETE FROM pending_invitations WHERE email = $1", test_email)
            await conn.execute("DELETE FROM discipline_scopes WHERE project_id IN ($1, $2)", project1_id, project2_id)
            await conn.execute("DELETE FROM projects WHERE id IN ($1, $2)", project1_id, project2_id)
            await conn.execute("DELETE FROM users WHERE id IN ($1, $2, $3)", inviter_id, new_user_id, no_invite_user_id if 'no_invite_user_id' in locals() else new_user_id)
            await conn.execute("DELETE FROM auth.users WHERE id IN ($1, $2, $3)", inviter_id, new_user_id, no_invite_user_id if 'no_invite_user_id' in locals() else new_user_id)
            await conn.execute("DELETE FROM orgs WHERE id IN ($1, $2)", org1_id, org2_id)
        except Exception as e:
            print(f"Cleanup error (can be ignored): {e}")
        
        await conn.close()


if __name__ == "__main__":
    asyncio.run(test_redeem_pending_invitations())
    print("✅ Integration test completed successfully!")