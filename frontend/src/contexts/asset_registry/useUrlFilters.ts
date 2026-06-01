'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export type FilterKey = 'status' | 'space' | 'system' | 'type' | 'parent'

const FILTER_KEYS: FilterKey[] = ['status', 'space', 'system', 'type', 'parent']

export interface AssetFilters {
  status?: string
  space?: string
  system?: string
  type?: string
  parent?: string
}

export interface UseUrlFiltersResult {
  filters: AssetFilters
  setFilter: (key: FilterKey, value: string) => void
  clearFilter: (key: FilterKey) => void
  clearAll: () => void
}

export function useUrlFilters(): UseUrlFiltersResult {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters: AssetFilters = {}
  for (const key of FILTER_KEYS) {
    const val = searchParams.get(key)
    if (val !== null) {
      filters[key] = val
    }
  }

  function setFilter(key: FilterKey, value: string): void {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`?${params.toString()}`)
  }

  function clearFilter(key: FilterKey): void {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?')
  }

  function clearAll(): void {
    const params = new URLSearchParams(searchParams.toString())
    for (const key of FILTER_KEYS) {
      params.delete(key)
    }
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?')
  }

  return { filters, setFilter, clearFilter, clearAll }
}
