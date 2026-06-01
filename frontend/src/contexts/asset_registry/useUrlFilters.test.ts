import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockReplace: ReturnType<typeof vi.fn>
let mockSearchParamsString: string

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}))

import { useUrlFilters, type FilterKey } from './useUrlFilters'

function callHook() {
  return useUrlFilters()
}

describe('useUrlFilters', () => {
  beforeEach(() => {
    mockReplace = vi.fn()
    mockSearchParamsString = ''
  })

  it('empty params yields empty filters object', () => {
    mockSearchParamsString = ''
    const { filters } = callHook()
    expect(filters).toEqual({})
  })

  it('round-trip status key', () => {
    mockSearchParamsString = 'status=active'
    const { filters } = callHook()
    expect(filters.status).toBe('active')
  })

  it('round-trip space key', () => {
    mockSearchParamsString = 'space=space-1'
    const { filters } = callHook()
    expect(filters.space).toBe('space-1')
  })

  it('round-trip system key', () => {
    mockSearchParamsString = 'system=sys-1'
    const { filters } = callHook()
    expect(filters.system).toBe('sys-1')
  })

  it('round-trip type key', () => {
    mockSearchParamsString = 'type=at-1'
    const { filters } = callHook()
    expect(filters.type).toBe('at-1')
  })

  it('round-trip parent key', () => {
    mockSearchParamsString = 'parent=asset-parent'
    const { filters } = callHook()
    expect(filters.parent).toBe('asset-parent')
  })

  it('setFilter writes key via router.replace', () => {
    mockSearchParamsString = ''
    const { setFilter } = callHook()
    setFilter('status', 'retired')
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('status=retired'))
  })

  it('setFilter merges with existing params', () => {
    mockSearchParamsString = 'space=space-1'
    const { setFilter } = callHook()
    setFilter('status', 'active')
    const called = mockReplace.mock.calls[0][0] as string
    expect(called).toContain('space=space-1')
    expect(called).toContain('status=active')
  })

  it('clearFilter removes a single key', () => {
    mockSearchParamsString = 'status=active&space=space-1'
    const { clearFilter } = callHook()
    clearFilter('status')
    const called = mockReplace.mock.calls[0][0] as string
    expect(called).not.toContain('status')
    expect(called).toContain('space=space-1')
  })

  it('clearAll removes all five filter keys', () => {
    mockSearchParamsString = 'status=active&space=s1&system=sys1&type=at1&parent=p1'
    const { clearAll } = callHook()
    clearAll()
    const called = mockReplace.mock.calls[0][0] as string
    for (const key of ['status', 'space', 'system', 'type', 'parent'] as FilterKey[]) {
      expect(called).not.toContain(key)
    }
  })

  it('unknown params are preserved on setFilter', () => {
    mockSearchParamsString = 'unknown=keep&status=active'
    const { setFilter } = callHook()
    setFilter('space', 'space-2')
    const called = mockReplace.mock.calls[0][0] as string
    expect(called).toContain('unknown=keep')
  })

  it('unknown params are preserved on clearFilter', () => {
    mockSearchParamsString = 'unknown=keep&status=active'
    const { clearFilter } = callHook()
    clearFilter('status')
    const called = mockReplace.mock.calls[0][0] as string
    expect(called).toContain('unknown=keep')
  })

  it('unknown params are preserved on clearAll', () => {
    mockSearchParamsString = 'unknown=keep&status=active&space=s1'
    const { clearAll } = callHook()
    clearAll()
    const called = mockReplace.mock.calls[0][0] as string
    expect(called).toContain('unknown=keep')
    expect(called).not.toContain('status')
    expect(called).not.toContain('space')
  })
})
