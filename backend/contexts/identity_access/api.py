"""
Thin HTTP router for Identity & Access context.
Delegates all business logic to invitations.py and memberships.py.
"""

from fastapi import APIRouter, Depends, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel

from auth import security, get_current_user
from db import get_supabase_client, get_db_connection
from contexts.identity_access.invitations import InvitationService

router = APIRouter()


class InvitationRequest(BaseModel):
    email: str
    org_id: str
    project_id: str
    role: str
    discipline_scope_id: str


@router.post("/invites")
async def create_invitation(
    request: InvitationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
):
    current_user = await get_current_user(credentials)

    supabase = get_supabase_client()
    conn = await get_db_connection()

    try:
        service = InvitationService(supabase, conn)
        result, status_code = await service.create_invitation(
            email=request.email,
            org_id=request.org_id,
            project_id=request.project_id,
            role=request.role,
            discipline_scope_id=request.discipline_scope_id,
            invited_by=current_user.id,
        )
        response.status_code = status_code
        return result
    finally:
        await conn.close()
