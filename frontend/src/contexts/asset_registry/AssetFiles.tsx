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
import { getPreviewFiles } from './_design_preview'

const KIND_TONE: Record<string, 'ok' | 'primary' | 'warn' | 'ink'> = {
  manual: 'primary',
  drawing: 'ok',
  checklist: 'ink',
  certificate: 'ok',
  report: 'ink',
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

export function AssetFiles() {
  const files = getPreviewFiles()

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={PREVIEW_BADGE_STYLE}>design preview</div>

      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {`${files.length} file${files.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>Documents &amp; Files</WH>
      </div>

      {files.length === 0 ? (
        <WEmpty
          title="No files attached"
          subtitle="Documents, drawings, and submittals for this asset will appear here."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 100px 80px 110px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['Name', 'Kind', 'Size', 'Uploaded'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {files.map((file, i) => (
            <div
              key={file.name}
              data-testid="file-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 100px 80px 110px',
                padding: '9px 14px',
                borderBottom: i < files.length - 1 ? '1px solid var(--ui-line)' : 'none',
                alignItems: 'center',
              }}
            >
              <WT size={13} weight={500}>{file.name}</WT>
              <WPill tone={KIND_TONE[file.kind] ?? 'ink'} size="sm">{file.kind}</WPill>
              <WT size={11.5} color="ink-soft">{file.size}</WT>
              <WT size={11.5} color="ink-soft">{new Date(file.uploaded_at).toLocaleDateString()}</WT>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
