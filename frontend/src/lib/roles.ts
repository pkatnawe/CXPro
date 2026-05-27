// Canonical role values as a readonly tuple
export const ROLES = [
  'OCA',
  'CM',
  'cx_engineer',
  'field_technician',
  'design_engineer',
  'owner_fm'
] as const;

// Derive Role type from the ROLES tuple
export type Role = typeof ROLES[number];

// Display labels for each role
export const ROLE_LABELS: Record<Role, string> = {
  'OCA': 'Owner\'s Commissioning Agent',
  'CM': 'Construction Manager',
  'cx_engineer': 'Cx Engineer',
  'field_technician': 'Field Technician',
  'design_engineer': 'Design Engineer',
  'owner_fm': 'Owner/FM'
};

// Type guard to check if a value is a valid Role
export function isValidRole(s: unknown): s is Role {
  return typeof s === 'string' && (ROLES as readonly string[]).includes(s);
}