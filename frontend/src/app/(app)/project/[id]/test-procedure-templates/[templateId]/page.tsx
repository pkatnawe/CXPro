'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { listAssetTypes, type AssetType } from '@/contexts/asset_registry/api'
import {
  getTemplate,
  listTemplates,
  listInstances,
  type Template,
  type Instance,
} from '@/contexts/commissioning_execution/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const templateId = params?.templateId as string

  const { setEntityLabel } = useBreadcrumbLabel()

  const [template, setTemplate] = useState<Template | null>(null)
  const [linkedAssetTypes, setLinkedAssetTypes] = useState<AssetType[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      try {
        const [tmplData, allAssetTypes, instanceData] = await Promise.all([
          getTemplate(projectId, templateId),
          listAssetTypes(projectId),
          listInstances(projectId, { template_id: templateId }),
        ])
        setTemplate(tmplData)
        setEntityLabel(tmplData.name)
        setInstances(instanceData)

        const linked: AssetType[] = []
        await Promise.all(
          allAssetTypes.map(async (at) => {
            const templates = await listTemplates(projectId, { asset_type_id: at.id })
            if (templates.some(t => t.id === templateId)) {
              linked.push(at)
            }
          })
        )
        setLinkedAssetTypes(linked)
      } catch {
        setError('Failed to load template.')
      } finally {
        setLoading(false)
      }
    })
  }, [projectId, templateId, router, setEntityLabel])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>{error ?? 'Template not found.'}</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .tdp-page { padding: 32px; max-width: 800px; margin: 0 auto; }
        .tdp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .tdp-back:hover { color: var(--bp-text-primary); }
        .tdp-header { margin-bottom: 16px; }
        .tdp-h1 { font-size: 1.5rem; font-weight: 600; color: var(--bp-text-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px; }
        .tdp-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: var(--bp-bg-secondary); color: var(--bp-text-secondary); }
        .tdp-desc { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 8px; }
        .tdp-steps { font-size: 0.875rem; color: var(--bp-text-secondary); }
        .tdp-section { margin-top: 24px; }
        .tdp-section-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .tdp-link { font-size: 0.875rem; color: var(--bp-accent); text-decoration: none; display: block; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .tdp-link:hover { text-decoration: underline; background: var(--bp-bg-tertiary); }
        .tdp-instance-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; font-size: 0.875rem; color: var(--bp-text-primary); }
        .tdp-instance-id { font-family: monospace; font-size: 0.75rem; color: var(--bp-text-secondary); flex: 1; }
        .tdp-status { font-size: 0.65rem; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
        .tdp-status-pending { background: #e0e7ff; color: #3730a3; }
        .tdp-status-in_progress { background: #fef3c7; color: #92400e; }
        .tdp-status-pass { background: #d1fae5; color: #065f46; }
        .tdp-status-fail { background: #fee2e2; color: #991b1b; }
        .tdp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
      `}</style>
      <div className="tdp-page">
        <button className="tdp-back" onClick={() => router.push(`/project/${projectId}/test-procedure-templates`)}>
          ← Back to Templates
        </button>

        <div className="tdp-header">
          <h1 className="tdp-h1">
            {template.name}
            <span className="tdp-badge">{template.level}</span>
          </h1>
          {template.description && <div className="tdp-desc">{template.description}</div>}
          <div className="tdp-steps">{template.steps.length} step{template.steps.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="tdp-section">
          <div className="tdp-section-title">Linked Asset Types ({linkedAssetTypes.length})</div>
          {linkedAssetTypes.length === 0 ? (
            <div className="tdp-empty">No asset types linked to this template.</div>
          ) : (
            linkedAssetTypes.map(at => (
              <Link key={at.id} className="tdp-link" href={`/project/${projectId}/asset-types/${at.id}`}>
                {at.name}
              </Link>
            ))
          )}
        </div>

        <div className="tdp-section">
          <div className="tdp-section-title">Instances ({instances.length})</div>
          {instances.length === 0 ? (
            <div className="tdp-empty">No instances using this template.</div>
          ) : (
            instances.map(inst => (
              <div key={inst.id} className="tdp-instance-row">
                <span className="tdp-instance-id">{inst.id.slice(0, 8)}…</span>
                {inst.asset_id && (
                  <Link href={`/project/${projectId}/assets/${inst.asset_id}`} style={{ fontSize: '0.875rem', color: 'var(--bp-accent)', textDecoration: 'none' }}>
                    Asset →
                  </Link>
                )}
                {inst.system_id && (
                  <Link href={`/project/${projectId}/systems/${inst.system_id}`} style={{ fontSize: '0.875rem', color: 'var(--bp-accent)', textDecoration: 'none' }}>
                    System →
                  </Link>
                )}
                <span className={`tdp-status tdp-status-${inst.status}`}>{inst.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
