#!/usr/bin/env python3
"""
Integration test for InvitationService.create_invitation
Tests that invitations can be created via the service and emails are sent
"""

import pytest
import asyncio
import asyncpg
import os
import json
import secrets
from datetime import datetime
import uuid
from dotenv import load_dotenv
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException

# Load environment variables
load_dotenv('../.env.local')

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@pytest.mark.integration
async def test_invitation_service_create_invitation():
    """Test creating invitations via InvitationService"""
    
    # Import the service (will fail initially)
    from contexts.identity_access.invitations import InvitationService
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Define test variables
    inviter_email = 'oca@test.com'
    invitee_email = 'newuser@test.com'
    existing_email = 'existing@test.com'
    
    try:
        # Clean up any existing test data
        await conn.execute("DELETE FROM pending_invitations WHERE email IN ($1, $2, $3)", inviter_email, invitee_email, existing_email)
        await conn.execute("DELETE FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
        await conn.execute("DELETE FROM participations WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
        await conn.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
        await conn.execute("DELETE FROM users WHERE email IN ($1, $2, $3, $4)", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
        await conn.execute("DELETE FROM auth.users WHERE email IN ($1, $2, $3, $4)", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
        await conn.execute("DELETE FROM discipline_scopes WHERE project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT id FROM orgs WHERE slug IN ('test-org-inv', 'test-org-inv-2')))")
        await conn.execute("DELETE FROM projects WHERE org_id IN (SELECT id FROM orgs WHERE slug IN ('test-org-inv', 'test-org-inv-2'))") 
        await conn.execute("DELETE FROM orgs WHERE slug IN ('test-org-inv', 'test-org-inv-2')")
        
        # Setup test data
        org_id = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        inviter_id = str(uuid.uuid4())
        existing_user_id = str(uuid.uuid4())
        
        # Create org
        await conn.execute("""
            INSERT INTO orgs (id, name, slug, created_at) 
            VALUES ($1, $2, $3, $4)
        """, org_id, 'Test Org Inv', 'test-org-inv', datetime.now())
        
        # Create project with discipline scopes  
        await conn.execute("""
            INSERT INTO projects (id, org_id, name, created_at) 
            VALUES ($1, $2, $3, $4)
        """, project_id, org_id, 'Test Project', datetime.now())
        
        # Create discipline scope
        discipline_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO discipline_scopes (id, project_id, name, created_at)
            VALUES ($1, $2, $3, $4)
        """, discipline_id, project_id, 'Mechanical', datetime.now())
        
        # Create inviter user (OCA)
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
        """, inviter_id, inviter_email)
        
        await conn.execute("""
            INSERT INTO users (id, email) 
            VALUES ($1, $2)
        """, inviter_id, inviter_email)
        
        # Create membership for inviter as OCA
        await conn.execute("""
            INSERT INTO memberships (user_id, org_id, role, created_at)
            VALUES ($1, $2, $3, $4)
        """, inviter_id, org_id, 'OCA', datetime.now())
        
        # Create existing user (to test sign_in_with_otp branch)
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
        """, existing_user_id, existing_email)
        
        await conn.execute("""
            INSERT INTO users (id, email) 
            VALUES ($1, $2)
        """, existing_user_id, existing_email)
        
        # Mock Supabase client
        mock_supabase = MagicMock()
        mock_auth_admin = MagicMock()
        mock_auth = MagicMock()
        mock_supabase.auth.admin = mock_auth_admin
        mock_supabase.auth = mock_auth
        
        # Create service instance
        service = InvitationService(mock_supabase, conn)
        
        # TEST 1: Caller must be OCA of target org (403 if not)
        non_oca_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO auth.users (id, email) 
            VALUES ($1, $2)
        """, non_oca_id, 'non-oca@test.com')
        
        await conn.execute("""
            INSERT INTO users (id, email) 
            VALUES ($1, $2)
        """, non_oca_id, 'non-oca@test.com')
        
        # Create membership for non-OCA as cx_engineer
        await conn.execute("""
            INSERT INTO memberships (user_id, org_id, role, created_at)
            VALUES ($1, $2, $3, $4)
        """, non_oca_id, org_id, 'cx_engineer', datetime.now())
        
        # Try to create invitation as non-OCA (should fail with 403)
        with pytest.raises(HTTPException) as exc_info:
            await service.create_invitation(
                email=invitee_email,
                org_id=org_id,
                project_id=project_id,
                role='cx_engineer',
                discipline_scope_id=discipline_id,
                invited_by=non_oca_id
            )
        assert exc_info.value.status_code == 403, "Expected 403 for non-OCA caller"
        
        # TEST 2: Email does not exist - calls invite_user_by_email
        # Mock to simulate user doesn't exist
        mock_auth.get_user = AsyncMock(side_effect=Exception("User not found"))
        mock_auth_admin.invite_user_by_email = AsyncMock(return_value={"user": {"id": "new-id"}})
        
        result = await service.create_invitation(
            email=invitee_email,
            org_id=org_id,
            project_id=project_id,
            role='cx_engineer',
            discipline_scope_id=discipline_id,
            invited_by=inviter_id
        )
        
        # Verify invite_user_by_email was called with redirectTo containing the token
        mock_auth_admin.invite_user_by_email.assert_called_once()
        call_args = mock_auth_admin.invite_user_by_email.call_args
        assert call_args[1]['email'] == invitee_email
        assert 'redirectTo' in call_args[1]
        assert '/accept-invite?token=' in call_args[1]['redirectTo']
        
        # Verify pending_invitations row was written
        invitation = await conn.fetchrow("""
            SELECT * FROM pending_invitations 
            WHERE email = $1 AND org_id = $2 AND project_id = $3
        """, invitee_email, org_id, project_id)
        assert invitation is not None, "Invitation not created in database"
        assert invitation['role'] == 'cx_engineer'
        assert invitation['discipline_scope_id'] == discipline_id
        assert invitation['invited_by'] == inviter_id
        assert invitation['token'] is not None
        
        # TEST 3: Email exists - calls sign_in_with_otp
        # Clean up previous invitation
        await conn.execute("DELETE FROM pending_invitations WHERE email = $1", existing_email)
        
        # Mock to simulate user exists
        mock_auth.get_user = AsyncMock(return_value={"user": {"id": existing_user_id}})
        mock_auth.sign_in_with_otp = AsyncMock(return_value={"user": {"id": existing_user_id}})
        
        result2 = await service.create_invitation(
            email=existing_email,
            org_id=org_id,
            project_id=project_id,
            role='OCA',
            discipline_scope_id=discipline_id,
            invited_by=inviter_id
        )
        
        # Verify sign_in_with_otp was called with redirectTo containing the token
        mock_auth.sign_in_with_otp.assert_called_once()
        call_args = mock_auth.sign_in_with_otp.call_args
        assert call_args[1]['email'] == existing_email
        assert 'options' in call_args[1]
        assert 'emailRedirectTo' in call_args[1]['options']
        assert '/accept-invite?token=' in call_args[1]['options']['emailRedirectTo']
        
        # Verify pending_invitations row was written for existing user
        invitation2 = await conn.fetchrow("""
            SELECT * FROM pending_invitations 
            WHERE email = $1 AND org_id = $2 AND project_id = $3
        """, existing_email, org_id, project_id)
        assert invitation2 is not None, "Invitation for existing user not created"
        assert invitation2['role'] == 'OCA'
        
        # Verify both invitations have different tokens
        assert invitation['token'] != invitation2['token'], "Tokens should be unique"
        
        print("✅ All test_invitation_service_create_invitation assertions passed!")
        
    finally:
        # Cleanup
        try:
            await conn.execute("DELETE FROM pending_invitations WHERE email IN ($1, $2, $3)", inviter_email, invitee_email, existing_email)
            await conn.execute("DELETE FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
            await conn.execute("DELETE FROM participations WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
            await conn.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3, $4))", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
            await conn.execute("DELETE FROM discipline_scopes WHERE project_id = $1", project_id)
            await conn.execute("DELETE FROM projects WHERE id = $1", project_id)
            await conn.execute("DELETE FROM users WHERE email IN ($1, $2, $3, $4)", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
            await conn.execute("DELETE FROM auth.users WHERE email IN ($1, $2, $3, $4)", inviter_email, invitee_email, existing_email, 'non-oca@test.com')
            await conn.execute("DELETE FROM orgs WHERE id = $1", org_id)
        except Exception as e:
            print(f"Cleanup error (can be ignored): {e}")
        
        await conn.close()


if __name__ == "__main__":
    asyncio.run(test_invitation_service_create_invitation())
    print("✅ Integration test completed successfully!")