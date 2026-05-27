"""
Deep module: Role/Permission administration and Membership lifecycle for Identity & Access context.
Absorbs roles.py (ROLES, ROLE_LABELS, is_valid_role) and permissions.py (can_manage_team, can_create_project).
"""

ROLES = (
    'OCA',
    'CM',
    'cx_engineer',
    'field_technician',
    'design_engineer',
    'owner_fm'
)

ROLE_LABELS = {
    'OCA': "Owner's Commissioning Agent",
    'CM': 'Construction Manager',
    'cx_engineer': 'Commissioning Engineer',
    'field_technician': 'Field Technician',
    'design_engineer': 'Design Engineer',
    'owner_fm': 'Owner/Facility Manager'
}


def is_valid_role(s: str) -> bool:
    if not s or not isinstance(s, str):
        return False
    return s in ROLES


def can_manage_team(role: str) -> bool:
    if not role or not isinstance(role, str):
        return False
    return role in ('OCA', 'CM')


def can_create_project(role: str) -> bool:
    if not role or not isinstance(role, str):
        return False
    return role in ('OCA', 'CM')
