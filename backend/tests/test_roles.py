#!/usr/bin/env python3
"""
Tests for the roles module.
Verifies role validation and constants.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from contexts.identity_access.memberships import ROLES, ROLE_LABELS, is_valid_role


def test_roles_constant():
    """Test that ROLES contains the correct 6 values"""
    assert ROLES == (
        'OCA',
        'CM',
        'cx_engineer',
        'field_technician',
        'design_engineer',
        'owner_fm'
    )
    assert len(ROLES) == 6


def test_role_labels():
    """Test that ROLE_LABELS contains display labels for all roles"""
    assert len(ROLE_LABELS) == 6
    assert ROLE_LABELS['OCA'] == "Owner's Commissioning Agent"
    assert ROLE_LABELS['CM'] == 'Construction Manager'
    assert ROLE_LABELS['cx_engineer'] == 'Commissioning Engineer'
    assert ROLE_LABELS['field_technician'] == 'Field Technician'
    assert ROLE_LABELS['design_engineer'] == 'Design Engineer'
    assert ROLE_LABELS['owner_fm'] == 'Owner/Facility Manager'
    
    # Verify all ROLES have a label
    for role in ROLES:
        assert role in ROLE_LABELS


def test_is_valid_role_with_valid_values():
    """Test is_valid_role returns True for each of the 6 valid values"""
    assert is_valid_role('OCA') is True
    assert is_valid_role('CM') is True
    assert is_valid_role('cx_engineer') is True
    assert is_valid_role('field_technician') is True
    assert is_valid_role('design_engineer') is True
    assert is_valid_role('owner_fm') is True


def test_is_valid_role_with_invalid_values():
    """Test is_valid_role returns False for invalid values"""
    # Empty string
    assert is_valid_role('') is False
    
    # None
    assert is_valid_role(None) is False
    
    # Invalid role names
    assert is_valid_role('ADMIN') is False
    assert is_valid_role('admin') is False
    assert is_valid_role('USER') is False
    assert is_valid_role('invalid') is False
    
    # Case variants (roles are case-sensitive)
    assert is_valid_role('oca') is False  # lowercase variant
    assert is_valid_role('Oca') is False  # mixed case
    assert is_valid_role('cm') is False   # lowercase variant
    assert is_valid_role('CX_ENGINEER') is False  # uppercase variant
    
    # Non-string types
    assert is_valid_role(123) is False
    assert is_valid_role([]) is False
    assert is_valid_role({}) is False


def test_all_roles_in_labels():
    """Test that every role in ROLES has a corresponding label"""
    for role in ROLES:
        assert role in ROLE_LABELS, f"Role {role} missing from ROLE_LABELS"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])