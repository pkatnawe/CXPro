import { supabase } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const SPACE_KINDS = [
  'campus',
  'building',
  'floor',
  'wing',
  'department',
  'data_hall',
  'rack_row',
  'room',
] as const

export type SpaceKind = typeof SPACE_KINDS[number]

export const ALLOWED_PARENTS: Record<SpaceKind, Array<SpaceKind | null>> = {
  campus:     [null],
  building:   [null, 'campus'],
  floor:      ['building'],
  wing:       ['floor'],
  department: ['floor', 'wing'],
  data_hall:  ['floor', 'building'],
  rack_row:   ['data_hall'],
  room:       ['floor', 'wing', 'department', 'data_hall'],
}

export function isAllowedSpaceParent(parentKind: SpaceKind | null, childKind: SpaceKind): boolean {
  const allowed = ALLOWED_PARENTS[childKind]
  if (!allowed) return false
  return (allowed as Array<SpaceKind | null>).includes(parentKind)
}

export interface Space {
  id: string
  project_id: string
  parent_space_id: string | null
  kind: SpaceKind
  name: string
  ordinal: number | null
  created_at: string
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return `Bearer ${session.access_token}`
}

export async function createSpace(
  projectId: string,
  params: { kind: SpaceKind; name: string; parent_space_id?: string | null; ordinal?: number | null }
): Promise<Space> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create space'), { status: res.status, body })
  }
  return res.json()
}

export async function listSpaces(projectId: string, parentSpaceId?: string | null): Promise<Space[]> {
  const auth = await getAuthHeader()
  const url = new URL(`${API_BASE}/projects/${projectId}/spaces`)
  if (parentSpaceId !== undefined && parentSpaceId !== null) {
    url.searchParams.set('parent_space_id', parentSpaceId)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list spaces'), { status: res.status, body })
  }
  return res.json()
}

export async function getSpace(projectId: string, spaceId: string): Promise<Space> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/spaces/${spaceId}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to get space'), { status: res.status, body })
  }
  return res.json()
}

export async function updateSpace(
  projectId: string,
  spaceId: string,
  params: { name?: string; parent_space_id?: string | null; ordinal?: number | null }
): Promise<Space> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/spaces/${spaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update space'), { status: res.status, body })
  }
  return res.json()
}

export async function deleteSpace(projectId: string, spaceId: string): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/spaces/${spaceId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to delete space'), { status: res.status, body })
  }
}

export interface AssetType {
  id: string
  project_id: string
  name: string
  description: string | null
  expected_attributes: Record<string, unknown>
  created_at: string
}

export async function getAssetType(projectId: string, assetTypeId: string): Promise<AssetType> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/asset-types/${assetTypeId}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to get asset type'), { status: res.status, body })
  }
  return res.json()
}

export async function createAssetType(
  projectId: string,
  params: { name: string; description?: string | null; expected_attributes?: Record<string, unknown> }
): Promise<AssetType> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/asset-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create asset type'), { status: res.status, body })
  }
  return res.json()
}

export async function listAssetTypes(projectId: string): Promise<AssetType[]> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/asset-types`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list asset types'), { status: res.status, body })
  }
  return res.json()
}

export async function updateAssetType(
  projectId: string,
  assetTypeId: string,
  params: { name?: string; description?: string | null; expected_attributes?: Record<string, unknown> }
): Promise<AssetType> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/asset-types/${assetTypeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update asset type'), { status: res.status, body })
  }
  return res.json()
}

export async function deleteAssetType(projectId: string, assetTypeId: string): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/asset-types/${assetTypeId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to delete asset type'), { status: res.status, body })
  }
}

export interface System {
  id: string
  project_id: string
  parent_system_id: string | null
  name: string
  description: string | null
  created_at: string
}

export interface SystemMember {
  id: string
  project_id: string
  tag: string
  name: string | null
  status: string
  added_at: string
}

export async function createSystem(
  projectId: string,
  params: { name: string; description?: string | null; parent_system_id?: string | null }
): Promise<System> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create system'), { status: res.status, body })
  }
  return res.json()
}

export async function listSystems(
  projectId: string,
  options?: { parent_system_id?: string | null; include_descendants?: boolean }
): Promise<System[]> {
  const auth = await getAuthHeader()
  const url = new URL(`${API_BASE}/projects/${projectId}/systems`)
  if (options?.parent_system_id) {
    url.searchParams.set('parent_system_id', options.parent_system_id)
  }
  if (options?.include_descendants) {
    url.searchParams.set('include_descendants', 'true')
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list systems'), { status: res.status, body })
  }
  return res.json()
}

export async function getSystem(projectId: string, systemId: string): Promise<System> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to get system'), { status: res.status, body })
  }
  return res.json()
}

export async function updateSystem(
  projectId: string,
  systemId: string,
  params: { name?: string; description?: string | null; parent_system_id?: string | null }
): Promise<System> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update system'), { status: res.status, body })
  }
  return res.json()
}

export async function deleteSystem(projectId: string, systemId: string): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to delete system'), { status: res.status, body })
  }
}

export async function addAssetToSystem(
  projectId: string,
  systemId: string,
  assetId: string
): Promise<{ asset_id: string; system_id: string; added_at: string }> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ asset_id: assetId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to add asset to system'), { status: res.status, body })
  }
  return res.json()
}

export async function removeAssetFromSystem(
  projectId: string,
  systemId: string,
  assetId: string
): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}/members/${assetId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to remove asset from system'), { status: res.status, body })
  }
}

export async function listSystemMembers(
  projectId: string,
  systemId: string
): Promise<SystemMember[]> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/systems/${systemId}/members`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list system members'), { status: res.status, body })
  }
  return res.json()
}

export const ASSET_STATUSES = ['active', 'retired', 'decommissioned'] as const
export type AssetStatus = typeof ASSET_STATUSES[number]

export interface Asset {
  id: string
  project_id: string
  parent_asset_id: string | null
  asset_type_id: string
  space_id: string | null
  tag: string
  name: string | null
  status: AssetStatus
  manufacturer: string | null
  model: string | null
  serial: string | null
  vendor_name: string | null
  nameplate_data: Record<string, unknown>
  created_at: string
  retired_at: string | null
  decommissioned_at: string | null
}

export interface DeleteAssetError {
  error: 'has_references'
  next_action: 'retire'
  counts: Record<string, number>
}

export async function createAsset(
  projectId: string,
  params: {
    asset_type_id: string
    tag: string
    name?: string | null
    parent_asset_id?: string | null
    space_id?: string | null
    manufacturer?: string | null
    model?: string | null
    serial?: string | null
    vendor_name?: string | null
    nameplate_data?: Record<string, unknown>
  }
): Promise<Asset> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create asset'), { status: res.status, body })
  }
  return res.json()
}

export async function listAssets(
  projectId: string,
  filters?: {
    status?: AssetStatus
    space_id?: string
    system_id?: string
    parent_asset_id?: string
    asset_type_id?: string
  }
): Promise<Asset[]> {
  const auth = await getAuthHeader()
  const url = new URL(`${API_BASE}/projects/${projectId}/assets`)
  if (filters?.status) url.searchParams.set('status', filters.status)
  if (filters?.space_id) url.searchParams.set('space_id', filters.space_id)
  if (filters?.system_id) url.searchParams.set('system_id', filters.system_id)
  if (filters?.parent_asset_id) url.searchParams.set('parent_asset_id', filters.parent_asset_id)
  if (filters?.asset_type_id) url.searchParams.set('asset_type_id', filters.asset_type_id)
  const res = await fetch(url.toString(), {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list assets'), { status: res.status, body })
  }
  return res.json()
}

export async function getAsset(projectId: string, assetId: string): Promise<Asset> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to get asset'), { status: res.status, body })
  }
  return res.json()
}

export async function updateAsset(
  projectId: string,
  assetId: string,
  params: {
    tag?: string
    name?: string | null
    parent_asset_id?: string | null
    space_id?: string | null
    asset_type_id?: string
    manufacturer?: string | null
    model?: string | null
    serial?: string | null
    vendor_name?: string | null
    nameplate_data?: Record<string, unknown>
  }
): Promise<Asset> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update asset'), { status: res.status, body })
  }
  return res.json()
}

export async function retireAsset(projectId: string, assetId: string): Promise<Asset> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/retire`, {
    method: 'POST',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to retire asset'), { status: res.status, body })
  }
  return res.json()
}

export async function decommissionAsset(projectId: string, assetId: string): Promise<Asset> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/decommission`, {
    method: 'POST',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to decommission asset'), { status: res.status, body })
  }
  return res.json()
}

export async function deleteAsset(projectId: string, assetId: string): Promise<void | DeleteAssetError> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (res.status === 204) return
  const body = await res.json().catch(() => ({}))
  if (res.status === 409) {
    throw Object.assign(new Error('has_references'), { status: 409, body })
  }
  throw Object.assign(new Error(body.detail ?? 'Failed to delete asset'), { status: res.status, body })
}

export const SIGNAL_TYPES = ['4-20mA', '0-10V', 'RTD', 'thermocouple', 'discrete', 'modbus'] as const
export type SignalType = typeof SIGNAL_TYPES[number]

export interface Point {
  id: string
  asset_id: string
  tag: string
  description: string | null
  signal_type: SignalType | null
  range_low: number | null
  range_high: number | null
  engineering_units: string | null
  last_cal_date: string | null
  cal_due_date: string | null
  created_at: string
}

export async function createPoint(
  projectId: string,
  assetId: string,
  params: {
    tag: string
    description?: string | null
    signal_type?: SignalType | null
    range_low?: number | null
    range_high?: number | null
    engineering_units?: string | null
    last_cal_date?: string | null
    cal_due_date?: string | null
  }
): Promise<Point> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create point'), { status: res.status, body })
  }
  return res.json()
}

export async function listPointsForAsset(projectId: string, assetId: string): Promise<Point[]> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/points`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list points'), { status: res.status, body })
  }
  return res.json()
}

export async function updatePoint(
  projectId: string,
  assetId: string,
  pointId: string,
  params: {
    tag?: string
    description?: string | null
    signal_type?: SignalType | null
    range_low?: number | null
    range_high?: number | null
    engineering_units?: string | null
    last_cal_date?: string | null
    cal_due_date?: string | null
  }
): Promise<Point> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/points/${pointId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update point'), { status: res.status, body })
  }
  return res.json()
}

export async function deletePoint(projectId: string, assetId: string, pointId: string): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/assets/${assetId}/points/${pointId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to delete point'), { status: res.status, body })
  }
}
