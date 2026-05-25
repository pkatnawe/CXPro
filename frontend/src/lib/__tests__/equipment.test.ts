import { describe, it, expect, vi } from 'vitest'
import { getEquipmentForProject } from '../equipment'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('getEquipmentForProject', () => {
  it('should return equipment rows for a project', async () => {
    const { supabase } = await import('../supabase')
    const mockData = [
      {
        id: 'tpi-1',
        asset_tag: 'PUMP-001',
        equipment_type: 'Pump',
        manufacturer: 'Acme',
        model: 'P-100',
        status: 'active',
        extracted_spec_id: 'spec-1',
        extracted_specs: {
          manufacturer: 'Acme Corp',
          model: 'P-100X'
        }
      },
      {
        id: 'tpi-2',
        asset_tag: null,
        equipment_type: 'Fan',
        manufacturer: null,
        model: null,
        status: 'draft',
        extracted_spec_id: null,
        extracted_specs: null
      }
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })
    })
    
    ;(supabase.from as any) = mockFrom

    const result = await getEquipmentForProject('project-123')

    expect(mockFrom).toHaveBeenCalledWith('test_procedure_instances')
    expect(result).toEqual([
      {
        tpi_id: 'tpi-1',
        asset_tag: 'PUMP-001',
        equipment_type: 'Pump',
        manufacturer: 'Acme Corp', // Uses extracted_specs value
        model: 'P-100X', // Uses extracted_specs value
        status: 'active'
      },
      {
        tpi_id: 'tpi-2',
        asset_tag: null,
        equipment_type: 'Fan',
        manufacturer: null, // No extracted_specs, no TPI value
        model: null, // No extracted_specs, no TPI value
        status: 'draft'
      }
    ])
  })

  it('should handle cases where extracted_specs is missing', async () => {
    const { supabase } = await import('../supabase')
    const mockData = [
      {
        id: 'tpi-3',
        asset_tag: 'VALVE-002',
        equipment_type: 'Valve',
        manufacturer: 'ValveCo',
        model: 'V-200',
        status: 'completed',
        extracted_spec_id: null,
        extracted_specs: null
      }
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })
    })
    
    ;(supabase.from as any) = mockFrom

    const result = await getEquipmentForProject('project-456')

    expect(result).toEqual([
      {
        tpi_id: 'tpi-3',
        asset_tag: 'VALVE-002',
        equipment_type: 'Valve',
        manufacturer: 'ValveCo', // Uses TPI value when extracted_specs is null
        model: 'V-200', // Uses TPI value when extracted_specs is null
        status: 'completed'
      }
    ])
  })

  it('should return empty array when no equipment exists', async () => {
    const { supabase } = await import('../supabase')

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })
    
    ;(supabase.from as any) = mockFrom

    const result = await getEquipmentForProject('project-789')

    expect(result).toEqual([])
  })

  it('should throw error when Supabase query fails', async () => {
    const { supabase } = await import('../supabase')

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })
    })
    
    ;(supabase.from as any) = mockFrom

    await expect(getEquipmentForProject('project-error')).rejects.toThrow('Database error')
  })
})