#!/usr/bin/env python3
"""
Tests for the permissions module.
Verifies permission predicates for team management and project creation.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from contexts.identity_access.memberships import can_manage_team, can_create_project, ROLES


def test_can_manage_team_with_valid_roles():
    """Test can_manage_team returns True only for OCA and CM"""
    # Roles that CAN manage team
    assert can_manage_team('OCA') is True
    assert can_manage_team('CM') is True
    
    # Roles that CANNOT manage team
    assert can_manage_team('cx_engineer') is False
    assert can_manage_team('field_technician') is False
    assert can_manage_team('design_engineer') is False
    assert can_manage_team('owner_fm') is False


def test_can_manage_team_with_invalid_values():
    """Test can_manage_team returns False for invalid values"""
    # None
    assert can_manage_team(None) is False
    
    # Empty string
    assert can_manage_team('') is False
    
    # Unknown roles
    assert can_manage_team('ADMIN') is False
    assert can_manage_team('admin') is False
    assert can_manage_team('USER') is False
    assert can_manage_team('invalid') is False
    assert can_manage_team('unknown') is False
    
    # Case variants (roles are case-sensitive)
    assert can_manage_team('oca') is False  # lowercase variant of OCA
    assert can_manage_team('Oca') is False  # mixed case
    assert can_manage_team('cm') is False   # lowercase variant of CM
    assert can_manage_team('Cm') is False   # mixed case
    
    # Non-string types
    assert can_manage_team(123) is False
    assert can_manage_team([]) is False
    assert can_manage_team({}) is False
    assert can_manage_team(['OCA']) is False


def test_can_create_project_with_valid_roles():
    """Test can_create_project returns True only for OCA and CM"""
    # Roles that CAN create projects
    assert can_create_project('OCA') is True
    assert can_create_project('CM') is True
    
    # Roles that CANNOT create projects
    assert can_create_project('cx_engineer') is False
    assert can_create_project('field_technician') is False
    assert can_create_project('design_engineer') is False
    assert can_create_project('owner_fm') is False


def test_can_create_project_with_invalid_values():
    """Test can_create_project returns False for invalid values"""
    # None
    assert can_create_project(None) is False
    
    # Empty string
    assert can_create_project('') is False
    
    # Unknown roles
    assert can_create_project('ADMIN') is False
    assert can_create_project('admin') is False
    assert can_create_project('USER') is False
    assert can_create_project('invalid') is False
    assert can_create_project('unknown') is False
    
    # Case variants (roles are case-sensitive)
    assert can_create_project('oca') is False  # lowercase variant of OCA
    assert can_create_project('Oca') is False  # mixed case
    assert can_create_project('cm') is False   # lowercase variant of CM
    assert can_create_project('Cm') is False   # mixed case
    
    # Non-string types
    assert can_create_project(123) is False
    assert can_create_project([]) is False
    assert can_create_project({}) is False
    assert can_create_project(['OCA']) is False


def test_all_roles_covered_in_can_manage_team():
    """Test that all 6 canonical roles are handled by can_manage_team"""
    results = {}
    for role in ROLES:
        results[role] = can_manage_team(role)
    
    # OCA and CM should return True
    assert results['OCA'] is True
    assert results['CM'] is True
    
    # All others should return False
    assert results['cx_engineer'] is False
    assert results['field_technician'] is False
    assert results['design_engineer'] is False
    assert results['owner_fm'] is False


def test_all_roles_covered_in_can_create_project():
    """Test that all 6 canonical roles are handled by can_create_project"""
    results = {}
    for role in ROLES:
        results[role] = can_create_project(role)
    
    # OCA and CM should return True
    assert results['OCA'] is True
    assert results['CM'] is True
    
    # All others should return False
    assert results['cx_engineer'] is False
    assert results['field_technician'] is False
    assert results['design_engineer'] is False
    assert results['owner_fm'] is False


def test_both_predicates_are_consistent():
    """Test that both predicates return the same values for the same roles"""
    # This test documents that both predicates currently have the same logic
    # If this changes in the future, this test should be updated
    for role in ROLES:
        assert can_manage_team(role) == can_create_project(role), \
            f"Predicates differ for role {role}"
    
    # Also test with invalid values
    invalid_values = [None, '', 'ADMIN', 'invalid', 123, [], {}]
    for value in invalid_values:
        assert can_manage_team(value) == can_create_project(value), \
            f"Predicates differ for value {value}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])