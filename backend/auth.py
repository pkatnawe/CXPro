"""
Deep module: JWT extraction, current_user resolution, and permission enforcement.
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import get_supabase_client
from contexts.identity_access.memberships import can_manage_team

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    supabase = get_supabase_client()
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")


async def require_permission(user_id: str, org_id: str, permission: str, conn) -> None:
    result = await conn.fetchrow(
        "SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2",
        user_id, org_id
    )
    role = result["role"] if result else None

    if permission == "manage_team":
        if not can_manage_team(role):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to invite users to the organization",
            )
    else:
        raise HTTPException(status_code=403, detail="Permission denied")
