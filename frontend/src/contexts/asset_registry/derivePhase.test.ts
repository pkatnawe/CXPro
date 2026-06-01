import { describe, it, expect } from 'vitest'
import { derivePhase } from './derivePhase'
import type { PhaseInstance } from './derivePhase'

describe('derivePhase', () => {
  it('returns pre-install for empty array', () => {
    expect(derivePhase([])).toBe('pre-install')
  })

  it('returns pre-install when only pending instances', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'pending' },
    ]
    expect(derivePhase(instances)).toBe('pre-install')
  })

  it('returns L2 for one L2 in_progress', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'in_progress' },
    ]
    expect(derivePhase(instances)).toBe('L2')
  })

  it('returns L2 for L2 complete + L3 pending', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'complete' },
      { level: 'L3', status: 'pending' },
    ]
    expect(derivePhase(instances)).toBe('L2')
  })

  it('returns L3 for L2 complete + L3 in_progress', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'complete' },
      { level: 'L3', status: 'in_progress' },
    ]
    expect(derivePhase(instances)).toBe('L3')
  })

  it('returns L4 for L4 complete + L2 in_progress', () => {
    const instances: PhaseInstance[] = [
      { level: 'L4', status: 'complete' },
      { level: 'L2', status: 'in_progress' },
    ]
    expect(derivePhase(instances)).toBe('L4')
  })

  it('returns L5 for L5 in_progress', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'complete' },
      { level: 'L3', status: 'complete' },
      { level: 'L5', status: 'in_progress' },
    ]
    expect(derivePhase(instances)).toBe('L5')
  })

  it('returns pre-install when all instances are cancelled/unknown status', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'cancelled' },
      { level: 'L3', status: 'not_started' },
    ]
    expect(derivePhase(instances)).toBe('pre-install')
  })

  it('returns L2 for L2 complete (no other active instances)', () => {
    const instances: PhaseInstance[] = [
      { level: 'L2', status: 'complete' },
    ]
    expect(derivePhase(instances)).toBe('L2')
  })

  it('ignores L1 when computing highest (L1 not in active set)', () => {
    const instances: PhaseInstance[] = [
      { level: 'L1', status: 'in_progress' },
    ]
    expect(derivePhase(instances)).toBe('pre-install')
  })
})
