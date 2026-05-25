from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os
import asyncpg
from supabase import create_client, Client
from invitation_service import InvitationService

app = FastAPI(title="CXPro Backend", version="0.1.0")

# Security
security = HTTPBearer()

# Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.getenv("DATABASE_SECRET", "")
supabase: Client = create_client(supabase_url, supabase_key)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")


class InvitationRequest(BaseModel):
    """Request model for creating an invitation"""
    email: str
    org_id: str
    project_id: str
    role: str
    discipline_scope_id: str


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        # Verify the JWT and get user
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")


@app.post("/invites")
async def create_invitation(
    request: InvitationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Create a new invitation and send magic link email
    
    Requires:
    - Caller must be OCA of the target organization
    - Valid JWT token in Authorization header
    """
    # Get current user from token
    current_user = await get_current_user(credentials)
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Create service instance
        service = InvitationService(supabase, conn)
        
        # Create invitation
        result = await service.create_invitation(
            email=request.email,
            org_id=request.org_id,
            project_id=request.project_id,
            role=request.role,
            discipline_scope_id=request.discipline_scope_id,
            invited_by=current_user.id
        )
        
        return result
    
    finally:
        await conn.close()


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "ok"}


@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "CXPro Backend API", "version": "0.1.0"}