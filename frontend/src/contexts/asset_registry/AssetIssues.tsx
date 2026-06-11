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
import { getPreviewIssues, type PreviewIssue } from './_design_preview'

const SEVERITY_TONE: Record<PreviewIssue['severity'], 'warn' | 'ok' | 'ink'> = {
  high: 'warn',
  medium: 'ink',
  low: 'ok',
}

const STATUS_TONE: Record<PreviewIssue['status'], 'warn' | 'primary' | 'ok'> = {
  open: 'warn',
  'in-progress': 'primary',
  resolved: 'ok',
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

export function AssetIssues() {
  const issues = getPreviewIssues()

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={PREVIEW_BADGE_STYLE}>design preview</div>

      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {`${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>Punch list &amp; Issues</WH>
      </div>

      {issues.length === 0 ? (
        <WEmpty
          title="No issues found"
          subtitle="Punch items and issues for this asset will appear here."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1.8fr 90px 90px 80px 80px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['ID', 'Title', 'Severity', 'Status', 'Opened', 'Owner'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {issues.map((issue, i) => (
            <div
              key={issue.id}
              data-testid="issue-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1.8fr 90px 90px 80px 80px',
                padding: '9px 14px',
                borderBottom: i < issues.length - 1 ? '1px solid var(--ui-line)' : 'none',
                alignItems: 'center',
              }}
            >
              <WT size={11.5} mono color="ink-soft">{issue.id}</WT>
              <WT size={13} weight={500}>{issue.title}</WT>
              <WPill tone={SEVERITY_TONE[issue.severity]} size="sm">{issue.severity}</WPill>
              <WPill tone={STATUS_TONE[issue.status]} filled size="sm">{issue.status}</WPill>
              <WT size={11.5} color="ink-soft">{new Date(issue.opened_at).toLocaleDateString()}</WT>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--ui-primary-soft)',
                border: '1px solid var(--ui-primary-line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WT size={10} mono color="primary" weight={600}>{issue.owner_initials}</WT>
              </div>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
