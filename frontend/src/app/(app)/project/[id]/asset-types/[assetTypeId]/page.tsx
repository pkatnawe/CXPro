'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getAssetType,
  listAssets,
  type AssetType,
  type Asset,
} from '@/contexts/asset_registry/api'
import {
  listTemplates,
  type Template,
} from '@/contexts/commissioning_execution/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'

export default function AssetTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const assetTypeId = params?.assetTypeId as string

  const { setEntityLabel } = useBreadcrumbLabel()

  const [assetType, setAssetType] = useState<AssetType | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      try {
        const [atData, templateData, assetData] = await Promise.all([
          getAssetType(projectId, assetTypeId),
          listTemplates(projectId, { asset_type_id: assetTypeId }),
          listAssets(projectId, { asset_type_id: assetTypeId }),
        ])
        setAssetType(atData)
        setEntityLabel(atData.name)
        setTemplates(templateData)
        setAssets(assetData)
      } catch {
        setError('Failed to load asset type.')
      } finally {
        setLoading(false)
      }
    })
  }, [projectId, assetTypeId, router, setEntityLabel])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (error || !assetType) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>{error ?? 'Asset type not found.'}</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .atdp-page { padding: 32px; max-width: 800px; margin: 0 auto; }
        .atdp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .atdp-back:hover { color: var(--bp-text-primary); }
        .atdp-h1 { font-size: 1.5rem; font-weight: 600; color: var(--bp-text-primary); margin: 0 0 8px 0; }
        .atdp-desc { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 24px; }
        .atdp-section { margin-top: 24px; }
        .atdp-section-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .atdp-link { font-size: 0.875rem; color: var(--bp-accent); text-decoration: none; display: block; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .atdp-link:hover { text-decoration: underline; background: var(--bp-bg-tertiary); }
        .atdp-asset-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .atdp-tag { font-family: monospace; font-size: 0.875rem; font-weight: 600; color: var(--bp-text-primary); }
        .atdp-name { flex: 1; font-size: 0.875rem; color: var(--bp-text-secondary); }
        .atdp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
      `}</style>
      <div className="atdp-page">
        <button className="atdp-back" onClick={() => router.push(`/project/${projectId}/asset-types`)}>
          ← Back to Asset Types
        </button>

        <h1 className="atdp-h1">{assetType.name}</h1>
        {assetType.description && <div className="atdp-desc">{assetType.description}</div>}

        <div className="atdp-section">
          <div className="atdp-section-title">Linked Templates ({templates.length})</div>
          {templates.length === 0 ? (
            <div className="atdp-empty">No templates linked to this asset type.</div>
          ) : (
            templates.map(tmpl => (
              <Link key={tmpl.id} className="atdp-link" href={`/project/${projectId}/test-procedure-templates/${tmpl.id}`}>
                {tmpl.name}
                <span style={{ fontSize: '0.7rem', color: 'var(--bp-text-secondary)', marginLeft: 8 }}>{tmpl.level}</span>
              </Link>
            ))
          )}
        </div>

        <div className="atdp-section">
          <div className="atdp-section-title">Assets of this Type ({assets.length})</div>
          {assets.length === 0 ? (
            <div className="atdp-empty">No assets of this type.</div>
          ) : (
            assets.map(asset => (
              <Link key={asset.id} className="atdp-link" href={`/project/${projectId}/assets/${asset.id}`}>
                <span className="atdp-tag">{asset.tag}</span>
                {asset.name && <span className="atdp-name">{asset.name}</span>}
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )
}
