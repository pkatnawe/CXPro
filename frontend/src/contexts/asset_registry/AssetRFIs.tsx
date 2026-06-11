'use client'

import React from 'react'
import {
  WT,
  WH,
  WPill,
  WSectionLabel,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'
import { getPreviewRFIs, type PreviewRFI } from './_design_preview'

const STATUS_TONE: Record<PreviewRFI['status'], 'warn' | 'primary' | 'ok'> = {
  open: 'warn',
  'in-review': 'primary',
  answered: 'ok',
}

const PREVIEW_BADGE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 4,
  border: '1px solid var(--ui-ai-line)',
  background: 'var(--ui-ai-soft)',
  marginBottom: 14,
  fontSize: 11,
  fontFamily: 'Geist Mono, monospace',
  color: 'var(--ui-ai)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

export function AssetRFIs() {
  const rfis = getPreviewRFIs()

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={PREVIEW_BADGE_STYLE}>design preview</div>

      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {`${rfis.length} RFI${rfis.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>Requests for Information</WH>
      </div>

      {rfis.length === 0 ? (
        <WEmpty
          title="No RFIs found"
          subtitle="Requests for information related to this asset will appear here."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 1.8fr 90px 100px 100px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['Number', 'Subject', 'Status', 'Opened', 'Due'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {rfis.map((rfi, i) => (
            <div
              key={rfi.number}
              data-testid="rfi-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1.8fr 90px 100px 100px',
                padding: '9px 14px',
                borderBottom: i < rfis.length - 1 ? '1px solid var(--ui-line)' : 'none',
                alignItems: 'center',
              }}
            >
              <WT size={11.5} mono color="ink-soft">{rfi.number}</WT>
              <WT size={13} weight={500}>{rfi.subject}</WT>
              <WPill tone={STATUS_TONE[rfi.status]} filled size="sm">{rfi.status}</WPill>
              <WT size={11.5} color="ink-soft">{rfi.opened}</WT>
              <WT size={11.5} color="ink-soft">{rfi.due}</WT>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
