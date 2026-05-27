"""
Backend permissions module.
Provides named predicates for permission gates to consolidate role-based checks.
"""


def can_manage_team(role: str) -> bool:
    """
    Check if a role has permission to manage team members.
    
    Args:
        role: Role string to check
        
    Returns:
        True if role is 'OCA' or 'CM', False otherwise.
        Returns False for None, empty string, and unknown roles.
    """
    if not role or not isinstance(role, str):
        return False
    return role in ('OCA', 'CM')


def can_create_project(role: str) -> bool:
    """
    Check if a role has permission to create projects.
    
    Args:
        role: Role string to check
        
    Returns:
        True if role is 'OCA' or 'CM', False otherwise.
        Returns False for None, empty string, and unknown roles.
    """
    if not role or not isinstance(role, str):
        return False
    return role in ('OCA', 'CM')