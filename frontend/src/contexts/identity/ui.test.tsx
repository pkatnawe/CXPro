import { describe, test, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({})
    }
  }
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/contexts/identity/api', () => ({
  getInitials: vi.fn().mockReturnValue('AB')
}))

import { UserMenu } from './ui'

describe('UserMenu', () => {
  test('UserMenu is exported from ui.tsx', () => {
    expect(typeof UserMenu).toBe('function')
  })
})
