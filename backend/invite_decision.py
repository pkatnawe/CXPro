#!/usr/bin/env python3
"""
Pure module for invite decision logic.
Determines what action to take when processing an invitation request.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Union, Literal


@dataclass
class ExistingInvite:
    """Represents an existing pending invitation row."""
    email: str
    project_id: str
    expires_at: datetime
    send_count: int
    accepted_at: Optional[datetime] = None


@dataclass 
class CreateNew:
    """Action: Create a new invitation."""
    action: Literal["create_new"] = "create_new"


@dataclass
class ReplaceExpired:
    """Action: Replace an expired invitation."""
    action: Literal["replace_expired"] = "replace_expired"


@dataclass
class IncrementResend:
    """Action: Increment resend count on existing invitation."""
    new_count: int
    action: Literal["increment_resend"] = "increment_resend"


@dataclass
class RejectCapReached:
    """Action: Reject because cap is reached."""
    action: Literal["reject_cap_reached"] = "reject_cap_reached"


Action = Union[CreateNew, ReplaceExpired, IncrementResend, RejectCapReached]


def decide_invite_action(
    existing_row: Optional[ExistingInvite],
    now: datetime,
    cap: int = 3
) -> Action:
    """
    Determine the appropriate action for an invitation request.
    
    Args:
        existing_row: Existing pending invitation if one exists
        now: Current datetime for expiration checks  
        cap: Maximum send count allowed (default 3)
        
    Returns:
        Action indicating what should be done
        
    Raises:
        ValueError: If existing_row has accepted_at set (service layer should filter this)
    """
    # No existing row - create new
    if existing_row is None:
        return CreateNew()
    
    # Sanity check - service layer should never pass accepted invites
    if existing_row.accepted_at is not None:
        raise ValueError(
            "decide_invite_action should not be called with accepted invitations. "
            "The service layer should filter these out."
        )
    
    # Check if expired
    if existing_row.expires_at < now:
        return ReplaceExpired()
    
    # Active invitation - check send count
    if existing_row.send_count < cap:
        return IncrementResend(new_count=existing_row.send_count + 1)
    else:
        return RejectCapReached()