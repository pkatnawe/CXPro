'use client'

import React from 'react'
import {
  WT,
  WH,
  WSectionLabel,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'
import { getPreviewHistory } from './_design_preview'

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

export function AssetHistory() {
  const entries = getPreviewHistory()

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={PREVIEW_BADGE_STYLE}>design preview</div>

      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {`${entries.length} event${entries.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>Audit Log</WH>
      </div>

      {entries.length === 0 ? (
        <WEmpty
          title="No history"
          subtitle="Activity and changes for this asset will appear here."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          {entries.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              data-testid="history-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderBottom: i < entries.length - 1 ? '1px solid var(--ui-line)' : 'none',
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--ui-panel-2)',
                border: '1px solid var(--ui-line-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <WT size={10} mono weight={600} color="ink-soft">{entry.actor_initials}</WT>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <WT size={13} weight={500}>{entry.action}</WT>
                  <WT size={12} color="ink-soft" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.target}</WT>
                </div>
              </div>
              <WT size={11} color="ink-faint" style={{ flexShrink: 0 }}>
                {new Date(entry.timestamp).toLocaleString()}
              </WT>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
