#!/usr/bin/env python3
"""
InvitationService for handling team invitations
"""

import secrets
import os
from typing import Optional
from datetime import datetime, timedelta
import uuid
from fastapi import HTTPException
import asyncpg


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
    ) -> dict:
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
            Dict with invitation ID and success flag
            
        Raises:
            HTTPException: If inviter is not OCA of the organization
        """
        # Verify caller is OCA of the target org
        is_oca = await self._verify_user_is_oca(invited_by, org_id)
        if not is_oca:
            raise HTTPException(status_code=403, detail="Only OCAs can invite users to the organization")
        
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        
        # Construct the redirect URL
        redirect_to = f"{self.frontend_url}/accept-invite?token={token}"
        
        # Create pending invitation in database
        invitation_id = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=7)
        
        await self.conn.execute("""
            INSERT INTO pending_invitations (
                id, email, org_id, project_id, role, discipline_scope_id,
                token, invited_by, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, invitation_id, email, org_id, project_id, role, discipline_scope_id,
            token, invited_by, expires_at, datetime.now())
        
        # Determine whether the invitee already has an account.
        # auth.get_user() takes a JWT — not an email — so it's unsuitable here.
        # Query the public.users table directly (populated by the handle_new_user trigger).
        existing = await self.conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", email
        )
        user_exists = existing is not None

        # Send the magic-link email through Supabase Auth.
        # Both SDK methods take snake_case option keys (redirect_to / email_redirect_to).
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
        
        return {
            'id': invitation_id,
            'success': True
        }
    
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