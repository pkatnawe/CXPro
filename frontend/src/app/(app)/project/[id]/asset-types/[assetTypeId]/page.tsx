'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
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
import {
  WFrame,
  WH,
  WT,
  WPill,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
  WStamp,
} from '@/lib/frontend-kit'

function AssetTypeDetailContent({ projectId, assetTypeId }: { projectId: string; assetTypeId: string }) {
  const router = useRouter()
  const { setEntityLabel } = useBreadcrumbLabel()
  const [assetType, setAssetType] = useState<AssetType | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getAssetType(projectId, assetTypeId),
      listTemplates(projectId, { asset_type_id: assetTypeId }),
      listAssets(projectId, { asset_type_id: assetTypeId }),
    ]).then(([atData, templateData, assetData]) => {
      setAssetType(atData)
      setEntityLabel(atData.name)
      setTemplates(templateData)
      setAssets(assetData)
      setLoading(false)
    }).catch(() => {
      setError('Failed to load asset type.')
      setLoading(false)
    })
  }, [projectId, assetTypeId, setEntityLabel])

  if (loading) {
    return (
      <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
          <WSkeleton width={200} height="28px" />
        </div>
        <div style={{ padding: 18 }}>
          <WSkeleton width="100%" height="120px" />
        </div>
      </WFrame>
    )
  }

  if (error || !assetType) {
    return (
      <WFrame style={{ padding: 24 }}>
        <WEmpty title="Asset type not found" subtitle={error ?? 'This asset type may have been deleted.'} />
      </WFrame>
    )
  }

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        flexShrink: 0,
      }}>
        <WSectionLabel tone="primary">Setup · Asset Types</WSectionLabel>
        <WH size={22} style={{ marginTop: 4 }}>{assetType.name}</WH>
        {assetType.description && (
          <WT size={13} color="ink-soft" style={{ marginTop: 6 }}>{assetType.description}</WT>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Linked Templates ({templates.length})</WSectionLabel>
          {templates.length === 0 ? (
            <WEmpty title="No templates linked" subtitle="Templates linked to this asset type will appear here." />
          ) : (
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              {templates.map((tmpl, i) => (
                <div
                  key={tmpl.id}
                  onClick={() => router.push(`/project/${projectId}/test-procedure-templates/${tmpl.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < templates.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <WStamp k="lv" v={tmpl.level} />
                  <WT size={13} weight={500}>{tmpl.name}</WT>
                </div>
              ))}
            </WBox>
          )}
        </div>

        <div>
          <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Assets of this Type ({assets.length})</WSectionLabel>
          {assets.length === 0 ? (
            <WEmpty title="No assets of this type" subtitle="Assets registered with this type will appear here." />
          ) : (
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              {assets.map((asset, i) => (
                <div
                  key={asset.id}
                  onClick={() => router.push(`/project/${projectId}/assets/${asset.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < assets.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <WT size={12} mono weight={500}>{asset.tag}</WT>
                  {asset.name && <WT size={12.5} color="ink-soft">{asset.name}</WT>}
                  <div style={{ marginLeft: 'auto' }}>
                    <WPill tone={asset.status === 'active' ? 'ok' : 'warn'} size="sm">{asset.status}</WPill>
                  </div>
                </div>
              ))}
            </WBox>
          )}
        </div>
      </div>
    </WFrame>
  )
}

function AssetTypeDetailPageInner() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const assetTypeId = params?.assetTypeId as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/auth'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) {
    return (
      <WFrame style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <WSkeleton width={200} />
      </WFrame>
    )
  }

  return <AssetTypeDetailContent projectId={projectId} assetTypeId={assetTypeId} />
}

export default function AssetTypeDetailPage() {
  return (
    <Suspense>
      <AssetTypeDetailPageInner />
    </Suspense>
  )
}
