#!/usr/bin/env python3
"""
Tests for the invite_decision pure module.
"""

import pytest
from datetime import datetime, timezone, timedelta
from invite_decision import (
    decide_invite_action,
    ExistingInvite,
    CreateNew,
    ReplaceExpired,
    IncrementResend,
    RejectCapReached
)


def test_create_new_when_no_existing_row():
    """Test that CreateNew is returned when existing_row is None."""
    now = datetime.now(timezone.utc)
    action = decide_invite_action(existing_row=None, now=now)
    
    assert isinstance(action, CreateNew)
    assert action.action == "create_new"


def test_replace_expired_when_invitation_expired():
    """Test that ReplaceExpired is returned when existing invitation is expired."""
    now = datetime.now(timezone.utc)
    past = now - timedelta(hours=1)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=past,  # Expired 1 hour ago
        send_count=1,
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now)
    
    assert isinstance(action, ReplaceExpired)
    assert action.action == "replace_expired"


def test_increment_resend_when_under_cap():
    """Test that IncrementResend is returned when active and send_count < cap."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    existing = ExistingInvite(
        email="test@example.com", 
        project_id="proj-123",
        expires_at=future,  # Valid for 24 more hours
        send_count=2,  # Under cap of 3
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now, cap=3)
    
    assert isinstance(action, IncrementResend)
    assert action.action == "increment_resend"
    assert action.new_count == 3  # 2 + 1


def test_increment_resend_with_send_count_1():
    """Test IncrementResend when send_count is 1."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123", 
        expires_at=future,
        send_count=1,
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now, cap=3)
    
    assert isinstance(action, IncrementResend)
    assert action.new_count == 2


def test_reject_cap_reached_when_at_cap():
    """Test that RejectCapReached is returned when active and send_count >= cap."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=future,  # Still valid
        send_count=3,  # At cap
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now, cap=3)
    
    assert isinstance(action, RejectCapReached)
    assert action.action == "reject_cap_reached"


def test_reject_cap_reached_when_over_cap():
    """Test RejectCapReached when send_count is somehow over cap."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=future,
        send_count=5,  # Over cap of 3
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now, cap=3)
    
    assert isinstance(action, RejectCapReached)


def test_raises_error_when_already_accepted():
    """Test that ValueError is raised if existing_row has accepted_at set."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=future,
        send_count=1,
        accepted_at=now  # Already accepted!
    )
    
    with pytest.raises(ValueError) as excinfo:
        decide_invite_action(existing_row=existing, now=now)
    
    assert "should not be called with accepted invitations" in str(excinfo.value)


def test_custom_cap_parameter():
    """Test that custom cap parameter works correctly."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=24)
    
    # Test with cap=5, send_count=4 (under cap)
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=future,
        send_count=4,
        accepted_at=None
    )
    
    action = decide_invite_action(existing_row=existing, now=now, cap=5)
    assert isinstance(action, IncrementResend)
    assert action.new_count == 5
    
    # Test with cap=2, send_count=2 (at cap)
    existing2 = ExistingInvite(
        email="test2@example.com",
        project_id="proj-456",
        expires_at=future,
        send_count=2,
        accepted_at=None
    )
    
    action2 = decide_invite_action(existing_row=existing2, now=now, cap=2)
    assert isinstance(action2, RejectCapReached)


def test_edge_case_exactly_at_expiration():
    """Test behavior when expires_at equals now exactly."""
    now = datetime.now(timezone.utc)
    
    existing = ExistingInvite(
        email="test@example.com",
        project_id="proj-123",
        expires_at=now,  # Expires exactly now
        send_count=1,
        accepted_at=None
    )
    
    # Since expires_at < now is False when they're equal, this should not be expired
    action = decide_invite_action(existing_row=existing, now=now)
    
    # The invite is not expired (expires_at < now is False), so should increment
    assert isinstance(action, IncrementResend)
    assert action.new_count == 2