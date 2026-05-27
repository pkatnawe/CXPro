#!/usr/bin/env python3
"""
Simple test to verify InvitationService works
"""

import pytest
from contexts.identity_access.invitations import InvitationService
from unittest.mock import MagicMock, AsyncMock
from fastapi import HTTPException
import secrets


def test_invitation_service_imports():
    """Test that InvitationService can be imported"""
    assert InvitationService is not None
    print("✅ InvitationService module imports successfully")


async def test_create_invitation_basic():
    """Test basic invitation creation logic"""
    # Mock Supabase client
    mock_supabase = MagicMock()
    mock_auth_admin = MagicMock()
    mock_auth = MagicMock()
    mock_supabase.auth.admin = mock_auth_admin
    mock_supabase.auth = mock_auth
    
    # Mock database connection
    mock_conn = MagicMock()
    mock_conn.execute = AsyncMock(return_value=None)
    mock_conn.fetchrow = AsyncMock(return_value={'role': 'OCA'})
    
    # Create service instance
    service = InvitationService(mock_supabase, mock_conn)
    
    # Mock auth check - user doesn't exist
    mock_auth.get_user = MagicMock(side_effect=Exception("User not found"))
    mock_auth_admin.invite_user_by_email = MagicMock(return_value={"user": {"id": "new-id"}})
    
    # Test create invitation
    result = await service.create_invitation(
        email='test@example.com',
        org_id='org-123',
        project_id='proj-456',
        role='cx_engineer',
        discipline_scope_id='disc-789',
        invited_by='inviter-999'
    )
    
    # Verify result
    assert result['success'] == True
    assert 'id' in result
    
    # Verify database was called to insert invitation
    mock_conn.execute.assert_called()
    
    # Debug: check what was called
    print(f"mock_auth_admin calls: {mock_auth_admin.method_calls}")
    print(f"mock_auth calls: {mock_auth.method_calls}")
    
    # Verify database was called properly
    assert mock_conn.execute.called
    
    print("✅ Basic invitation creation test passed")


async def test_non_oca_forbidden():
    """Test that non-OCA users cannot create invitations"""
    # Mock Supabase client
    mock_supabase = MagicMock()
    
    # Mock database connection - user is not OCA
    mock_conn = MagicMock()
    mock_conn.fetchrow = AsyncMock(return_value={'role': 'cx_engineer'})
    
    # Create service instance
    service = InvitationService(mock_supabase, mock_conn)
    
    # Test should raise 403
    try:
        await service.create_invitation(
            email='test@example.com',
            org_id='org-123',
            project_id='proj-456',
            role='cx_engineer',
            discipline_scope_id='disc-789',
            invited_by='non-oca-user'
        )
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 403
        print("✅ Non-OCA forbidden test passed")


if __name__ == "__main__":
    import asyncio
    
    # Run tests
    test_invitation_service_imports()
    asyncio.run(test_create_invitation_basic())
    asyncio.run(test_non_oca_forbidden())
    
    print("\n✅ All simple tests passed!")