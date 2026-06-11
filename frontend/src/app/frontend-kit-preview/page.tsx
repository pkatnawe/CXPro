'use client'

import {
  WBox,
  WPill,
  WT,
  WH,
  WLabel,
  WLines,
  WAvatar,
  WBar,
  WStamp,
  WIcon,
  WLiveDot,
  WSectionLabel,
  WBtn,
  WBrandHeading,
  WBrandMark,
  WAI,
  WNote,
  WConsole,
  WWell,
  WSparkline,
  WDonut,
  WDots,
  WSideNav,
  WFrame,
  WTabs,
  WKV,
  WKVGrid,
  WSkeleton,
  WEmpty,
  PhaseTracker,
} from '@/lib/frontend-kit'
import { useState } from 'react'
import { useTheme } from '@/lib/theme/ThemeProvider'

export default function FrontendKitPreview() {
  const [activeTab, setActiveTab] = useState('Overview')
  const { theme, accent, setTheme, setAccent } = useTheme()

  return (
    <WFrame style={{ padding: 32 }}>
      <WH size={24} style={{ marginBottom: 24 }}>wk-* Primitive Preview</WH>
      <WT color="ink-soft" style={{ marginBottom: 32 }}>Visual QA for new wireframe-kit primitives and --ui-* tokens</WT>

      {/* WBrandMark */}
      <WSectionLabel style={{ marginBottom: 12 }}>WBrandMark</WSectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <WBrandMark />
      </div>

      {/* WBrandHeading */}
      <WSectionLabel style={{ marginBottom: 12 }}>WBrandHeading</WSectionLabel>
      <div style={{ marginBottom: 24 }}>
        <WBrandHeading size={36}>Commission Excellence</WBrandHeading>
        <WBrandHeading size={24}>Smaller heading</WBrandHeading>
      </div>

      {/* WBox variants */}
      <WSectionLabel style={{ marginBottom: 12 }}>WBox</WSectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <WBox><WT>default (line)</WT></WBox>
        <WBox tone="ok"><WT>ok tone</WT></WBox>
        <WBox tone="warn"><WT>warn tone</WT></WBox>
        <WBox tone="primary" dashed><WT>primary dashed</WT></WBox>
      </div>

      {/* WPill */}
      <WSectionLabel style={{ marginBottom: 12 }}>WPill</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <WPill tone="ink">ink</WPill>
        <WPill tone="ok">ok</WPill>
        <WPill tone="warn">warn</WPill>
        <WPill tone="primary">primary</WPill>
        <WPill tone="ai">ai</WPill>
        <WPill tone="ok" filled>ok filled</WPill>
        <WPill tone="warn" filled>warn filled</WPill>
        <WPill tone="primary" filled>primary filled</WPill>
        <WPill tone="ink" size="sm">small</WPill>
      </div>

      {/* WH + WT + WLabel */}
      <WSectionLabel style={{ marginBottom: 12 }}>WH + WT + WLabel</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        <WH size={28}>Heading size 28</WH>
        <WH size={22}>Heading size 22</WH>
        <WH size={18}>Heading size 18 (default)</WH>
        <WH size={14}>Heading size 14</WH>
        <WT size={16}>Text 16</WT>
        <WT size={13}>Text 13 (default)</WT>
        <WT size={11} color="ink-soft">Text 11 ink-soft</WT>
        <WT size={11} color="ink-faint">Text 11 ink-faint</WT>
        <WT size={13} color="ok">ok color</WT>
        <WT size={13} color="warn">warn color</WT>
        <WT size={13} color="primary">primary color</WT>
        <WT size={12} mono>Geist Mono text</WT>
        <WLabel>Label uppercase</WLabel>
      </div>

      {/* WLines */}
      <WSectionLabel style={{ marginBottom: 12 }}>WLines</WSectionLabel>
      <div style={{ maxWidth: 300, marginBottom: 24 }}>
        <WLines count={3} widths={[100, 80, 60]} />
      </div>

      {/* WAvatar */}
      <WSectionLabel style={{ marginBottom: 12 }}>WAvatar</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <WAvatar initials="JD" seed="jd" size={24} />
        <WAvatar initials="AB" seed="ab" size={32} />
        <WAvatar initials="CX" seed="cx" size={40} />
        <WAvatar initials="PR" seed="pr" size={48} />
      </div>

      {/* WBar */}
      <WSectionLabel style={{ marginBottom: 12 }}>WBar</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, marginBottom: 24 }}>
        <WBar value={40} color="primary" />
        <WBar value={65} color="ok" />
        <WBar value={80} color="warn" />
        <WBar value={50} height={10} color="primary" />
      </div>

      {/* WStamp */}
      <WSectionLabel style={{ marginBottom: 12 }}>WStamp</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <WStamp>AHU-01</WStamp>
        <WStamp k="tag" v="AHU-B-01" />
        <WStamp k="level" v="L3" />
      </div>

      {/* WIcon */}
      <WSectionLabel style={{ marginBottom: 12 }}>WIcon</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <WIcon glyph="◇" size={14} color="ink-faint" />
        <WIcon glyph="■" size={16} color="ink-soft" />
        <WIcon glyph="▲" size={18} color="primary" />
        <WIcon glyph="●" size={20} color="ok" />
        <WIcon glyph="✕" size={16} color="warn" />
      </div>

      {/* WLiveDot */}
      <WSectionLabel style={{ marginBottom: 12 }}>WLiveDot</WSectionLabel>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <WLiveDot tone="primary" />
        <WLiveDot tone="ok" />
        <WLiveDot tone="warn" />
        <WLiveDot tone="ai" />
      </div>

      {/* WAI */}
      <WSectionLabel style={{ marginBottom: 12 }}>WAI</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <WAI>Copilot suggestion</WAI>
        <WAI compact>compact</WAI>
      </div>

      {/* WNote */}
      <WSectionLabel style={{ marginBottom: 12 }}>WNote</WSectionLabel>
      <div style={{ marginBottom: 24, maxWidth: 360 }}>
        <WNote>This is a design annotation note in Geist Mono</WNote>
      </div>

      {/* WBtn */}
      <WSectionLabel style={{ marginBottom: 12 }}>WBtn</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <WBtn variant="solid">Solid primary</WBtn>
        <WBtn variant="solid" tone="ok">Solid ok</WBtn>
        <WBtn variant="solid" tone="warn">Solid warn</WBtn>
        <WBtn variant="outline">Outline</WBtn>
        <WBtn variant="ghost">Ghost</WBtn>
        <WBtn variant="solid" size="sm">Small</WBtn>
        <WBtn variant="solid" size="lg">Large</WBtn>
        <WBtn variant="solid" hero>Hero</WBtn>
        <WBtn variant="solid" disabled>Disabled</WBtn>
      </div>

      {/* WSectionLabel */}
      <WSectionLabel style={{ marginBottom: 12 }}>WSectionLabel</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <WSectionLabel>primary</WSectionLabel>
        <WSectionLabel tone="ok">ok</WSectionLabel>
        <WSectionLabel tone="warn">warn</WSectionLabel>
        <WSectionLabel tone="ai">ai</WSectionLabel>
        <WSectionLabel dot>with dot</WSectionLabel>
      </div>

      {/* WConsole */}
      <WSectionLabel style={{ marginBottom: 12 }}>WConsole</WSectionLabel>
      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <WConsole cells={[
          { label: 'Status', tone: 'ok', value: 'Live' },
          { label: 'Assets', tone: 'primary', value: 142 },
          { label: 'Warnings', tone: 'warn', value: 3 },
        ]} />
      </div>

      {/* WWell */}
      <WSectionLabel style={{ marginBottom: 12 }}>WWell</WSectionLabel>
      <div style={{ marginBottom: 24, maxWidth: 360 }}>
        <WWell><WT size={12} color="ink-soft">Content in a well / recessed area</WT></WWell>
      </div>

      {/* WSparkline */}
      <WSectionLabel style={{ marginBottom: 12 }}>WSparkline</WSectionLabel>
      <div style={{ marginBottom: 24 }}>
        <WSparkline points={[10, 14, 12, 18, 22, 19, 26, 30]} />
      </div>

      {/* WDonut */}
      <WSectionLabel style={{ marginBottom: 12 }}>WDonut</WSectionLabel>
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <WDonut value={64} color="primary" label="Primary" />
        <WDonut value={88} color="ok" label="OK" />
        <WDonut value={23} color="warn" label="Warn" />
      </div>

      {/* WDots */}
      <WSectionLabel style={{ marginBottom: 12 }}>WDots</WSectionLabel>
      <div style={{ marginBottom: 24 }}>
        <WDots style={{ height: 60, borderRadius: 8, border: '1px solid var(--ui-line)' }} />
      </div>

      {/* WSideNav */}
      <WSectionLabel style={{ marginBottom: 12 }}>WSideNav</WSectionLabel>
      <div style={{ width: 200, marginBottom: 24 }}>
        <WSideNav
          activeId="assets"
          items={[
            { id: 'assets', label: 'Assets', badge: 16 },
            { id: 'checklists', label: 'Checklists' },
            { id: 'systems', label: 'Systems', badge: 2 },
            { id: 'issues', label: 'Issues', badge: 3, badgeAlert: true },
          ]}
        />
      </div>

      {/* WTabs */}
      <WSectionLabel style={{ marginBottom: 12 }}>WTabs</WSectionLabel>
      <div style={{ marginBottom: 24 }}>
        <WTabs
          tabs={['Overview', 'Devices', 'Checklists', 'Tests', 'Linked']}
          active={activeTab}
          onChange={setActiveTab}
        />
        <WBox><WT color="ink-soft">Active tab: {activeTab}</WT></WBox>
      </div>

      {/* WKVGrid */}
      <WSectionLabel style={{ marginBottom: 12 }}>WKV / WKVGrid</WSectionLabel>
      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <WBox>
          <WKVGrid>
            <WKV label="Tag">AHU-B-01</WKV>
            <WKV label="Type">Air Handler</WKV>
            <WKV label="Manufacturer">Carrier</WKV>
            <WKV label="Model">39M-50</WKV>
            <WKV label="Serial">SN-88201-A</WKV>
            <WKV label="Vendor">Hudson Mechanical LLC</WKV>
          </WKVGrid>
        </WBox>
      </div>

      {/* WSkeleton */}
      <WSectionLabel style={{ marginBottom: 12 }}>WSkeleton</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, marginBottom: 24 }}>
        <WSkeleton width="80%" height={16} />
        <WSkeleton width="60%" height={12} />
        <WSkeleton width="90%" height={12} />
      </div>

      {/* WEmpty */}
      <WSectionLabel style={{ marginBottom: 12 }}>WEmpty</WSectionLabel>
      <div style={{ marginBottom: 24, border: '1px solid var(--ui-line)', borderRadius: 8 }}>
        <WEmpty
          title="No assets yet"
          subtitle="Create your first asset to get started"
          action={<WBtn variant="solid" size="sm">+ New Asset</WBtn>}
        />
      </div>

      {/* PhaseTracker */}
      <WSectionLabel style={{ marginBottom: 12 }}>PhaseTracker</WSectionLabel>
      <div style={{ marginBottom: 24 }}>
        <WBox><PhaseTracker phase="L3" /></WBox>
      </div>

      {/* Theme + Accent toggles */}
      <WSectionLabel style={{ marginBottom: 12 }}>Theme + Accent Toggles</WSectionLabel>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <WT size={11} color="ink-faint" style={{ display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Theme</WT>
          <div style={{ display: 'flex', gap: 8 }}>
            <WBtn variant={theme === 'light' ? 'solid' : 'outline'} size="sm" onClick={() => setTheme('light')}>Light</WBtn>
            <WBtn variant={theme === 'dark' ? 'solid' : 'outline'} size="sm" onClick={() => setTheme('dark')}>Dark</WBtn>
          </div>
        </div>
        <div>
          <WT size={11} color="ink-faint" style={{ display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accent</WT>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['azure', 'cobalt', 'copper', 'emerald'] as const).map(a => (
              <div
                key={a}
                onClick={() => setAccent(a)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                  border: accent === a ? '3px solid var(--ui-ink)' : '2px solid var(--ui-line)',
                  background: a === 'azure' ? '#0078d4' : a === 'cobalt' ? '#1e3a6e' : a === 'copper' ? '#b87333' : '#2e7d32',
                }}
                title={a}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Color tokens */}
      <WSectionLabel style={{ marginBottom: 12 }}>--ui-* color tokens</WSectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
        {[
          ['--ui-panel', 'panel'],
          ['--ui-panel-2', 'panel-2'],
          ['--ui-panel-3', 'panel-3'],
          ['--ui-primary', 'primary'],
          ['--ui-ok', 'ok'],
          ['--ui-warn', 'warn'],
          ['--ui-ai', 'ai'],
        ].map(([v, label]) => (
          <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: `var(${v})`, border: '1px solid var(--ui-line)' }} />
            <WT size={10} color="ink-faint">{label}</WT>
          </div>
        ))}
      </div>
    </WFrame>
  )
}
