/* screens/checklist-config.jsx — desktop checklist with config panel + template controls */

function ChecklistConfig() {
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <WHeader crumbs={['DC-12', 'Checklists', 'AHU-007', 'Mech pre-functional']} role="CxA">
        <WBtn variant="ghost" tone="ai" size="sm" icon="✦">copilot</WBtn>
        <WBtn variant="outline" tone="primary" size="sm" icon="◷">history</WBtn>
        <WBtn tone="primary" size="sm" hero icon="✓">sign & lock</WBtn>
      </WHeader>

      {/* Doc header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <WStamp k="form" v="MECH-PF-001" />
              <WStamp k="rev" v="03" />
              <WStamp k="tpl" v="ahu.mech.pre-func" />
            </div>
            <WH size={22} weight={600}>Mechanical pre-functional · AHU-007</WH>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: '1px solid var(--ui-primary-line)', background: 'var(--ui-primary-soft)' }}>
                <WLiveDot tone="primary" size={6} />
                <WT size={10.5} mono color="primary" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>in progress</WT>
              </span>
              <WT size={11.5} color="ink-soft">12 / 18 complete · 1 fail · 2 N/A · 5 left</WT>
              <WT size={11.5} color="ink-faint">·</WT>
              <WT size={11.5} color="ink-soft">last edit · BL 6 min ago</WT>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <WBtn variant="outline" tone="primary" size="sm" icon="⤓">export PDF</WBtn>
            <WBtn variant="outline" tone="primary" size="sm" icon="⎘">save as template</WBtn>
            <WBtn variant="ghost" tone="ink-soft" size="sm">share ›</WBtn>
          </div>
        </div>
      </div>

      {/* Body: config rail + sheet */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>
        {/* CONFIG RAIL */}
        <div style={{ borderRight: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', overflow: 'auto' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--ui-line)' }}>
            <WSectionLabel tone="primary">checklist config</WSectionLabel>
          </div>

          {/* Sections list */}
          <div style={{ padding: 14, borderBottom: '1px solid var(--ui-line)' }}>
            <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>sections · 5</WT>
            {[
              ['Installation', '6/6', 'ok'],
              ['Mechanical', '4/5', 'primary'],
              ['Electrical', '1/4', 'primary'],
              ['Controls', '0/2', 'ink-soft'],
              ['Cleanup & sign-off', '0/1', 'ink-soft'],
            ].map(([n, c, tone], i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                padding: '6px 8px', borderRadius: 6, marginTop: 2,
                background: i === 1 ? 'var(--ui-primary-soft)' : 'transparent',
                border: i === 1 ? '1px solid var(--ui-primary-line)' : '1px solid transparent',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: `var(--ui-${tone})` }} />
                  <WT size={12.5} weight={i === 1 ? 500 : 400}>{n}</WT>
                </span>
                <WT size={10.5} mono color={tone}>{c}</WT>
              </div>
            ))}
            <WBtn variant="ghost" tone="primary" size="sm" icon="+" style={{ marginTop: 8 }}>add section</WBtn>
          </div>

          {/* Sign-off rules */}
          <div style={{ padding: 14, borderBottom: '1px solid var(--ui-line)' }}>
            <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>sign-off rules</WT>
            {[
              ['Require CxA signature', true],
              ['Require GC signature', true],
              ['Require vendor signature', true],
              ['Witness photo on each fail', true],
              ['Auto-create issue on fail', true],
              ['Lock on signature', true],
            ].map(([t, on], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                <WT size={12}>{t}</WT>
                <span style={{
                  width: 28, height: 16, borderRadius: 999,
                  background: on ? 'var(--ui-primary)' : 'var(--ui-line-strong)',
                  position: 'relative', flexShrink: 0,
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: on ? 14 : 2,
                    width: 12, height: 12, borderRadius: '50%', background: 'white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }} />
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div style={{ padding: 14, borderBottom: '1px solid var(--ui-line)' }}>
            <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>columns</WT>
            {[
              ['#', true], ['Ref', true], ['Description', true], ['Pass / Fail / N/A', true],
              ['Comments', true], ['Photo', true], ['Measured value', false], ['Limits', false],
              ['Signed by', true], ['Timestamp', true],
            ].map(([n, on], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `1.5px solid ${on ? 'var(--ui-primary)' : 'var(--ui-line-strong)'}`,
                  background: on ? 'var(--ui-primary)' : 'transparent',
                  color: 'white', fontSize: 10, lineHeight: 1, textAlign: 'center',
                }}>{on ? '✓' : ''}</span>
                <WT size={12} color={on ? 'ink' : 'ink-soft'}>{n}</WT>
              </div>
            ))}
          </div>

          {/* AI panel */}
          <div style={{ padding: 14 }}>
            <WSectionLabel tone="ai" dot>ai assist</WSectionLabel>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <WBtn variant="outline" tone="ai" size="sm" icon="✦" block>generate items from spec</WBtn>
              <WBtn variant="outline" tone="ai" size="sm" icon="✦" block>add witness items</WBtn>
              <WBtn variant="outline" tone="ai" size="sm" icon="✦" block>find missing checks</WBtn>
            </div>
          </div>
        </div>

        {/* SHEET */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', padding: '10px 18px', gap: 6, alignItems: 'center', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
            <WBtn variant="ghost" tone="ink-soft" size="sm">↶ undo</WBtn>
            <WBtn variant="ghost" tone="ink-soft" size="sm">↷ redo</WBtn>
            <div style={{ width: 1, height: 18, background: 'var(--ui-line)', margin: '0 6px' }} />
            <WBtn variant="outline" tone="primary" size="sm" icon="⎯">insert row</WBtn>
            <WBtn variant="outline" tone="primary" size="sm" icon="∑">add formula</WBtn>
            <WBtn variant="outline" tone="primary" size="sm" icon="◇">conditional fill</WBtn>
            <WBtn variant="outline" tone="primary" size="sm" icon="⇆">branch logic</WBtn>
            <div style={{ flex: 1 }} />
            <WBtn variant="outline" tone="primary" size="sm" icon="⊞">view ▾</WBtn>
            <WBar value={67} color="primary" style={{ width: 100, height: 6 }} />
            <WT size={11.5} mono color="ink-soft">67%</WT>
          </div>

          {/* Sheet */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 60px 1.8fr 70px 70px 70px 1.4fr 100px 90px 90px',
              padding: '7px 18px', borderBottom: '1.5px solid var(--ui-line)', background: 'var(--ui-panel-2)',
            }}>
              {['#', 'Ref', 'Description', 'Pass', 'Fail', 'N/A', 'Comments', 'Photo', 'Signed', 'Time'].map((h, i) => (
                <WT key={i} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{h}</WT>
              ))}
            </div>
            {[
              [1, 'M-01', 'Shipping stops, bracing & packing removed', '✓', '', '', 'Observed clean', 'IMG_2042', 'BL', '08:32'],
              [2, 'M-01', 'Name plate / tag readable and correct', '', '✓', '', 'Tag faded — replacement requested', 'IMG_2043', 'BL', '08:34'],
              [3, 'M-02', 'Asset location matches drawing M-204', '✓', '', '', '—', '—', 'BL', '08:36'],
              [4, 'M-02', 'Installation per spec; bolts tight (45 ft-lb)', '✓', '', '', 'Torqued to spec', '—', 'BL', '08:38'],
              [5, 'M-03', 'Access clearance per code (3 ft front)', '✓', '', '', '—', '—', 'BL', '08:42'],
              [6, 'M-03', 'Drain piping installed & trapped', '', '', '✓', 'No drain req. for this unit', '—', 'BL', '08:44'],
              [7, 'M-04', 'Filter racks installed; correct rating MERV-13', '⋯', '', '', 'in progress', '—', '—', ''],
              [8, 'M-04', 'Belts aligned & tensioned', '', '', '', '', '', '', ''],
              [9, 'M-05', 'Damper actuators wired & stroked', '', '', '', '', '', '', ''],
              [10, 'M-05', 'Smoke detector mounted in supply duct', '', '', '', '', '', '', ''],
              [11, 'M-06', 'Coil clean; no shipping debris', '', '', '', '', '', '', ''],
              [12, 'M-06', 'Condensate pan slope verified', '', '', '', '', '', '', ''],
            ].map((row, i) => {
              const failed = row[4] === '✓';
              const passed = row[3] === '✓';
              const naCol = row[5] === '✓';
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '40px 60px 1.8fr 70px 70px 70px 1.4fr 100px 90px 90px',
                  padding: '6px 18px', borderBottom: '1px solid var(--ui-line)',
                  background: failed ? 'var(--ui-warn-soft)' : (i === 6 ? 'var(--ui-primary-soft)' : 'transparent'),
                  alignItems: 'center',
                }}>
                  <WT size={11} mono color="ink-faint">{row[0]}</WT>
                  <WT size={11} mono color="ink-faint">{row[1]}</WT>
                  <WT size={12.5}>{row[2]}</WT>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, border: `1px solid ${passed ? 'var(--ui-ok)' : 'var(--ui-line-strong)'}`, background: passed ? 'var(--ui-ok)' : 'transparent', color: 'white', fontSize: 12, fontWeight: 600 }}>{passed ? '✓' : ''}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, border: `1px solid ${failed ? 'var(--ui-warn)' : 'var(--ui-line-strong)'}`, background: failed ? 'var(--ui-warn)' : 'transparent', color: 'white', fontSize: 12, fontWeight: 600 }}>{failed ? '✕' : ''}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, border: `1px solid ${naCol ? 'var(--ui-ink-soft)' : 'var(--ui-line-strong)'}`, background: naCol ? 'var(--ui-ink-soft)' : 'transparent', color: 'white', fontSize: 11, fontWeight: 600 }}>{naCol ? '/' : ''}</span>
                  <WT size={11.5} color={row[6] ? 'ink' : 'ink-faint'}>{row[6] || '—'}</WT>
                  <WT size={11} mono color={row[7] && row[7] !== '—' ? 'primary' : 'ink-faint'}>{row[7] || '—'}</WT>
                  <WT size={11.5}>{row[8] || '—'}</WT>
                  <WT size={11} mono color="ink-faint">{row[9] || '—'}</WT>
                </div>
              );
            })}
          </div>

          {/* Footer formula + AI */}
          <div style={{ padding: '8px 18px', borderTop: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <WT size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>fx</WT>
            <WWell style={{ flex: 1, padding: '4px 10px' }}>
              <WT size={11.5} mono color="ink-soft">=COUNTIF(Pass, "✓") / (rows − COUNTIF(N/A, "✓"))  →  67%</WT>
            </WWell>
            <WBtn variant="ghost" tone="ai" size="sm" icon="✦">explain</WBtn>
          </div>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { ChecklistConfig });
