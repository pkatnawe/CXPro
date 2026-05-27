#!/usr/bin/env python3
"""
Tests for the invites endpoint
"""

import sys
import os
import unittest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import asyncio
from datetime import datetime, timedelta
import uuid

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from contexts.identity_access.invitations import InvitationService
from fastapi import HTTPException


class TestInvitesEndpoint(unittest.TestCase):
    """Test cases for the invites endpoint"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        self.mock_conn = AsyncMock()
        self.service = InvitationService(self.mock_supabase, self.mock_conn)
        
    def test_cm_can_invite(self):
        """Test that a CM (Construction Manager) can successfully invite users"""
        async def run_test():
            # Mock the role fetch to return CM
            self.mock_conn.fetchrow.return_value = {'role': 'CM'}
            
            # Mock the invitation insert
            self.mock_conn.execute.return_value = None
            
            # Mock user lookup (user doesn't exist)
            self.mock_conn.fetchrow.side_effect = [
                {'role': 'CM'},  # First call: get user role
                None  # Second call: check if user exists
            ]
            
            # Mock Supabase invite
            self.mock_supabase.auth.admin.invite_user_by_email = MagicMock()
            
            # Call the method
            result = await self.service.create_invitation(
                email="newuser@example.com",
                org_id="org-123",
                project_id="proj-456",
                role="cx_engineer",
                discipline_scope_id="disc-789",
                invited_by="user-cm"
            )
            
            # Assert success
            self.assertTrue(result['success'])
            self.assertIsNotNone(result['id'])
            
            # Verify invitation was created
            self.mock_conn.execute.assert_called_once()
            
            # Verify email was sent
            self.mock_supabase.auth.admin.invite_user_by_email.assert_called_once()
        
        asyncio.run(run_test())
    
    def test_invalid_role_rejected(self):
        """Test that an invalid role value is rejected with 400 error"""
        async def run_test():
            # Mock the role fetch
            self.mock_conn.fetchrow.return_value = {'role': 'OCA'}
            
            # Try to invite with invalid role
            with self.assertRaises(HTTPException) as context:
                await self.service.create_invitation(
                    email="newuser@example.com",
                    org_id="org-123",
                    project_id="proj-456",
                    role="not_a_role",
                    discipline_scope_id="disc-789",
                    invited_by="user-oca"
                )
            
            # Assert 400 error
            self.assertEqual(context.exception.status_code, 400)
            self.assertIn("Invalid role", context.exception.detail)
            
            # Verify no invitation was created
            self.mock_conn.execute.assert_not_called()
        
        asyncio.run(run_test())
    
    def test_non_manager_cannot_invite(self):
        """Test that users without manage_team permission cannot invite"""
        async def run_test():
            # Mock the role fetch to return cx_engineer (cannot manage team)
            self.mock_conn.fetchrow.return_value = {'role': 'cx_engineer'}
            
            # Try to invite
            with self.assertRaises(HTTPException) as context:
                await self.service.create_invitation(
                    email="newuser@example.com",
                    org_id="org-123",
                    project_id="proj-456",
                    role="cx_engineer",
                    discipline_scope_id="disc-789",
                    invited_by="user-eng"
                )
            
            # Assert 403 error
            self.assertEqual(context.exception.status_code, 403)
            self.assertIn("do not have permission", context.exception.detail)
            
            # Verify no invitation was created
            self.mock_conn.execute.assert_not_called()
        
        asyncio.run(run_test())
    
    def test_oca_can_still_invite(self):
        """Test that OCA users can still invite (backwards compatibility)"""
        async def run_test():
            # Mock the role fetch to return OCA
            self.mock_conn.fetchrow.return_value = {'role': 'OCA'}
            
            # Mock the invitation insert
            self.mock_conn.execute.return_value = None
            
            # Mock user lookup (user doesn't exist)
            self.mock_conn.fetchrow.side_effect = [
                {'role': 'OCA'},  # First call: get user role
                None  # Second call: check if user exists
            ]
            
            # Mock Supabase invite
            self.mock_supabase.auth.admin.invite_user_by_email = MagicMock()
            
            # Call the method
            result = await self.service.create_invitation(
                email="newuser@example.com",
                org_id="org-123",
                project_id="proj-456",
                role="field_technician",
                discipline_scope_id="disc-789",
                invited_by="user-oca"
            )
            
            # Assert success
            self.assertTrue(result['success'])
            self.assertIsNotNone(result['id'])
            
            # Verify invitation was created
            self.mock_conn.execute.assert_called_once()
        
        asyncio.run(run_test())


if __name__ == '__main__':
    unittest.main()
