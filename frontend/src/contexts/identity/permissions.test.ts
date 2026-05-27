import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  }
}))

import { canManageTeam, canCreateProject } from './api'
import type { Role } from './api'

describe('permissions', () => {
  describe('canManageTeam', () => {
    it('should return true for OCA role', () => {
      expect(canManageTeam('OCA')).toBe(true)
    })

    it('should return true for CM role', () => {
      expect(canManageTeam('CM')).toBe(true)
    })

    it('should return false for cx_engineer role', () => {
      expect(canManageTeam('cx_engineer')).toBe(false)
    })

    it('should return false for field_technician role', () => {
      expect(canManageTeam('field_technician')).toBe(false)
    })

    it('should return false for design_engineer role', () => {
      expect(canManageTeam('design_engineer')).toBe(false)
    })

    it('should return false for owner_fm role', () => {
      expect(canManageTeam('owner_fm')).toBe(false)
    })

    it('should return false for null', () => {
      expect(canManageTeam(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canManageTeam(undefined)).toBe(false)
    })
  })

  describe('canCreateProject', () => {
    it('should return true for OCA role', () => {
      expect(canCreateProject('OCA')).toBe(true)
    })

    it('should return true for CM role', () => {
      expect(canCreateProject('CM')).toBe(true)
    })

    it('should return false for cx_engineer role', () => {
      expect(canCreateProject('cx_engineer')).toBe(false)
    })

    it('should return false for field_technician role', () => {
      expect(canCreateProject('field_technician')).toBe(false)
    })

    it('should return false for design_engineer role', () => {
      expect(canCreateProject('design_engineer')).toBe(false)
    })

    it('should return false for owner_fm role', () => {
      expect(canCreateProject('owner_fm')).toBe(false)
    })

    it('should return false for null', () => {
      expect(canCreateProject(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canCreateProject(undefined)).toBe(false)
    })
  })
})
