/* screens/equipment-register.jsx — asset register with type-filter sidebar */

function EquipmentRegister() {
  const types = [
    { group: 'Mechanical', items: [['AHU · Air handlers', 18], ['CRAH · Comp rm AC', 24], ['CHWP · CHW pumps', 8], ['Chiller', 4], ['Cooling tower', 6]] },
    { group: 'Electrical', items: [['Switchgear', 12], ['PDU', 24], ['UPS', 16], ['Generator', 4], ['ATS', 8]] },
    { group: 'Controls', items: [['BMS PLC', 18], ['EPMS', 8], ['DDC panel', 22]] },
    { group: 'Life Safety', items: [['VESDA', 12], ['Sprinkler', 1], ['Fire panel', 4]] },
    { group: 'Security', items: [['CCTV camera', 240], ['Card reader', 86], ['DVR / NVR', 8]] },
  ];
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <WHeader crumbs={['DC-12 · Hudson Valley', 'Asset register']} role="CxA">
        <WConsole cells={[
          { tone: 'ok', label: 'sync', value: 'live' },
          { tone: 'ok', label: 'BIM', value: 'v.42' },
          { tone: 'ai', label: 'AI', value: 'on' },
        ]} />
        <WWell style={{ width: 220, display: 'flex', alignItems: 'center', gap: 6 }}>
          <WT size={12} color="ink-soft" mono>⌕ jump to anything</WT>
          <div style={{ flex: 1 }} />
          <WT size={10} color="ink-faint" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }}>⌘K</WT>
        </WWell>
      </WHeader>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left sidebar — type tree (the new filter affordance) */}
        <div style={{
          width: 270, flexShrink: 0,
          borderRight: '1px solid var(--ui-line)',
          background: 'var(--ui-panel-2)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 14px 8px' }}>
            <WSectionLabel tone="primary">filter · by type</WSectionLabel>
            <WWell style={{ marginTop: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <WT size={12} color="ink-soft" mono>⌕ filter types...</WT>
            </WWell>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 14px' }}>
            {/* "All" row */}
            <div style={{
              padding: '7px 10px', borderRadius: 6,
              background: 'var(--ui-panel)', border: '1px solid var(--ui-line)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
            }}>
              <WT size={13} weight={500}>All assets</WT>
              <WT size={11} mono color="ink-soft">7,833</WT>
            </div>
            {types.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 14 }}>
                <div style={{ padding: '0 6px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>{g.group}</WT>
                  <WT size={10} mono color="ink-faint">{g.items.reduce((a, [, n]) => a + n, 0)}</WT>
                </div>
                {g.items.map(([name, count], i) => {
                  const active = gi === 0 && i === 0;
                  return (
                    <div key={i} style={{
                      padding: '5px 10px',
                      marginTop: 2,
                      borderRadius: 6,
                      background: active ? 'var(--ui-primary-soft)' : 'transparent',
                      border: active ? '1px solid var(--ui-primary-line)' : '1px solid transparent',
                      color: active ? 'var(--ui-primary)' : 'var(--ui-ink)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: 'Geist, sans-serif',
                      fontSize: 12.5,
                      fontWeight: active ? 500 : 400,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: active ? 'var(--ui-primary)' : 'var(--ui-line-strong)' }} />
                        {name}
                      </span>
                      <WT size={11} mono color={active ? 'primary' : 'ink-soft'}>{count}</WT>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* Title + meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <WStamp k="type" v="AHU" />
                <WStamp k="disc" v="MECH" />
                <WStamp k="cls" v="rotating" />
              </div>
              <WH size={26}>Air Handlers</WH>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <WT size={12} color="ink-soft">18 units across DC-12 · serving Halls A · B · C</WT>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <WLiveDot tone="ok" size={6} />
                  <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>16 online</WT>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <WBtn variant="outline" tone="primary" icon="⤓">export</WBtn>
              <WBtn variant="outline" tone="primary" icon="↑">import BIM</WBtn>
              <WBtn tone="primary" icon="+">add asset</WBtn>
            </div>
          </div>

          {/* Command bar */}
          <WWell style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <WIcon glyph="✦" color="ai" />
            <WT size={13} color="ink-soft">filter or ask · e.g. "AHUs in Hall B not yet pre-functional"</WT>
            <div style={{ flex: 1 }} />
            <WT size={10} color="ink-faint" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }}>⌘K</WT>
          </WWell>

          {/* Active filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <WT size={11} color="ink-faint" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }}>active filters</WT>
            <WPill tone="primary" filled seed="t1">type: AHU</WPill>
            <WPill tone="primary" filled seed="t2">hall: B</WPill>
            <WPill tone="ai" filled seed="t3">✦ phase ≠ commissioned</WPill>
            <WT size={11} color="ink-soft">·</WT>
            <WT size={11} mono color="ink-faint">12 results</WT>
          </div>

          {/* Table */}
          <WBox seed="tbl" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1.4fr 80px 130px 110px 110px 90px 120px 80px', padding: '8px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', alignItems: 'center' }}>
              {['', 'Tag · description', 'Devices', 'Location', 'Status', 'Phase', 'Issues', 'Checklist', 'Owner'].map((h, i) => (
                <WT key={i} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{h}</WT>
              ))}
            </div>
            {[
              ['AHU-007', 'Hall B north · supply 28k cfm', 14, 'B / lvl 1 / mech rm', 'in progress', 'pre-func', 2, '12/18', 'BL'],
              ['AHU-008', 'Hall B south · supply 28k cfm', 14, 'B / lvl 1 / mech rm', 'commissioned', 'func', 0, '18/18', 'BL'],
              ['AHU-009', 'Hall A east · supply 24k cfm', 12, 'A / penthouse', 'in progress', 'func', 1, '14/18', 'BL'],
              ['AHU-010', 'Hall A west · supply 24k cfm', 12, 'A / penthouse', 'in progress', 'pre-func', 0, '9/18', 'JM'],
              ['AHU-011', 'Hall C north · supply 30k cfm', 16, 'C / penthouse', 'blocked', 'pre-func', 4, '5/18', 'BL'],
              ['AHU-012', 'Hall C south · supply 30k cfm', 16, 'C / penthouse', 'awaiting', '—', 0, '0/18', '—'],
              ['AHU-013', 'Hall B mid · supply 18k cfm', 10, 'B / lvl 2', 'commissioned', 'func', 0, '14/14', 'JM'],
              ['AHU-014', 'Hall A south · supply 24k cfm', 12, 'A / penthouse', 'in progress', 'func', 1, '11/18', 'BL'],
            ].map((row, i) => {
              const status = row[4];
              const tone = { 'blocked': 'warn', 'commissioned': 'ok', 'in progress': 'primary', 'awaiting': 'ink-soft' }[status];
              const pulse = status === 'in progress' || status === 'blocked';
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1.4fr 80px 130px 110px 110px 90px 120px 80px', padding: '9px 14px', borderBottom: '1px solid var(--ui-line)', alignItems: 'center', background: i === 0 ? 'var(--ui-primary-soft)' : 'transparent' }}>
                  <WT size={12} color="ink-faint">{i === 0 ? '✓' : '□'}</WT>
                  <div>
                    <WT size={13} weight={500}>{row[0]}</WT>
                    <WT size={11} color="ink-soft" style={{ marginTop: 1 }}>{row[1]}</WT>
                  </div>
                  <WT size={12} mono color="ink-soft">{row[2]} sub</WT>
                  <WT size={11.5} color="ink-soft">{row[3]}</WT>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, border: `1px solid var(--ui-${tone}-line)`, background: `var(--ui-${tone}-soft)`, color: `var(--ui-${tone})`, alignSelf: 'flex-start', fontSize: 11, fontFamily: 'Geist Mono', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 500 }}>
                    {pulse ? <WLiveDot tone={tone} size={5} /> : <span style={{ width: 5, height: 5, borderRadius: 3, background: `var(--ui-${tone})` }} />}
                    {status}
                  </span>
                  <WT size={11.5} color="ink-soft">{row[5]}</WT>
                  <WT size={12} mono color={row[6] > 0 ? 'warn' : 'ink-faint'} weight={row[6] > 0 ? 600 : 400}>{row[6]}</WT>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WBar value={parseInt(row[7]) / parseInt(row[7].split('/')[1]) * 100} color="primary" height={4} style={{ width: 50 }} />
                    <WT size={11} mono color="ink-soft">{row[7]}</WT>
                  </div>
                  {row[8] !== '—' ? <WAvatar initials={row[8]} size={22} seed={row[8] + i} /> : <WT size={11} color="ink-faint">—</WT>}
                </div>
              );
            })}
          </WBox>

          <WNote>type-filter is hierarchical — pick a discipline → category. Each row's "devices" column links into sub-assets.</WNote>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { EquipmentRegister });
