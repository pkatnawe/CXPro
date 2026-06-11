/* screens/asset-detail.jsx — Asset detail page.
   One component, two nav chromes so we can compare:
     nav="tabs"  → horizontal tab strip (current style, made to work harder)
     nav="rail"  → left in-page section rail (scales to 9 sections)
   tab = overview | devices | checklists | tests | issues | files | rfis | history | linked
   Tab panels live in asset-panels-a.jsx / asset-panels-b.jsx (loaded before this in render order). */

const ASSET_TABS = [
  ['overview',  'Overview',   null, '▤'],
  ['devices',   'Devices',    '14', '◆'],
  ['checklists','Checklists',  '3', '☑'],
  ['tests',     'Tests',       '5', '◎'],
  ['issues',    'Issues',      '2', '▲'],
  ['files',     'Files',      '24', '▦'],
  ['rfis',      'RFIs',        '1', '✉'],
  ['history',   'History',    null, '◷'],
  ['linked',    'Linked',      '7', '⎇'],
];

// ── Small shared helpers (global; used across panel files) ──────────────────
function AKV({ k, v, mono = false, color = 'ink', wide = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: wide ? '1 / -1' : 'auto' }}>
      <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{k}</WT>
      <WT size={13} mono={mono} color={color} weight={500}>{v}</WT>
    </div>
  );
}

function ACard({ title, label, tone = 'primary', children, right, style = {}, seed = 'c' }) {
  return (
    <WBox seed={seed} style={{ padding: 0, overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)' }}>
        {label ? <WSectionLabel tone={tone}>{label}</WSectionLabel> : <WT size={13} weight={600}>{title}</WT>}
        {right || null}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </WBox>
  );
}

function AStatusPill({ status, size = 11 }) {
  const tone = { blocked: 'warn', commissioned: 'ok', 'in progress': 'primary', awaiting: 'ink-soft', operational: 'ok' }[status] || 'ink-soft';
  const pulse = status === 'in progress' || status === 'blocked';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, border: `1px solid var(--ui-${tone}-line)`, background: `var(--ui-${tone}-soft)`, color: `var(--ui-${tone})`, fontSize: size, fontFamily: 'Geist Mono', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 500, lineHeight: 1.3 }}>
      {pulse ? <WLiveDot tone={tone} size={5} /> : <span style={{ width: 5, height: 5, borderRadius: 3, background: `var(--ui-${tone})` }} />}
      {status}
    </span>
  );
}

// ── Lifecycle phase tracker (full lifecycle: design → operations) ───────────
function PhaseTracker() {
  const phases = [
    ['Design',         'done',     'Apr 02'],
    ['Submittals',     'done',     'May 06'],
    ['Install',        'done',     'May 19'],
    ['Pre-functional', 'current',  'now'],
    ['Functional',     'upcoming', 'Jun 04'],
    ['IST',            'upcoming', 'Jun 18'],
    ['Turnover',       'upcoming', 'Jul 01'],
    ['Operations',     'upcoming', '—'],
  ];
  return (
    <WBox seed="phase" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <WSectionLabel tone="primary">commissioning lifecycle</WSectionLabel>
        <WT size={11} mono color="ink-soft">stage 4 of 8 · pre-functional · 67% complete</WT>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {phases.map(([name, state, date], i) => {
          const isDone = state === 'done';
          const isCurrent = state === 'current';
          const dotTone = isDone ? 'ok' : isCurrent ? 'primary' : 'ink-soft';
          const lineDone = i < 3; // connectors filled up to current
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto', width: 64 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? 'var(--ui-ok)' : isCurrent ? 'var(--ui-primary-soft)' : 'var(--ui-panel)',
                  border: `1.5px solid ${isDone ? 'var(--ui-ok)' : isCurrent ? 'var(--ui-primary)' : 'var(--ui-line-strong)'}`,
                  color: isDone ? 'var(--ui-on-ok)' : isCurrent ? 'var(--ui-primary)' : 'var(--ui-ink-faint)',
                  fontSize: 12, fontFamily: 'Geist Mono', fontWeight: 600,
                }}>
                  {isDone ? '✓' : isCurrent ? <WLiveDot tone="primary" size={7} /> : i + 1}
                </span>
                <WT size={10.5} weight={isCurrent ? 600 : 500} color={isCurrent ? 'primary' : isDone ? 'ink' : 'ink-faint'} style={{ textAlign: 'center', lineHeight: 1.2 }}>{name}</WT>
                <WT size={9.5} mono color="ink-faint">{date}</WT>
              </div>
              {i < phases.length - 1 ? (
                <div style={{ flex: 1, height: 2, marginTop: 12, background: lineDone ? 'var(--ui-ok)' : 'var(--ui-line)', borderRadius: 2, minWidth: 14 }} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </WBox>
  );
}

// ── Hero (shared across every tab) ──────────────────────────────────────────
function AssetHero() {
  return (
    <div style={{ padding: '16px 24px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <WStamp k="tag" v="AHU-007" />
            <WStamp k="type" v="AHU" />
            <WStamp k="disc" v="MECH" />
            <WStamp k="loc" v="B / lvl 1" />
            <WStamp k="rev" v="02" />
            <WStamp k="asset id" v="A-1284" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <WH size={30}>AHU-007</WH>
            <WT size={14} color="ink-soft">Air handler · Hall B north · 28,000 cfm supply</WT>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--ui-primary-line)', background: 'var(--ui-primary-soft)', color: 'var(--ui-primary)' }}>
              <WLiveDot tone="primary" size={6} />
              <WT size={11} mono color="primary" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>in progress · pre-functional</WT>
            </span>
            <WPill tone="ink" seed="o">owner · Hudson DC LLC</WPill>
            <WPill tone="ink" seed="v">vendor · Acme Mech</WPill>
            <WPill tone="ink" seed="s">scheduled · Wed May 28</WPill>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <WBtn variant="outline" tone="primary" icon="📷">log issue</WBtn>
            <WBtn variant="outline" tone="primary" icon="⤓">turnover pkg</WBtn>
            <WBtn tone="primary" hero icon="▶">open checklist</WBtn>
          </div>
          <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>last activity · 6 min ago by BL</WT>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 16 }}>
        {[
          ['Cx progress', '67%', 'primary', '12 / 18 items'],
          ['open issues', '2', 'warn', '1 critical · oldest 3d'],
          ['sub-assets', '14', 'ink-soft', '12 commissioned'],
          ['submittals', '6/7', 'ink-soft', '1 pending approval'],
          ['turnover', '42%', 'ai', 'O&M · warranty · spares'],
        ].map(([k, v, c, sub], i) => (
          <WBox key={i} seed={`k${i}`} style={{ padding: 12 }}>
            <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{k}</WT>
            <WH size={22} weight={600} style={{ marginTop: 4, color: c === 'ink-soft' ? 'var(--ui-ink)' : `var(--ui-${c})` }}>{v}</WH>
            <WT size={11} color="ink-soft" style={{ marginTop: 2 }}>{sub}</WT>
          </WBox>
        ))}
      </div>
    </div>
  );
}

// ── Nav chrome A: horizontal tab strip ──────────────────────────────────────
function AssetTabStrip({ active }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ui-line)', padding: '0 24px', background: 'var(--ui-panel)', flexShrink: 0 }}>
      {ASSET_TABS.map(([id, label, count]) => {
        const on = id === active;
        return (
          <div key={id} style={{
            padding: '12px 14px',
            borderBottom: on ? '2px solid var(--ui-primary)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'default',
          }}>
            <WT size={13} color={on ? 'primary' : 'ink-soft'} weight={on ? 500 : 400}>{label}</WT>
            {count ? <WT size={10.5} mono color={on ? 'primary' : 'ink-faint'} style={{ padding: '1px 6px', borderRadius: 999, background: on ? 'var(--ui-primary-soft)' : 'var(--ui-panel-3)' }}>{count}</WT> : null}
          </div>
        );
      })}
    </div>
  );
}

// ── Nav chrome B: left in-page section rail ─────────────────────────────────
function AssetRail({ active }) {
  return (
    <div style={{ width: 208, flexShrink: 0, borderRight: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '14px 12px 8px' }}>
        <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>sections</WT>
      </div>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {ASSET_TABS.map(([id, label, count, glyph]) => {
          const on = id === active;
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 6,
              background: on ? 'var(--ui-primary-soft)' : 'transparent',
              border: on ? '1px solid var(--ui-primary-line)' : '1px solid transparent',
            }}>
              <span style={{ width: 16, textAlign: 'center', fontFamily: 'Geist Mono', fontSize: 12, color: on ? 'var(--ui-primary)' : 'var(--ui-ink-faint)' }}>{glyph}</span>
              <WT size={13} weight={on ? 500 : 400} color={on ? 'primary' : 'ink'} style={{ flex: 1 }}>{label}</WT>
              {count ? <WT size={10.5} mono color={on ? 'primary' : 'ink-faint'}>{count}</WT> : null}
            </div>
          );
        })}
      </div>
      <div style={{ height: 1, background: 'var(--ui-line)', margin: '12px 12px' }} />
      <div style={{ padding: '0 12px 16px' }}>
        <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>lifecycle</WT>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[['Pre-functional', 'current'], ['Functional', 'next'], ['IST', null], ['Turnover', null]].map(([p, s], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: s === 'current' ? 'var(--ui-primary)' : 'var(--ui-line-strong)' }} />
              <WT size={11.5} color={s === 'current' ? 'primary' : 'ink-soft'} weight={s === 'current' ? 500 : 400}>{p}</WT>
              {s === 'current' ? <WLiveDot tone="primary" size={5} /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel router ────────────────────────────────────────────────────────────
function AssetPanel({ tab }) {
  switch (tab) {
    case 'overview':   return <AssetOverview />;
    case 'devices':    return <AssetDevices />;
    case 'checklists': return <AssetChecklists />;
    case 'tests':      return <AssetTests />;
    case 'issues':     return <AssetIssues />;
    case 'files':      return <AssetFiles />;
    case 'rfis':       return <AssetRFIs />;
    case 'history':    return <AssetHistory />;
    case 'linked':     return <AssetLinked />;
    default:           return <AssetOverview />;
  }
}

// ── Detail shell ────────────────────────────────────────────────────────────
function AssetDetail({ tab = 'overview', nav = 'tabs' }) {
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <WHeader crumbs={['DC-12 · Hudson Valley', 'Assets', 'AHU · Air handlers', 'AHU-007']} role="CxA">
        <WBtn variant="outline" tone="primary" size="sm" icon="◷">history</WBtn>
        <WBtn variant="ghost" tone="ai" size="sm" icon="✦">copilot</WBtn>
      </WHeader>
      <AssetHero />
      {nav === 'rail' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <AssetRail active={tab} />
          <AssetPanel tab={tab} />
        </div>
      ) : (
        <>
          <AssetTabStrip active={tab} />
          <AssetPanel tab={tab} />
        </>
      )}
    </WFrame>
  );
}

Object.assign(window, {
  ASSET_TABS, AKV, ACard, AStatusPill, PhaseTracker,
  AssetHero, AssetTabStrip, AssetRail, AssetPanel, AssetDetail,
});
