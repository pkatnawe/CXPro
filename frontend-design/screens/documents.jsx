/* screens/documents.jsx — 3 document/drawing management variations */

function DocumentsV1() {
  // V1 — Library w/ AI search at top + faceted nav
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Documents']} role="CxA" />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 0 }}>
        {/* facets */}
        <div style={{ borderRight: '1.5px solid var(--wk-line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          {[
            ['Discipline', ['Mechanical 312', 'Electrical 284', 'Controls 142', 'FLS 64', 'Architectural 91']],
            ['Type', ['Drawing 412', 'Spec 88', 'Submittal 220', 'Manual 142', 'Report 74']],
            ['Status', ['Current 612', 'Superseded 240', 'Pending 38']],
            ['Revision', ['00 · 121', '01 · 234', '02 · 305', '03 · 256']],
          ].map(([t, items], i) => (
            <div key={i}>
              <WT size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t}</WT>
              {items.map((it, j) => (
                <div key={j} style={{ padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <WT size={12}>{it.split(' ').slice(0, -1).join(' ')}</WT>
                  <WT size={11} color="ink-soft">{it.split(' ').slice(-1)}</WT>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* results */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* search */}
          <WBox seed="search" style={{ padding: 12, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WIcon glyph="✦" color="ai" />
              <WT size={14}>"Where is the breaker schedule for PDU-04, current rev only"</WT>
              <div style={{ flex: 1 }} />
              <WT size={11} color="ink-soft">⌘K</WT>
            </div>
          </WBox>

          {/* AI answer card */}
          <WBox seed="answer" style={{ padding: 12 }}>
            <WAI compact>direct answer</WAI>
            <WT size={13} style={{ marginTop: 6 }}>
              The current breaker schedule for PDU-04 is in <b>E-302 rev 03</b> (sheet 4 of 9), released 2025-11-04 by Acme Elec.
              An earlier version (rev 02) is referenced by 6 open checklist items — flag if you switch.
            </WT>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <WPill tone="primary" filled seed="op">open E-302</WPill>
              <WPill tone="ink" seed="hi">highlight breaker schedule</WPill>
              <WPill tone="ai" seed="diff">diff vs rev 02</WPill>
            </div>
          </WBox>

          {/* results header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <WH size={16}>Matching files · 12</WH>
            <div style={{ display: 'flex', gap: 6 }}>
              <WPill tone="primary" filled seed="g1">grid</WPill>
              <WPill tone="ink" seed="g2">list</WPill>
            </div>
          </div>

          {/* grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              ['E-302', 'Breaker schedule', 'rev 03', 'current', 'ai-match'],
              ['E-301', 'PDU-04 single line', 'rev 03', 'current', null],
              ['E-302', 'Breaker schedule', 'rev 02', 'superseded', null],
              ['E-401', 'Grounding plan', 'rev 02', 'current', null],
              ['BMS-04', 'PDU points list', 'rev 01', 'current', 'linked'],
              ['M-204', 'AHU-007 plan', 'rev 02', 'current', null],
              ['Spec 26-24', 'Switchboards', 'rev 00', 'current', null],
              ['RFI-031', 'PDU-04 grounding', 'open', 'pending', null],
            ].map((f, i) => (
              <WBox key={i} seed={`f${i}`} style={{ padding: 8, position: 'relative' }}>
                <WBox seed={`thumb${i}`} style={{ height: 96, padding: 0, position: 'relative', overflow: 'hidden', borderStyle: 'dashed' }}>
                  <WDots style={{ position: 'absolute', inset: 0 }} />
                  {f[4] === 'ai-match' ? (
                    <div style={{ position: 'absolute', top: 6, left: 6 }}>
                      <WPill tone="ai" filled seed={`m${i}`}>✦ match</WPill>
                    </div>
                  ) : null}
                  <WT size={10} color="ink-soft" style={{ position: 'absolute', bottom: 4, right: 6, fontFamily: 'ui-monospace, monospace' }}>{f[0]}</WT>
                </WBox>
                <WT size={12} style={{ marginTop: 6 }}><b>{f[1]}</b></WT>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <WT size={11} color="ink-soft">{f[2]}</WT>
                  <WT size={11} color={f[3] === 'current' ? 'ok' : (f[3] === 'pending' ? 'warn' : 'ink-soft')}>{f[3]}</WT>
                </div>
              </WBox>
            ))}
          </div>
        </div>
      </div>
    </WFrame>
  );
}

function DocumentsV2() {
  // V2 — Drawing viewer with linked checklist items / issues overlaid
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Documents', 'E-302 · Breaker schedule', 'rev 03']} role="CxA" />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr 300px', minHeight: 0 }}>
        {/* tool rail */}
        <div style={{ borderRight: '1.5px solid var(--wk-line)', padding: 8, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {['⌖', '◇', '◐', '✎', '◷', '✦', '⎘', '⤓'].map((g, i) => (
            <WBox key={i} seed={`tool${i}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: i === 5 ? 'var(--wk-ai-soft)' : 'transparent', borderColor: i === 5 ? 'var(--wk-ai)' : 'var(--wk-line)' }}>
              <WT size={18} color={i === 5 ? 'ai' : 'ink'}>{g}</WT>
            </WBox>
          ))}
        </div>

        {/* drawing canvas */}
        <div style={{ position: 'relative', padding: 14 }}>
          <WBox seed="canvas" style={{ width: '100%', height: '100%', padding: 0, overflow: 'hidden', position: 'relative', background: 'var(--wk-panel)' }}>
            <WDots style={{ position: 'absolute', inset: 0 }} />
            {/* fake drawing scaffolding */}
            <svg viewBox="0 0 600 380" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <rect x="40" y="40" width="520" height="300" fill="none" stroke="var(--wk-ink)" strokeWidth="1.5" />
              <rect x="80" y="80" width="80" height="40" fill="none" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <rect x="200" y="80" width="80" height="40" fill="none" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <rect x="320" y="80" width="80" height="40" fill="none" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <rect x="440" y="80" width="80" height="40" fill="none" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <line x1="80" y1="160" x2="520" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <line x1="120" y1="120" x2="120" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <line x1="240" y1="120" x2="240" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <line x1="360" y1="120" x2="360" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <line x1="480" y1="120" x2="480" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <rect x="80" y="200" width="440" height="120" fill="none" stroke="var(--wk-ink)" strokeWidth="1.2" />
              <text x="120" y="105" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9" fill="var(--wk-ink-soft)" textAnchor="middle">CB-01</text>
              <text x="240" y="105" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9" fill="var(--wk-ink-soft)" textAnchor="middle">CB-02</text>
              <text x="360" y="105" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9" fill="var(--wk-ink-soft)" textAnchor="middle">CB-03</text>
              <text x="480" y="105" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9" fill="var(--wk-ink-soft)" textAnchor="middle">CB-04</text>
              <text x="300" y="270" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="11" fill="var(--wk-ink-soft)" textAnchor="middle">PDU-04 · breaker schedule</text>
            </svg>

            {/* pins */}
            {[
              [120, 90, 'warn', '!'],
              [360, 95, 'ai', '✦'],
              [240, 220, 'primary', '3'],
              [480, 105, 'ok', '✓'],
            ].map(([x, y, c, ch], i) => (
              <div key={i} style={{
                position: 'absolute', left: `${(x / 600) * 100}%`, top: `${(y / 380) * 100}%`,
                width: 22, height: 22, borderRadius: 11,
                background: `var(--wk-${c}-soft)`, border: `1.6px solid var(--wk-${c})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 12, color: `var(--wk-${c})`,
                transform: 'translate(-50%, -50%)',
              }}>{ch}</div>
            ))}

            <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
              <WPill tone="ink" seed="z1">−</WPill>
              <WPill tone="ink" seed="z2">100%</WPill>
              <WPill tone="ink" seed="z3">+</WPill>
            </div>
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <WPill tone="primary" filled seed="layer">layers: pins · issues · refs</WPill>
            </div>
          </WBox>
        </div>

        {/* right rail — linked items */}
        <div style={{ borderLeft: '1.5px solid var(--wk-line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Pins', 'Versions', 'Linked', 'AI'].map((t, i) => (
              <WPill key={i} tone={i === 0 ? 'primary' : 'ink'} filled={i === 0} seed={`tb${i}`}>{t}</WPill>
            ))}
          </div>
          <WT size={11} color="ink-soft">4 pins on this sheet · 1 critical</WT>
          {[
            ['warn', 'CB-01 label mismatch vs PDU panel', 'issue · PDU-04 · 4d open', '!'],
            ['ai', 'CB-03 rating differs from spec 26-24', 'AI flag · auto-detected · review', '✦'],
            ['primary', 'Item #7 mech checklist refs this CB', 'AHU-007 · pre-functional', '3'],
            ['ok', 'CB-04 verified during megger test', 'closed · UPS-12 · 2d ago', '✓'],
          ].map((p, i) => (
            <WBox key={i} seed={`pin${i}`} style={{ padding: 10, borderColor: `var(--wk-${p[0]})`, background: `var(--wk-${p[0]}-soft)` }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, border: `1.4px solid var(--wk-${p[0]})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: `var(--wk-${p[0]})`, fontFamily: 'Geist Mono, ui-monospace, monospace' }}>{p[3]}</span>
                <WT size={12}>{p[1]}</WT>
              </div>
              <WT size={11} color="ink-soft" style={{ marginTop: 4 }}>{p[2]}</WT>
            </WBox>
          ))}
          <WBox seed="ai-doc" style={{ padding: 10, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)', borderStyle: 'dashed' }}>
            <WAI compact>this sheet · in plain english</WAI>
            <WT size={11} style={{ marginTop: 4 }}>Schedule of 4 mains breakers feeding racks B-001 → B-040. Rev 03 added CB-04 (spare → live).</WT>
          </WBox>
        </div>
      </div>
    </WFrame>
  );
}

function DocumentsV3() {
  // V3 — Version diff side-by-side
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Documents', 'E-302', 'compare']} role="PM" />
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <WH size={22}>E-302 · Breaker schedule</WH>
          <div style={{ display: 'flex', gap: 6 }}>
            <WPill tone="ink" seed="v1">rev 02 · Oct 11</WPill>
            <WT size={14} color="ink-soft">→</WT>
            <WPill tone="primary" filled seed="v2">rev 03 · Nov 04 (current)</WPill>
            <WPill tone="ai" filled seed="ai">✦ explain changes</WPill>
          </div>
        </div>

        {/* AI summary of diff */}
        <WBox seed="diff-ai" style={{ padding: 10, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
          <WT size={13}><b>3 substantive changes:</b> CB-04 promoted from spare to live (feeds racks B-031→B-040) · CB-02 rating raised 225A → 250A · note added re: lockout/tagout procedure. <span style={{ color: 'var(--wk-warn)' }}>6 checklist items + 1 RFI reference the prior rev.</span></WT>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <WPill tone="ai" filled seed="r1">re-link items</WPill>
            <WPill tone="primary" seed="r2">notify field crews</WPill>
          </div>
        </WBox>

        {/* side-by-side */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0 }}>
          {[
            ['rev 02', 'ink-soft', false],
            ['rev 03', 'primary', true],
          ].map(([rev, c, current], i) => (
            <WBox key={i} seed={`r${i}`} style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1.4px solid var(--wk-line)', display: 'flex', justifyContent: 'space-between', background: 'var(--wk-panel)' }}>
                <WT size={12}><b>{rev}</b> · sheet 4 of 9</WT>
                <WT size={11} color={c}>{current ? 'current' : 'superseded'}</WT>
              </div>
              <div style={{ flex: 1, position: 'relative', padding: 12 }}>
                <WBox seed={`dwg${i}`} style={{ width: '100%', height: '100%', padding: 0, position: 'relative' }}>
                  <WDots style={{ position: 'absolute', inset: 0 }} />
                  <svg viewBox="0 0 600 380" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    <rect x="40" y="40" width="520" height="300" fill="none" stroke="var(--wk-ink)" strokeWidth="1.5" />
                    {[0, 1, 2, 3].map(j => (
                      <g key={j}>
                        <rect x={80 + j * 120} y="80" width="80" height="40" fill={
                          (i === 1 && j === 3) ? 'var(--wk-ok-soft)' :
                          (i === 1 && j === 1) ? 'var(--wk-ai-soft)' :
                          (i === 0 && j === 3) ? 'var(--wk-warn-soft)' :
                          'none'
                        } stroke="var(--wk-ink)" strokeWidth="1.2" />
                        <text x={120 + j * 120} y="105" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="9" fill="var(--wk-ink-soft)" textAnchor="middle">{
                          (i === 0 && j === 3) ? 'CB-04 (spare)' : `CB-0${j + 1}`
                        }</text>
                        {i === 1 && j === 1 ? <text x={240} y="74" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="11" fill="var(--wk-ai)" textAnchor="middle">250A</text> : null}
                        {i === 0 && j === 1 ? <text x={240} y="74" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="11" fill="var(--wk-ink-soft)" textAnchor="middle">225A</text> : null}
                      </g>
                    ))}
                    <line x1="80" y1="160" x2="520" y2="160" stroke="var(--wk-ink)" strokeWidth="1.2" />
                  </svg>
                </WBox>
              </div>
            </WBox>
          ))}
        </div>

        {/* impact table */}
        <WBox seed="impact" style={{ padding: 10 }}>
          <WT size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Impact · items referencing the prior rev</WT>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 80px', gap: 4, padding: '4px 0', marginTop: 4 }}>
            {[
              ['Mech pre-func #14', 'AHU-007', 'CxA · BL', 're-link'],
              ['Elec functional #3', 'PDU-04', 'CxA · AC', 're-link'],
              ['RFI-031 PDU-04 grounding', 'open · 4d', 'PM · KP', 'notify'],
              ['Issue #082 · CB labels', 'critical', 'CxA · AC', 'attach diff'],
            ].map((r, i) => (
              <React.Fragment key={i}>
                <WT size={12}>{r[0]}</WT>
                <WT size={12} color="ink-soft">{r[1]}</WT>
                <WT size={11} color="ink-soft">{r[2]}</WT>
                <WPill tone="ai" filled seed={`imp${i}`}>{r[3]}</WPill>
              </React.Fragment>
            ))}
          </div>
        </WBox>
      </div>
    </WFrame>
  );
}

Object.assign(window, { DocumentsV1, DocumentsV2, DocumentsV3 });
