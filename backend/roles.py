"""
Backend roles module.
Provides a single source of truth for valid role values and their display labels.
"""

# The 6 canonical role string values from docs/architecture.md
ROLES = (
    'OCA',
    'CM',
    'cx_engineer',
    'field_technician',
    'design_engineer',
    'owner_fm'
)

# Display labels for each role
ROLE_LABELS = {
    'OCA': "Owner's Commissioning Agent",
    'CM': 'Construction Manager',
    'cx_engineer': 'Commissioning Engineer',
    'field_technician': 'Field Technician',
    'design_engineer': 'Design Engineer',
    'owner_fm': 'Owner/Facility Manager'
}


def is_valid_role(s: str) -> bool:
    """
    Check if a string is a valid role value.
    
    Args:
        s: String to validate
        
    Returns:
        True if s is one of the 6 valid role values, False otherwise.
        Returns False for None, empty string, or invalid values.
    """
    if not s or not isinstance(s, str):
        return False
    return s in ROLES