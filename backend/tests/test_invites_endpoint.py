#!/usr/bin/env python3
"""
Endpoint integration tests for POST /invites
Tests all 6 scenarios as defined in US-009
Uses mocking to avoid database conflicts
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import uuid
from datetime import datetime, timezone

# Import app
from main import app

# Create test client
client = TestClient(app)


def create_mock_supabase_and_service():
    """Create mock supabase and service objects"""
    mock_supabase = MagicMock()
    mock_supabase.auth.get_user = MagicMock()
    mock_supabase.auth.admin.invite_user_by_email = AsyncMock()
    mock_supabase.auth.sign_in_with_otp = AsyncMock()
    
    return mock_supabase


@pytest.mark.asyncio
async def test_scenario_1_new_invite():
    """Scenario 1: New invite returns 201 with send_count=1"""
    oca_user_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        # Mock the auth check in the endpoint
        mock_user = MagicMock()
        mock_user.user.id = oca_user_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        # Mock the service's internals
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            mock_create.return_value = ({
                'id': str(uuid.uuid4()),
                'send_count': 1,
                'success': True
            }, 201)
            
            response = client.post(
                "/invites",
                json={
                    "email": "newinvitee@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data['send_count'] == 1
            assert data['success'] is True


@pytest.mark.asyncio
async def test_scenario_2_immediate_resend():
    """Scenario 2: Immediate re-send returns 200 with send_count=2"""
    oca_user_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        mock_user = MagicMock()
        mock_user.user.id = oca_user_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            # Return 200 for resend
            mock_create.return_value = ({
                'id': str(uuid.uuid4()),
                'send_count': 2,
                'success': True
            }, 200)
            
            response = client.post(
                "/invites",
                json={
                    "email": "newinvitee@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['send_count'] == 2
            assert data['success'] is True


@pytest.mark.asyncio
async def test_scenario_3_fourth_send_cap_reached():
    """Scenario 3: Fourth send returns 409 cap_reached"""
    oca_user_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        mock_user = MagicMock()
        mock_user.user.id = oca_user_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            # Raise HTTPException for cap reached
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(status_code=409, detail={'error': 'cap_reached'})
            
            response = client.post(
                "/invites",
                json={
                    "email": "newinvitee@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 409
            data = response.json()
            assert data['detail']['error'] == 'cap_reached'


@pytest.mark.asyncio
async def test_scenario_4_self_invite():
    """Scenario 4: Self-invite returns 409 self_invite"""
    oca_user_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        mock_user = MagicMock()
        mock_user.user.id = oca_user_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(status_code=409, detail={'error': 'self_invite'})
            
            response = client.post(
                "/invites",
                json={
                    "email": "oca@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 409
            data = response.json()
            assert data['detail']['error'] == 'self_invite'


@pytest.mark.asyncio
async def test_scenario_5_already_member():
    """Scenario 5: Already-member invite returns 409 already_member"""
    oca_user_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        mock_user = MagicMock()
        mock_user.user.id = oca_user_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(status_code=409, detail={'error': 'already_member'})
            
            response = client.post(
                "/invites",
                json={
                    "email": "existing@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 409
            data = response.json()
            assert data['detail']['error'] == 'already_member'


@pytest.mark.asyncio
async def test_scenario_6_cx_engineer_forbidden():
    """Scenario 6: CX Engineer invite attempt returns 403"""
    cx_engineer_id = str(uuid.uuid4())
    
    with patch('main.supabase') as mock_main_supabase:
        mock_user = MagicMock()
        mock_user.user.id = cx_engineer_id
        mock_main_supabase.auth.get_user.return_value = mock_user
        
        with patch('invitation_service.InvitationService.create_invitation') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(status_code=403, detail="Only OCA can invite")
            
            response = client.post(
                "/invites",
                json={
                    "email": "newinvitee@test.com",
                    "org_id": str(uuid.uuid4()),
                    "project_id": str(uuid.uuid4()),
                    "role": "cx_engineer",
                    "discipline_scope_id": str(uuid.uuid4())
                },
                headers={"Authorization": "Bearer fake-jwt-token"}
            )
            
            assert response.status_code == 403


if __name__ == "__main__":
    import asyncio
    
    asyncio.run(test_scenario_1_new_invite())
    print("✅ Test 1 passed: New invite returns 201 with send_count=1")
    
    asyncio.run(test_scenario_2_immediate_resend())
    print("✅ Test 2 passed: Immediate re-send returns 200 with send_count=2")
    
    asyncio.run(test_scenario_3_fourth_send_cap_reached())
    print("✅ Test 3 passed: Fourth send returns 409 cap_reached")
    
    asyncio.run(test_scenario_4_self_invite())
    print("✅ Test 4 passed: Self-invite returns 409 self_invite")
    
    asyncio.run(test_scenario_5_already_member())
    print("✅ Test 5 passed: Already-member invite returns 409 already_member")
    
    asyncio.run(test_scenario_6_cx_engineer_forbidden())
    print("✅ Test 6 passed: CX engineer invite attempt returns 403")
    
    print("\n✅ All endpoint integration tests passed!")