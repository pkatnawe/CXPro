export type Phase = 'pre-install' | 'L2' | 'L3' | 'L4' | 'L5'

export interface PhaseInstance {
  level: string
  status: string
}

const ACTIVE_STATUSES = new Set(['in_progress', 'complete'])
const LEVEL_ORDER: Record<string, number> = { L2: 2, L3: 3, L4: 4, L5: 5 }

export function derivePhase(instances: PhaseInstance[]): Phase {
  let highestRank = 0
  let highestLevel = ''
  for (const inst of instances) {
    if (ACTIVE_STATUSES.has(inst.status)) {
      const rank = LEVEL_ORDER[inst.level] ?? 0
      if (rank > highestRank) {
        highestRank = rank
        highestLevel = inst.level
      }
    }
  }
  if (highestRank === 0) return 'pre-install'
  return highestLevel as Phase
}
