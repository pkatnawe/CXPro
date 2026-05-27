import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  }
}))

import { ROLES, ROLE_LABELS, isValidRole, type Role } from './api'

describe('roles module', () => {
  describe('ROLES constant', () => {
    it('contains exactly 6 role values', () => {
      expect(ROLES).toHaveLength(6)
      expect(ROLES).toEqual([
        'OCA',
        'CM',
        'cx_engineer',
        'field_technician',
        'design_engineer',
        'owner_fm'
      ])
    })
  })

  describe('ROLE_LABELS', () => {
    it('has labels for all roles', () => {
      for (const role of ROLES) {
        expect(ROLE_LABELS[role]).toBeDefined()
        expect(typeof ROLE_LABELS[role]).toBe('string')
      }
    })
  })

  describe('isValidRole', () => {
    it('returns true for each of the 6 valid role values', () => {
      expect(isValidRole('OCA')).toBe(true)
      expect(isValidRole('CM')).toBe(true)
      expect(isValidRole('cx_engineer')).toBe(true)
      expect(isValidRole('field_technician')).toBe(true)
      expect(isValidRole('design_engineer')).toBe(true)
      expect(isValidRole('owner_fm')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(isValidRole('')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidRole(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidRole(undefined)).toBe(false)
    })

    it('returns false for non-existent role ADMIN', () => {
      expect(isValidRole('ADMIN')).toBe(false)
    })

    it('returns false for case variants', () => {
      expect(isValidRole('oca')).toBe(false)
      expect(isValidRole('Oca')).toBe(false)
      expect(isValidRole('CX_ENGINEER')).toBe(false)
    })

    it('returns false for non-string types', () => {
      expect(isValidRole(123)).toBe(false)
      expect(isValidRole({})).toBe(false)
      expect(isValidRole([])).toBe(false)
      expect(isValidRole(true)).toBe(false)
    })
  })
})
