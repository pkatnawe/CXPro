'use client'

import React from 'react'
import type { Asset, AssetType, Space } from './api'
import type { Instance } from '@/contexts/commissioning_execution/api'
import { derivePhase } from './derivePhase'
import {
  WBox,
  WT,
  WH,
  WPill,
  WBtn,
  WSectionLabel,
  WAvatar,
  WBar,
  WLiveDot,
  PhaseTracker,
} from '@/lib/frontend-kit'
import {
  getPreviewMilestones,
  getPreviewParties,
  getPreviewSubmittals,
} from './_design_preview'

const milestones = getPreviewMilestones()
const parties = getPreviewParties()
const submittals = getPreviewSubmittals()

const TURNOVER_ITEMS = [
  'O&M manual', 'Warranty certificate', 'As-built drawings',
  'Attic stock / spares', 'Training (owner)', 'Final test reports',
]
const TURNOVER_DONE = [true, true, false, false, false, false]

interface Props {
  asset: Asset
  assetType: AssetType | undefined
  instances: Instance[]
  spaceMap: Map<string, Space>
  onPatch: (fields: Partial<Pick<Asset, 'manufacturer' | 'model' | 'serial' | 'vendor_name' | 'nameplate_data'>>) => Promise<void>
}

function ACard({ label, tone = 'primary', right, children, style = {} }: {
  label?: string
  tone?: 'primary' | 'ai' | 'warn' | 'ok'
  right?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <WBox style={{ padding: 0, overflow: 'hidden', ...style }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel-2)',
      }}>
        {label ? <WSectionLabel tone={tone}>{label}</WSectionLabel> : null}
        {right ? right : null}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </WBox>
  )
}

function AKV({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{k}</WT>
      <WT size={13} mono={mono} weight={500}>{v}</WT>
    </div>
  )
}

export function AssetOverview({ asset, assetType, instances, spaceMap }: Props) {
  const phase = derivePhase(instances)

  const nameplateKVs: Array<{ k: string; v: string; mono?: boolean }> = [
    { k: 'manufacturer', v: asset.manufacturer ?? '—' },
    { k: 'model', v: asset.model ?? '—', mono: true },
    { k: 'serial no.', v: asset.serial ?? '—', mono: true },
    { k: 'vendor', v: asset.vendor_name ?? '—' },
    { k: 'type', v: assetType?.name ?? '—' },
    ...Object.entries(asset.nameplate_data ?? {}).map(([k, v]) => ({ k, v: String(v), mono: true })),
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseTracker phase={phase} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ACard label="nameplate & spec data" right={
              <WBtn variant="ghost" tone="primary" size="sm">full datasheet</WBtn>
            }>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
                {nameplateKVs.map((kv, i) => (
                  <AKV key={i} k={kv.k} v={kv.v} mono={kv.mono} />
                ))}
              </div>
            </ACard>

            <ACard label="schedule & milestones" right={
              <WT size={11} mono color="ink-soft">on plan · ±0d</WT>
            }>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 0',
                    borderBottom: i < milestones.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: m.status === 'done' ? 'var(--ui-ok)' : 'var(--ui-panel)',
                      border: `1.5px solid ${m.status === 'done' ? 'var(--ui-ok)' : 'var(--ui-line-strong)'}`,
                      color: 'var(--ui-on-primary)',
                      fontSize: 10,
                    }}>
                      {m.status === 'done' ? '✓' : ''}
                    </span>
                    <WT size={13} weight={m.status === 'done' ? 400 : 500} color={m.status === 'done' ? 'ink-soft' : 'ink'} style={{ flex: 1 }}>
                      {m.label}
                    </WT>
                    {m.status === 'target' ? <WPill tone="primary" size="sm">target</WPill> : null}
                    <WT size={12} mono color="ink-soft">{m.date}</WT>
                  </div>
                ))}
              </div>
            </ACard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ACard label="responsible parties">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {parties.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: i < parties.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  }}>
                    <WAvatar initials={p.initials} size={28} seed={p.initials + i} />
                    <div style={{ flex: 1 }}>
                      <WT size={12.5} weight={500}>{p.company}</WT>
                      <WT size={11} color="ink-soft">{p.person}</WT>
                    </div>
                    <WPill tone={p.tone === 'primary' ? 'primary' : 'ink'} size="sm">{p.role}</WPill>
                  </div>
                ))}
              </div>
            </ACard>

            <ACard label="submittals & approvals" right={
              <WBtn variant="ghost" tone="primary" size="sm">all →</WBtn>
            }>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {submittals.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: i < submittals.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  }}>
                    <WT size={11.5} mono color="ink-soft" style={{ width: 64, flexShrink: 0 }}>{s.number}</WT>
                    <WT size={12.5} style={{ flex: 1 }}>{s.title}</WT>
                    <WPill tone={s.tone as 'ok' | 'warn' | 'ai' | 'ink'} size="sm">{s.status}</WPill>
                  </div>
                ))}
              </div>
            </ACard>

            <ACard label="turnover / O&M readiness" tone="ai" right={
              <WT size={11} mono color="ai">
                {Math.round((TURNOVER_DONE.filter(Boolean).length / TURNOVER_DONE.length) * 100)}%
              </WT>
            }>
              <WBar
                value={Math.round((TURNOVER_DONE.filter(Boolean).length / TURNOVER_DONE.length) * 100)}
                color="ai"
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                {TURNOVER_ITEMS.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: TURNOVER_DONE[i] ? 'var(--ui-ok)' : 'var(--ui-panel-3)',
                      border: `1px solid ${TURNOVER_DONE[i] ? 'var(--ui-ok)' : 'var(--ui-line-strong)'}`,
                      color: 'var(--ui-on-primary)',
                      fontSize: 10,
                    }}>
                      {TURNOVER_DONE[i] ? '✓' : ''}
                    </span>
                    <WT size={12} color={TURNOVER_DONE[i] ? 'ink' : 'ink-soft'}>{item}</WT>
                  </div>
                ))}
              </div>
            </ACard>
          </div>
        </div>
      </div>
    </div>
  )
}
