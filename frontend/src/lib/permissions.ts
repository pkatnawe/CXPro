import type { Role } from './roles';

export function canManageTeam(role: Role | null | undefined): boolean {
  return role === 'OCA' || role === 'CM';
}

export function canCreateProject(role: Role | null | undefined): boolean {
  return role === 'OCA' || role === 'CM';
}