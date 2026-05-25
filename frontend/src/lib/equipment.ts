import { supabase } from './supabase'

export interface EquipmentRow {
  tpi_id: string
  asset_tag: string | null
  equipment_type: string
  manufacturer: string | null
  model: string | null
  status: 'draft' | 'active' | 'completed' | 'archived'
}

export async function getEquipmentForProject(projectId: string): Promise<EquipmentRow[]> {
  try {
    // Query test_procedure_instances left joined with extracted_specs
    // Rows with no ExtractedSpec yet (in-progress ingestion) return with null metadata fields
    const { data, error } = await supabase
      .from('test_procedure_instances')
      .select(`
        id,
        asset_tag,
        equipment_type,
        manufacturer,
        model,
        status,
        extracted_spec_id,
        extracted_specs(
          manufacturer,
          model
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match EquipmentRow interface
    const equipmentRows: EquipmentRow[] = (data || []).map((tpi: any) => ({
      tpi_id: tpi.id,
      asset_tag: tpi.asset_tag || null,
      equipment_type: tpi.equipment_type,
      // Use extracted_specs data if available, otherwise use TPI data
      manufacturer: tpi.extracted_specs?.manufacturer || tpi.manufacturer || null,
      model: tpi.extracted_specs?.model || tpi.model || null,
      status: tpi.status
    }))

    return equipmentRows
  } catch (error) {
    console.error('Error fetching equipment for project:', error)
    throw error
  }
}