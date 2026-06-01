// SCRATCH — visual QA for frontend-kit primitives; can be deleted after sign-off
'use client'

import {
  WBox,
  WPill,
  WT,
  WH,
  WAvatar,
  WBar,
  WStamp,
  WIcon,
  WLiveDot,
  WSectionLabel,
  WBtn,
  WHeader,
  WSideNav,
  WFrame,
  WTabs,
  WKV,
  WKVGrid,
  WSkeleton,
  WEmpty,
} from '@/lib/frontend-kit'
import { useState } from 'react'

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <path d="m12 2 9 5v10l-9 5-9-5V7z"/>
    <path d="m3 7 9 5 9-5M12 12v10"/>
  </svg>
)

export default function FrontendKitPreview() {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <WFrame variant="padded">
      <WHeader
        crumbs={[{ label: 'Home' }, { label: 'Frontend Kit Preview' }]}
        title="Frontend Kit Preview"
        subtitle="Visual QA for fk-* primitives"
        actions={
          <>
            <WBtn variant="outline" size="sm">Secondary</WBtn>
            <WBtn variant="primary" size="sm">Primary</WBtn>
          </>
        }
      />

      {/* WBox variants */}
      <WSectionLabel>WBox</WSectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12, marginBottom: 24 }}>
        <WBox variant="default"><WT>default</WT></WBox>
        <WBox variant="inset"><WT>inset</WT></WBox>
        <WBox variant="well"><WT>well</WT></WBox>
        <WBox variant="flat"><WT>flat</WT></WBox>
      </div>

      {/* WPill variants */}
      <WSectionLabel>WPill</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 24 }}>
        <WPill variant="default">default</WPill>
        <WPill variant="active">active</WPill>
        <WPill variant="ok">ok</WPill>
        <WPill variant="warn">warn</WPill>
        <WPill variant="amber">amber</WPill>
        <WPill variant="ink">ink</WPill>
        <WPill variant="outline">outline</WPill>
        <WPill variant="ghost">ghost</WPill>
        <WPill variant="chip">chip</WPill>
        <WPill variant="chip" active>chip active</WPill>
      </div>

      {/* WT text sizes */}
      <WSectionLabel>WT + WH</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, marginBottom: 24 }}>
        <WH level={1}>Heading 1</WH>
        <WH level={2}>Heading 2</WH>
        <WH level={3}>Heading 3</WH>
        <WH level={4}>Heading 4</WH>
        <WH level={5}>Heading 5</WH>
        <WT size="lg">Text lg</WT>
        <WT size="md">Text md</WT>
        <WT size="base">Text base</WT>
        <WT size="sm">Text sm</WT>
        <WT size="xs">Text xs</WT>
        <WT color="dim">dim color</WT>
        <WT color="graphite">graphite color</WT>
        <WT color="blue">blue color</WT>
        <WT mono>mono font</WT>
        <WT weight="bold">bold weight</WT>
      </div>

      {/* WAvatar */}
      <WSectionLabel>WAvatar</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, marginBottom: 24 }}>
        <WAvatar initials="JD" size="sm" />
        <WAvatar initials="AB" size="md" />
        <WAvatar initials="CX" size="lg" />
        <WAvatar initials="PR" size="xl" />
        <WAvatar initials="SQ" size="md" square />
      </div>

      {/* WBar */}
      <WSectionLabel>WBar</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 24, maxWidth: 400 }}>
        <WBar value={40} />
        <WBar value={65} color="ok" />
        <WBar value={80} color="amber" />
        <WBar value={20} color="warn" size="lg" />
        <WBar value={90} size="sm" />
      </div>

      {/* WStamp */}
      <WSectionLabel>WStamp</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 24 }}>
        <WStamp variant="default">AHU-01</WStamp>
        <WStamp variant="blue">L3</WStamp>
        <WStamp variant="ink">DC-12</WStamp>
        <WStamp variant="outline">Mechanical</WStamp>
      </div>

      {/* WIcon */}
      <WSectionLabel>WIcon</WSectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, marginBottom: 24 }}>
        <WIcon size="xs"><BoxIcon /></WIcon>
        <WIcon size="sm"><BoxIcon /></WIcon>
        <WIcon size="md"><BoxIcon /></WIcon>
        <WIcon size="lg"><BoxIcon /></WIcon>
        <WIcon size="xl"><BoxIcon /></WIcon>
        <WIcon size="md" color="blue"><BoxIcon /></WIcon>
        <WIcon size="md" color="warn"><BoxIcon /></WIcon>
        <WIcon size="md" color="ok"><BoxIcon /></WIcon>
        <WIcon size="md" color="dim"><BoxIcon /></WIcon>
      </div>

      {/* WLiveDot */}
      <WSectionLabel>WLiveDot</WSectionLabel>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, marginBottom: 24 }}>
        <WLiveDot label="live" />
        <WLiveDot color="amber" label="syncing" />
        <WLiveDot color="warn" label="error" />
        <WLiveDot color="dim" label="offline" />
      </div>

      {/* WBtn */}
      <WSectionLabel>WBtn</WSectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 24 }}>
        <WBtn variant="primary">Primary</WBtn>
        <WBtn variant="blue">Blue</WBtn>
        <WBtn variant="outline">Outline</WBtn>
        <WBtn variant="ghost">Ghost</WBtn>
        <WBtn variant="danger">Danger</WBtn>
        <WBtn variant="primary" size="sm">Small</WBtn>
        <WBtn variant="primary" size="lg">Large</WBtn>
        <WBtn variant="outline" pill>+ New</WBtn>
        <WBtn variant="outline" disabled>Disabled</WBtn>
      </div>

      {/* WSideNav */}
      <WSectionLabel>WSideNav</WSectionLabel>
      <div style={{ width: 200, marginTop: 12, marginBottom: 24 }}>
        <WSideNav
          activeId="assets"
          items={[
            { id: 'spaces', label: 'Spaces', icon: <BoxIcon /> },
            { id: 'assets', label: 'Assets', icon: <BoxIcon />, badge: 16 },
            { id: 'systems', label: 'Systems', icon: <BoxIcon />, badge: 2 },
            { id: 'issues', label: 'Issues', icon: <BoxIcon />, badge: 3, badgeAlert: true },
          ]}
        />
      </div>

      {/* WTabs */}
      <WSectionLabel>WTabs</WSectionLabel>
      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <WTabs
          tabs={['Overview', 'Devices', 'Checklists', 'Tests', 'Linked']}
          active={activeTab}
          onChange={setActiveTab}
        />
        <WBox variant="inset"><WT color="dim">Active tab: {activeTab}</WT></WBox>
      </div>

      {/* WKVGrid */}
      <WSectionLabel>WKV / WKVGrid</WSectionLabel>
      <div style={{ marginTop: 12, marginBottom: 24, maxWidth: 480 }}>
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
      <WSectionLabel>WSkeleton</WSectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 24, maxWidth: 360 }}>
        <WSkeleton width="80%" height={16} />
        <WSkeleton width="60%" height={12} />
        <WSkeleton width="90%" height={12} />
      </div>

      {/* WEmpty */}
      <WSectionLabel>WEmpty</WSectionLabel>
      <div style={{ marginTop: 12, marginBottom: 24, border: '1px solid var(--bp-line-softer)', borderRadius: 6 }}>
        <WEmpty
          icon={<BoxIcon />}
          title="No assets yet"
          subtitle="Create your first asset to get started"
          action={<WBtn variant="primary" size="sm">+ New Asset</WBtn>}
        />
      </div>
    </WFrame>
  )
}
