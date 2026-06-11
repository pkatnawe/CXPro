/* screens/equipment.jsx — 3 equipment register wireframe variations */

function EquipmentV1() {
  // V1 — Linear-style dense table with AI command bar
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Assets']} role="CxA" />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <WSideNav active="Assets" items={[
          '§ project', 'Dashboard', 'Schedule',
          '§ work', 'Assets', 'Checklists', 'Tests', 'Issues',
          '§ knowledge', 'Documents', 'Reports',
        ]} />

        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* command bar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <WWell style={{ flex: 1, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <WIcon glyph="✦" color="ai" />
              <WT size={13} color="ink-soft">filter or ask · "all AHUs in Hall B not yet pre-functional"</WT>
              <div style={{ flex: 1 }} />
              <WT size={10} color="ink-faint" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }}>⌘K</WT>
            </WWell>
            <WPill tone="primary" filled seed="new">+ new</WPill>
            <WPill tone="ink" seed="imp">import BIM</WPill>
            <WPill tone="ink" seed="exp">export</WPill>
          </div>

          {/* filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <WPill tone="primary" filled seed="f1">discipline = mech</WPill>
            <WPill tone="primary" filled seed="f2">hall = B</WPill>
            <WPill tone="ai" filled seed="f3">✦ status ≠ commissioned</WPill>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center', marginLeft: 4 }}>
              <WLiveDot tone="ok" size={6} />
              <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>248 of 7,833 · live</WT>
            </div>
          </div>

          {/* table */}
          <WBox seed="table" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 110px 110px 90px 100px 80px 100px 90px', padding: '8px 12px', borderBottom: '1.4px solid var(--wk-line)', background: 'var(--wk-panel)' }}>
              {['', 'Tag · description', 'System', 'Location', 'Status', 'Phase', 'Issues', 'Checklist', 'Owner'].map((h, i) => (
                <WT key={i} size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</WT>
              ))}
            </div>
            {[
              ['AHU-007', 'Air handler · Hall B north', 'Mech', 'B / lvl 1', 'in progress', 'pre-func', 2, '12/18', 'BL'],
              ['AHU-008', 'Air handler · Hall B south', 'Mech', 'B / lvl 1', 'commissioned', 'func', 0, '18/18', 'BL'],
              ['PDU-04', 'Power distribution unit', 'Elec', 'B / row 3', 'blocked', 'load val', 3, '6/14', 'AC'],
              ['UPS-12', 'UPS string A', 'Elec', 'B / row 3', 'in progress', 'megger', 1, '4/9', 'AC'],
              ['CRAH-12', 'Computer room air handler', 'Mech', 'B / hot aisle', 'in progress', 'startup', 1, '7/11', 'BL'],
              ['BMS-PLC-3', 'PLC enclosure · zone 3', 'Ctrl', 'B / ER-3', 'in progress', 'point-to-point', 0, '22/40', 'KP'],
              ['VESDA-B4', 'Aspirating smoke det.', 'FLS', 'B / ceiling', 'awaiting install', '—', 0, '0/6', 'JM'],
              ['CHWP-2', 'Chilled water pump 2', 'Mech', 'B / penthouse', 'commissioned', 'func', 0, '14/14', 'BL'],
              ['Switchgear-2A', 'MV switchgear', 'Elec', 'utility yard', 'in progress', 'pre-func', 1, '9/15', 'AC'],
            ].map((row, i) => {
              const statusColor = { 'blocked': 'warn', 'commissioned': 'ok', 'in progress': 'primary', 'awaiting install': 'ink-soft' }[row[4]];
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 110px 110px 90px 100px 80px 100px 90px', padding: '7px 12px', borderBottom: '1px dashed var(--wk-line)', alignItems: 'center' }}>
                  <WT size={12} color="ink-soft">□</WT>
                  <div><WT size={12}><b>{row[0]}</b> · {row[1]}</WT></div>
                  <WT size={12}>{row[2]}</WT>
                  <WT size={12} color="ink-soft">{row[3]}</WT>
                  <WPill tone={statusColor} filled seed={`s${i}`}>{row[4]}</WPill>
                  <WT size={12} color="ink-soft">{row[5]}</WT>
                  <WT size={12} color={row[6] > 0 ? 'warn' : 'ink-soft'}>{row[6]}</WT>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WBar value={parseInt(row[7]) / parseInt(row[7].split('/')[1]) * 100} color="primary" height={5} style={{ width: 50 }} />
                    <WT size={11} color="ink-soft">{row[7]}</WT>
                  </div>
                  <WAvatar initials={row[8]} size={20} seed={row[8]} />
                </div>
              );
            })}
          </WBox>

          {/* AI bulk action toast */}
          <WBox seed="ai-bulk" style={{ padding: '8px 12px', borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <WIcon glyph="✦" color="ai" />
            <WT size={12}>3 selected — bulk: assign owner · generate checklist · move to phase · ask...</WT>
            <div style={{ flex: 1 }} />
            <WPill tone="ai" filled seed="r1">run workflow ▾</WPill>
          </WBox>
        </div>
      </div>
      <WNote arrow="left" style={{ position: 'absolute', top: 120, right: -134, width: 130 }}>
        "filter or ask" — same box, AI parses NL or operates on raw filters
      </WNote>
    </WFrame>
  );
}

function EquipmentV2() {
  // V2 — Kanban by commissioning phase
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Assets · phases']} role="PM" />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <WSideNav active="Assets" items={['§ project', 'Dashboard', 'Schedule', '§ work', 'Assets', 'Checklists', 'Tests', 'Issues', '§ knowledge', 'Documents', 'Reports']} />

        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <WH size={22}>Assets by phase</WH>
              <WT size={12} color="ink-soft">drag cards across · group by: <u>phase</u> / system / hall / owner</WT>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <WPill tone="primary" filled seed="vt1">phase</WPill>
              <WPill tone="ink" seed="vt2">table</WPill>
              <WPill tone="ink" seed="vt3">map</WPill>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, minHeight: 0 }}>
            {[
              { title: 'Awaiting install', count: 412, color: 'ink-soft', items: [['VESDA-B4', 'FLS'], ['Camera 12-A', 'Sec'], ['CRAH-14', 'Mech']] },
              { title: 'Pre-functional', count: 186, color: 'primary', items: [['AHU-007', 'Mech'], ['Switchgear-2A', 'Elec'], ['BMS-PLC-3', 'Ctrl'], ['CRAC-9', 'Mech']] },
              { title: 'Functional test', count: 94, color: 'primary', items: [['CRAH-12', 'Mech'], ['UPS-12', 'Elec'], ['CHWP-2', 'Mech']] },
              { title: 'Issues / blocked', count: 38, color: 'warn', items: [['PDU-04', 'Elec'], ['AHU-12', 'Mech']] },
              { title: 'Commissioned', count: 117, color: 'ok', items: [['AHU-008', 'Mech'], ['CHWP-2', 'Mech'], ['CRAH-9', 'Mech']] },
            ].map((col, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
                <WBox seed={`col${ci}`} style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', borderColor: `var(--wk-${col.color})`, background: `var(--wk-${col.color}-soft)` }}>
                  <WT size={12} style={{ fontWeight: 600 }}>{col.title}</WT>
                  <WT size={12} color={col.color}>{col.count}</WT>
                </WBox>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                  {col.items.map((it, i) => (
                    <WBox key={i} seed={`${ci}-${i}`} style={{ padding: 8 }}>
                      <WT size={13} style={{ fontWeight: 600 }}>{it[0]}</WT>
                      <WT size={11} color="ink-soft">{it[1]}</WT>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
                        <WBar value={[20, 50, 80, 30, 100][ci]} color={col.color} height={4} style={{ width: 60 }} />
                        <WAvatar initials={['BL', 'AC', 'KP', 'JM'][i % 4]} size={18} seed={`av${ci}${i}`} />
                      </div>
                    </WBox>
                  ))}
                  {ci === 1 ? (
                    <WBox seed={`ai-${ci}`} style={{ padding: 8, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)', borderStyle: 'dashed' }}>
                      <WT size={11} color="ai">✦ 12 ready to promote from preview</WT>
                      <WPill tone="ai" filled seed={`p${ci}`} style={{ marginTop: 4 }}>review →</WPill>
                    </WBox>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* AI bottom strip */}
          <WBox seed="ai-strip" style={{ padding: 12, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <WAI>flow analysis</WAI>
              <WT size={12}>cycle time pre-func → functional: <b>12.4 days avg</b> (+3d vs plan). Bottleneck: BMS point validation. 3 workflows can help →</WT>
              <div style={{ flex: 1 }} />
              <WPill tone="ai" filled seed="open">open</WPill>
            </div>
          </WBox>
        </div>
      </div>
    </WFrame>
  );
}

function EquipmentV3() {
  // V3 — Hierarchical tree + selected-detail pane (drill structure)
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Assets', 'Hall B', 'Row 3', 'PDU-04']} role="Field Tech" />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <WSideNav width={56} active="Assets" items={['◇', '◆', '▤', '○', '✦', '⌥', '⎘', '⎈']} />

        {/* Tree */}
        <div style={{ width: 280, borderRight: '1.5px solid var(--wk-line)', padding: 12, overflow: 'auto' }}>
          <WBox seed="search" style={{ padding: '4px 8px', marginBottom: 8 }}>
            <WT size={12} color="ink-soft">⌕ search tree...</WT>
          </WBox>
          {[
            ['▾ DC-12 · Hudson Valley', 0, false],
            ['▾ Hall A', 1, false],
            ['▸ Hall B', 1, true],
            ['▾ Row 1', 2, false],
            ['▾ Row 2', 2, false],
            ['▸ Row 3', 2, true],
            ['PDU-03', 3, false],
            ['PDU-04 · selected', 3, false, 'sel'],
            ['UPS-12', 3, false],
            ['Racks B-001 → B-040 (40)', 3, false],
            ['▸ Row 4', 2, false],
            ['▸ Row 5', 2, false],
            ['▾ Penthouse', 1, false],
            ['▸ Hall C', 1, false],
            ['▸ Utility yard', 1, false],
          ].map(([n, d, bold, sel], i) => (
            <div key={i} style={{
              padding: '3px 6px',
              paddingLeft: 6 + d * 14,
              fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
              fontSize: 12.5,
              fontWeight: bold ? 600 : 400,
              color: sel ? 'var(--wk-primary)' : 'var(--wk-ink)',
              background: sel ? 'var(--wk-primary-soft)' : 'transparent',
              borderRadius: 4,
              border: sel ? '1.4px solid var(--wk-primary)' : '1.4px solid transparent',
            }}>{n}</div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <WStamp k="tag" v="PDU-04" />
                <WStamp k="disc" v="ELEC" />
                <WStamp k="hall" v="B / R3" />
                <WStamp k="rev" v="03" />
              </div>
              <WT size={12} color="ink-soft">Power · 480/277V · 1200A</WT>
              <WH size={28}>PDU-04</WH>
              <WT size={13} color="ink-soft">Hall B / Row 3 · serves racks B-001 → B-040</WT>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, border: '1px solid var(--ui-warn-line)', background: 'var(--ui-warn-soft)' }}>
                  <WLiveDot tone="warn" size={6} />
                  <WT size={11} mono color="warn" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>blocked</WT>
                </span>
                <WPill tone="ink" seed="s2">phase: load val</WPill>
                <WPill tone="ink" seed="s4">owner: AC</WPill>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <WPill tone="primary" filled seed="op1">open checklist</WPill>
              <WPill tone="ink" seed="op2">log issue</WPill>
              <WPill tone="ai" filled seed="op3">✦ summarize history</WPill>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <WBox seed="prog" style={{ padding: 10 }}>
              <WT size={11} color="ink-soft">Commissioning progress</WT>
              <WH size={20}>43%</WH>
              <WBar value={43} color="primary" />
              <WT size={11} color="ink-soft" style={{ marginTop: 4 }}>6 / 14 checklists complete</WT>
            </WBox>
            <WBox seed="iss" style={{ padding: 10 }}>
              <WT size={11} color="ink-soft">Open issues</WT>
              <WH size={20} style={{ color: 'var(--wk-warn)' }}>3</WH>
              <WT size={11} color="ink-soft">2 critical · oldest 4d</WT>
            </WBox>
            <WBox seed="docs" style={{ padding: 10 }}>
              <WT size={11} color="ink-soft">Linked drawings</WT>
              <WH size={20}>7</WH>
              <WT size={11} color="ink-soft">E-301, E-302, BMS-04...</WT>
            </WBox>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 16, borderBottom: '1.5px solid var(--wk-line)', paddingBottom: 4 }}>
            {['Overview', 'Checklists (14)', 'Tests', 'Issues (3)', 'Files (12)', 'History', 'Linked'].map((t, i) => (
              <WT key={i} size={13} color={i === 0 ? 'primary' : 'ink-soft'} style={{ paddingBottom: 4, borderBottom: i === 0 ? '2px solid var(--wk-primary)' : '2px solid transparent' }}>{t}</WT>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
            <WBox seed="timeline" style={{ padding: 10 }}>
              <WH size={14}>Activity timeline</WH>
              {[
                ['10:42', 'BL', 'failed item #7 on mech checklist'],
                ['09:11', 'AC', 'uploaded megger results (PDF)'],
                ['Yest', 'KP', 'BMS point cross-check passed'],
                ['Mon', '✦', 'AI: auto-flagged breaker label mismatch'],
                ['Mon', 'AC', 'issue logged: PDU-04 gnd fault sensor'],
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px dashed var(--wk-line)' }}>
                  <WT size={11} color="ink-soft" style={{ width: 40 }}>{r[0]}</WT>
                  <WAvatar initials={r[1]} size={18} seed={`tl${i}`} />
                  <WT size={12}>{r[2]}</WT>
                </div>
              ))}
            </WBox>
            <WBox seed="ai-summary" style={{ padding: 10, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
              <WAI>this asset · in plain english</WAI>
              <WT size={12} style={{ marginTop: 6 }}>
                PDU-04 has been in load validation for 9 days (4 over plan).
                Stuck on ground fault sensor reading inconsistent with E-302 schematic.
                Acme Elec scheduled re-test Wed. Risk to row 3 energization: <b>high</b>.
              </WT>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <WPill tone="ai" filled seed="r1">draft RFI</WPill>
                <WPill tone="ai" seed="r2">show similar</WPill>
                <WPill tone="ai" seed="r3">notify owner</WPill>
              </div>
            </WBox>
          </div>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { EquipmentV1, EquipmentV2, EquipmentV3 });
