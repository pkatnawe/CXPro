"""
Deep module: invitation lifecycle for Identity & Access context.
Public API: send_invite (create_invitation), resend handled via send_invite, redeem_invite.
Inlines InviteDecision pure logic (formerly invite_decision.py).
"""

import secrets
import os
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid
from dataclasses import dataclass
from typing import Union, Literal

from fastapi import HTTPException
import asyncpg

from db import get_db_connection
from auth import require_permission


# ---------------------------------------------------------------------------
# InviteDecision pure logic (private, colocated)
# ---------------------------------------------------------------------------

@dataclass
class ExistingInvite:
    email: str
    project_id: str
    expires_at: datetime
    send_count: int
    accepted_at: Optional[datetime] = None


@dataclass
class CreateNew:
    action: Literal["create_new"] = "create_new"


@dataclass
class ReplaceExpired:
    action: Literal["replace_expired"] = "replace_expired"


@dataclass
class IncrementResend:
    new_count: int
    action: Literal["increment_resend"] = "increment_resend"


@dataclass
class RejectCapReached:
    action: Literal["reject_cap_reached"] = "reject_cap_reached"


_Action = Union[CreateNew, ReplaceExpired, IncrementResend, RejectCapReached]


def _decide_invite_action(
    existing_row: Optional[ExistingInvite],
    now: datetime,
    cap: int = 3,
) -> _Action:
    if existing_row is None:
        return CreateNew()
    if existing_row.accepted_at is not None:
        raise ValueError(
            "decide_invite_action should not be called with accepted invitations. "
            "The service layer should filter these out."
        )
    if existing_row.expires_at < now:
        return ReplaceExpired()
    if existing_row.send_count < cap:
        return IncrementResend(new_count=existing_row.send_count + 1)
    return RejectCapReached()


# ---------------------------------------------------------------------------
# InvitationService (public)
# ---------------------------------------------------------------------------

class InvitationService:
    """Service for creating and managing invitations."""

    def __init__(self, supabase_client, db_conn: asyncpg.Connection = None):
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
        invited_by: str,
    ) -> tuple[dict, int]:
        from contexts.identity_access.memberships import is_valid_role, can_manage_team

        if not is_valid_role(role):
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

        caller_role = await self._get_user_role(invited_by, org_id)
        if not can_manage_team(caller_role):
            raise HTTPException(status_code=403, detail="You do not have permission to invite users to the organization")

        inviter_email_result = await self.conn.fetchrow(
            "SELECT email FROM users WHERE id = $1", invited_by
        )
        if inviter_email_result and inviter_email_result["email"] == email:
            raise HTTPException(status_code=409, detail={"error": "self_invite"})

        existing_member = await self.conn.fetchrow("""
            SELECT m.user_id
            FROM memberships m
            JOIN users u ON u.id = m.user_id
            WHERE u.email = $1 AND m.org_id = $2
        """, email, org_id)
        if existing_member:
            raise HTTPException(status_code=409, detail={"error": "already_member"})

        existing_invite = await self.conn.fetchrow("""
            SELECT id, email, project_id, expires_at, send_count, accepted_at, token
            FROM pending_invitations
            WHERE email = $1 AND project_id = $2 AND accepted_at IS NULL
        """, email, project_id)

        existing_row = None
        if existing_invite:
            existing_row = ExistingInvite(
                email=existing_invite["email"],
                project_id=str(existing_invite["project_id"]),
                expires_at=existing_invite["expires_at"],
                send_count=existing_invite["send_count"],
                accepted_at=existing_invite["accepted_at"],
            )

        now = datetime.now(timezone.utc)
        action = _decide_invite_action(existing_row, now)

        if isinstance(action, CreateNew):
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
            return {"id": invitation_id, "send_count": 1, "success": True}, 201

        elif isinstance(action, ReplaceExpired):
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
            return {"id": invitation_id, "send_count": 1, "success": True}, 201

        elif isinstance(action, IncrementResend):
            token = secrets.token_urlsafe(32)
            await self.conn.execute("""
                UPDATE pending_invitations
                SET token = $1, send_count = $2
                WHERE email = $3 AND project_id = $4 AND accepted_at IS NULL
            """, token, action.new_count, email, project_id)
            await self._send_invite_email(email, token)
            return {"id": str(existing_invite["id"]), "send_count": action.new_count, "success": True}, 200

        elif isinstance(action, RejectCapReached):
            raise HTTPException(status_code=409, detail={"error": "cap_reached"})

        raise ValueError(f"Unexpected action type: {type(action)}")

    async def _send_invite_email(self, email: str, token: str):
        redirect_to = f"{self.frontend_url}/accept-invite?token={token}"
        existing = await self.conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", email
        )
        user_exists = existing is not None
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

    async def _get_user_role(self, user_id: str, org_id: str) -> Optional[str]:
        if not self.conn:
            return None
        result = await self.conn.fetchrow(
            "SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2",
            user_id, org_id,
        )
        return result["role"] if result else None


# ---------------------------------------------------------------------------
# Public functional API
# ---------------------------------------------------------------------------

async def send_invite(
    supabase_client,
    conn: asyncpg.Connection,
    *,
    email: str,
    org_id: str,
    project_id: str,
    role: str,
    discipline_scope_id: str,
    invited_by: str,
) -> tuple[dict, int]:
    service = InvitationService(supabase_client, conn)
    return await service.create_invitation(
        email=email,
        org_id=org_id,
        project_id=project_id,
        role=role,
        discipline_scope_id=discipline_scope_id,
        invited_by=invited_by,
    )
