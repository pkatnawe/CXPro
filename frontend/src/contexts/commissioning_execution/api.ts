import { supabase } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const TEMPLATE_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const
export type TemplateLevel = typeof TEMPLATE_LEVELS[number]

export interface Template {
  id: string
  project_id: string
  name: string
  level: TemplateLevel
  description: string | null
  steps: unknown[]
  created_at: string
}

export interface AssetTypeLink {
  asset_type_id: string
  test_procedure_template_id: string
  created_at: string
}

export interface Instance {
  id: string
  project_id: string
  template_id: string
  asset_id: string | null
  system_id: string | null
  level: string
  status: string
  created_at: string
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return `Bearer ${session.access_token}`
}

export async function createTemplate(
  projectId: string,
  params: { name: string; level: TemplateLevel; description?: string | null; steps?: unknown[] }
): Promise<Template> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/test-procedure-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to create template'), { status: res.status, body })
  }
  return res.json()
}

export async function listTemplates(
  projectId: string,
  filters?: { level?: TemplateLevel; asset_type_id?: string }
): Promise<Template[]> {
  const auth = await getAuthHeader()
  const url = new URL(`${API_BASE}/projects/${projectId}/test-procedure-templates`)
  if (filters?.level) url.searchParams.set('level', filters.level)
  if (filters?.asset_type_id) url.searchParams.set('asset_type_id', filters.asset_type_id)
  const res = await fetch(url.toString(), {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list templates'), { status: res.status, body })
  }
  return res.json()
}

export async function updateTemplate(
  projectId: string,
  templateId: string,
  params: { name?: string; level?: TemplateLevel; description?: string | null; steps?: unknown[] }
): Promise<Template> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/test-procedure-templates/${templateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update template'), { status: res.status, body })
  }
  return res.json()
}

export async function deleteTemplate(projectId: string, templateId: string): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/test-procedure-templates/${templateId}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to delete template'), { status: res.status, body })
  }
}

export async function linkTemplateToAssetType(
  projectId: string,
  templateId: string,
  assetTypeId: string
): Promise<AssetTypeLink> {
  const auth = await getAuthHeader()
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/test-procedure-templates/${templateId}/asset-type-links`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ asset_type_id: assetTypeId }),
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to link asset type'), { status: res.status, body })
  }
  return res.json()
}

export async function unlinkTemplateFromAssetType(
  projectId: string,
  templateId: string,
  assetTypeId: string
): Promise<void> {
  const auth = await getAuthHeader()
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/test-procedure-templates/${templateId}/asset-type-links/${assetTypeId}`,
    {
      method: 'DELETE',
      headers: { Authorization: auth },
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to unlink asset type'), { status: res.status, body })
  }
}

export async function listInstances(
  projectId: string,
  filters?: { asset_id?: string; system_id?: string; level?: string; status?: string }
): Promise<Instance[]> {
  const auth = await getAuthHeader()
  const url = new URL(`${API_BASE}/projects/${projectId}/test-procedure-instances`)
  if (filters?.asset_id) url.searchParams.set('asset_id', filters.asset_id)
  if (filters?.system_id) url.searchParams.set('system_id', filters.system_id)
  if (filters?.level) url.searchParams.set('level', filters.level)
  if (filters?.status) url.searchParams.set('status', filters.status)
  const res = await fetch(url.toString(), {
    headers: { Authorization: auth },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to list instances'), { status: res.status, body })
  }
  return res.json()
}

export async function updateInstanceStatus(
  projectId: string,
  instanceId: string,
  status: string
): Promise<Instance> {
  const auth = await getAuthHeader()
  const res = await fetch(`${API_BASE}/projects/${projectId}/test-procedure-instances/${instanceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.detail ?? 'Failed to update instance status'), { status: res.status, body })
  }
  return res.json()
}
