'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getAsset,
  listAssets,
  listAssetTypes,
  listSpaces,
  listSystems,
  listSystemMembers,
  type Asset,
  type AssetType,
  type Space,
  type System,
} from '@/contexts/asset_registry/api'
import { AssetDetail } from '@/contexts/asset_registry/ui'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const assetId = params?.assetId as string

  const { setEntityLabel } = useBreadcrumbLabel()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [space, setSpace] = useState<Space | undefined>(undefined)
  const [parentAsset, setParentAsset] = useState<Asset | null>(null)
  const [childAssets, setChildAssets] = useState<Asset[]>([])
  const [systemMemberships, setSystemMemberships] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      try {
        const [assetData, assetTypes, spaces, allSystems, children] = await Promise.all([
          getAsset(projectId, assetId),
          listAssetTypes(projectId),
          listSpaces(projectId),
          listSystems(projectId, { include_descendants: true }),
          listAssets(projectId, { parent_asset_id: assetId }),
        ])

        setAsset(assetData)
        setEntityLabel(assetData.tag)
        setAssetType(assetTypes.find(t => t.id === assetData.asset_type_id))
        setSpace(spaces.find(s => s.id === assetData.space_id))
        setChildAssets(children)

        if (assetData.parent_asset_id) {
          const parentData = await getAsset(projectId, assetData.parent_asset_id)
          setParentAsset(parentData)
        }

        const memberships: System[] = []
        await Promise.all(
          allSystems.map(async (sys) => {
            try {
              const members = await listSystemMembers(projectId, sys.id)
              if (members.some(m => m.id === assetId)) {
                memberships.push(sys)
              }
            } catch {
              // ignore per-system errors
            }
          })
        )
        setSystemMemberships(memberships)
      } catch {
        setError('Failed to load asset.')
      } finally {
        setLoading(false)
      }
    })
  }, [projectId, assetId, router, setEntityLabel])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>{error ?? 'Asset not found.'}</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .adp-page { padding: 32px; max-width: 900px; margin: 0 auto; }
        .adp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .adp-back:hover { color: var(--bp-text-primary); }
        .adp-section { margin-top: 24px; }
        .adp-section-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .adp-link-list { display: flex; flex-direction: column; gap: 4px; }
        .adp-link { font-size: 0.875rem; color: var(--bp-accent); text-decoration: none; }
        .adp-link:hover { text-decoration: underline; }
        .adp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
      `}</style>
      <div className="adp-page">
        <button className="adp-back" onClick={() => router.push(`/project/${projectId}/assets`)}>
          ← Back to Assets
        </button>

        <AssetDetail
          projectId={projectId}
          asset={asset}
          assetType={assetType}
          space={space}
          onClose={() => router.push(`/project/${projectId}/assets`)}
          onEdit={() => router.push(`/project/${projectId}/assets`)}
          onRetire={() => router.refresh()}
          onDecommission={() => router.refresh()}
          onDelete={() => router.push(`/project/${projectId}/assets`)}
        />

        {assetType && (
          <div className="adp-section">
            <div className="adp-section-title">Asset Type</div>
            <Link className="adp-link" href={`/project/${projectId}/asset-types/${asset.asset_type_id}`}>
              {assetType.name}
            </Link>
          </div>
        )}

        {space && (
          <div className="adp-section">
            <div className="adp-section-title">Space</div>
            <Link className="adp-link" href={`/project/${projectId}/spaces/${asset.space_id}`}>
              {space.name} ({space.kind})
            </Link>
          </div>
        )}

        {parentAsset && (
          <div className="adp-section">
            <div className="adp-section-title">Parent Asset</div>
            <Link className="adp-link" href={`/project/${projectId}/assets/${parentAsset.id}`}>
              {parentAsset.tag}{parentAsset.name ? ` — ${parentAsset.name}` : ''}
            </Link>
          </div>
        )}

        {childAssets.length > 0 && (
          <div className="adp-section">
            <div className="adp-section-title">Child Assets</div>
            <div className="adp-link-list">
              {childAssets.map(child => (
                <Link key={child.id} className="adp-link" href={`/project/${projectId}/assets/${child.id}`}>
                  {child.tag}{child.name ? ` — ${child.name}` : ''}
                </Link>
              ))}
            </div>
          </div>
        )}

        {systemMemberships.length > 0 && (
          <div className="adp-section">
            <div className="adp-section-title">System Memberships</div>
            <div className="adp-link-list">
              {systemMemberships.map(sys => (
                <Link key={sys.id} className="adp-link" href={`/project/${projectId}/systems/${sys.id}`}>
                  {sys.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
