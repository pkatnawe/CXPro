#!/usr/bin/env python3
"""
InvitationService for handling team invitations
"""

import secrets
import os
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid
from fastapi import HTTPException
import asyncpg
from invite_decision import decide_invite_action, ExistingInvite, CreateNew, ReplaceExpired, IncrementResend, RejectCapReached


class InvitationService:
    """Service for creating and managing invitations"""
    
    def __init__(self, supabase_client, db_conn: asyncpg.Connection = None):
        """
        Initialize the service with a Supabase client and optional DB connection
        
        Args:
            supabase_client: Supabase client for auth operations
            db_conn: Optional asyncpg connection for direct DB operations
        """
        self.supabase = supabase_client
        self.conn = db_conn
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    async def create_invitation(
        self,
        email: str,
        org_id: str,
        project_id: str,
        role: str,
        discipline_scope_id: str,
        invited_by: str
    ) -> tuple[dict, int]:
        """
        Create a new invitation and send a magic link email
        
        Args:
            email: Email address of the invitee
            org_id: Organization ID
            project_id: Project ID
            role: Role to grant ('OCA' or 'cx_engineer')
            discipline_scope_id: Discipline scope ID
            invited_by: User ID of the inviter
            
        Returns:
            Tuple of (response dict, status code)
            
        Raises:
            HTTPException: Various 403/409 errors for permission/validation failures
        """
        # 1. Verify caller is OCA of the target org (existing 403 check)
        is_oca = await self._verify_user_is_oca(invited_by, org_id)
        if not is_oca:
            raise HTTPException(status_code=403, detail="Only OCAs can invite users to the organization")
        
        # 2. Pre-flight rejection: Self-invite check
        inviter_email_result = await self.conn.fetchrow(
            "SELECT email FROM users WHERE id = $1", invited_by
        )
        if inviter_email_result and inviter_email_result['email'] == email:
            raise HTTPException(status_code=409, detail={'error': 'self_invite'})
        
        # 3. Pre-flight rejection: Already-member check
        existing_member = await self.conn.fetchrow("""
            SELECT m.user_id 
            FROM memberships m
            JOIN users u ON u.id = m.user_id
            WHERE u.email = $1 AND m.org_id = $2
        """, email, org_id)
        if existing_member:
            raise HTTPException(status_code=409, detail={'error': 'already_member'})
        
        # 4. Fetch existing pending invitation (at most one due to partial unique index)
        existing_invite = await self.conn.fetchrow("""
            SELECT id, email, project_id, expires_at, send_count, accepted_at, token
            FROM pending_invitations
            WHERE email = $1 AND project_id = $2 AND accepted_at IS NULL
        """, email, project_id)
        
        # Convert to ExistingInvite if found
        existing_row = None
        if existing_invite:
            existing_row = ExistingInvite(
                email=existing_invite['email'],
                project_id=str(existing_invite['project_id']),
                expires_at=existing_invite['expires_at'],
                send_count=existing_invite['send_count'],
                accepted_at=existing_invite['accepted_at']
            )
        
        # 5. Call decide_invite_action
        now = datetime.now(timezone.utc)
        action = decide_invite_action(existing_row, now)
        
        # 6. Execute the appropriate action
        if isinstance(action, CreateNew):
            # Create new invitation
            token = secrets.token_urlsafe(32)
            invitation_id = str(uuid.uuid4())
            expires_at = now + timedelta(days=7)
            
            await self.conn.execute("""
                INSERT INTO pending_invitations (
                    id, email, org_id, project_id, role, discipline_scope_id,
                    token, invited_by, expires_at, created_at, send_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, invitation_id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, now, 1)
            
            await self._send_invite_email(email, token)
            return {'id': invitation_id, 'send_count': 1, 'success': True}, 201
            
        elif isinstance(action, ReplaceExpired):
            # Delete expired and create new
            await self.conn.execute("""
                DELETE FROM pending_invitations
                WHERE email = $1 AND project_id = $2 AND accepted_at IS NULL
            """, email, project_id)
            
            token = secrets.token_urlsafe(32)
            invitation_id = str(uuid.uuid4())
            expires_at = now + timedelta(days=7)
            
            await self.conn.execute("""
                INSERT INTO pending_invitations (
                    id, email, org_id, project_id, role, discipline_scope_id,
                    token, invited_by, expires_at, created_at, send_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, invitation_id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, now, 1)
            
            await self._send_invite_email(email, token)
            return {'id': invitation_id, 'send_count': 1, 'success': True}, 201
            
        elif isinstance(action, IncrementResend):
            # Regenerate token and update existing row
            token = secrets.token_urlsafe(32)
            await self.conn.execute("""
                UPDATE pending_invitations
                SET token = $1, send_count = $2
                WHERE email = $3 AND project_id = $4 AND accepted_at IS NULL
            """, token, action.new_count, email, project_id)
            
            await self._send_invite_email(email, token)
            return {'id': str(existing_invite['id']), 'send_count': action.new_count, 'success': True}, 200
            
        elif isinstance(action, RejectCapReached):
            raise HTTPException(status_code=409, detail={'error': 'cap_reached'})
        
        # Should never reach here
        raise ValueError(f"Unexpected action type: {type(action)}")
    
    async def _send_invite_email(self, email: str, token: str):
        """
        Send invitation email through Supabase Auth
        
        Args:
            email: Email address to send to
            token: Invitation token for the redirect URL
        """
        redirect_to = f"{self.frontend_url}/accept-invite?token={token}"
        
        # Check if user already has an account
        existing = await self.conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", email
        )
        user_exists = existing is not None
        
        # Send the magic-link email
        if not user_exists:
            self.supabase.auth.admin.invite_user_by_email(
                email,
                {"redirect_to": redirect_to},
            )
        else:
            self.supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {"email_redirect_to": redirect_to},
            })
    
    async def _verify_user_is_oca(self, user_id: str, org_id: str) -> bool:
        """
        Verify if a user is an OCA of the given organization
        
        Args:
            user_id: User ID to check
            org_id: Organization ID
            
        Returns:
            True if user is OCA, False otherwise
        """
        if not self.conn:
            return False
            
        result = await self.conn.fetchrow("""
            SELECT role FROM memberships 
            WHERE user_id = $1 AND org_id = $2
        """, user_id, org_id)
        
        return result is not None and result['role'] == 'OCA'