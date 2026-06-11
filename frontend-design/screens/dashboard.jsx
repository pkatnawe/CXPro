/* screens/dashboard.jsx — 3 dashboard wireframe variations */

function DashboardV1() {
  // V1 — Command Center: Linear-style multi-pane, AI summary banner
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12 · Hudson Valley', 'Project Overview']} role="CxA">
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
        <WSideNav active="Dashboard" items={[
          '§ project', 'Dashboard', 'Schedule', 'Team',
          '§ work', 'Assets', 'Checklists', 'Tests', 'Issues',
          '§ knowledge', 'Documents', 'Reports', 'Audit log',
        ]} />

        <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {/* AI summary banner */}
          <WBox seed="ai-banner" style={{ padding: 14, background: 'var(--wk-ai-soft)', borderColor: 'var(--wk-ai)', borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WSectionLabel tone="ai" dot>morning brief · wed, may 28</WSectionLabel>
                <WT size={11} color="ink-faint">generated 7 min ago · sources: 4 checklists, 12 issues, sched</WT>
              </div>
              <WT size={12} color="primary">regenerate ↻</WT>
            </div>
            <WT size={14}>3 AHU functional tests blocked on PDU-04 BMS points · 2 new issues need CxA sign-off · electrical load validation slipped 1 day, recovery plan attached.</WT>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <WPill tone="ai" filled seed="a1">→ open blockers</WPill>
              <WPill tone="ai" filled seed="a2">→ approve 2 issues</WPill>
              <WPill tone="ai" filled seed="a3">→ draft owner update</WPill>
            </div>
          </WBox>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              ['Assets', '847', '+ 12 wk'],
              ['Checklists', '62%', '1,204 / 1,938'],
              ['Issues open', '38', '6 critical'],
              ['Tests pass', '94%', 'last 30d'],
              ['Forecast', 'Aug 14', '+2d vs plan'],
            ].map(([k, v, sub], i) => (
              <WBox key={i} seed={`kpi${i}`} style={{ padding: 10 }}>
                <WT size={11} color="ink-soft">{k}</WT>
                <WH size={26} style={{ marginTop: 2 }}>{v}</WH>
                <WT size={11} color="ink-soft" style={{ marginTop: 2 }}>{sub}</WT>
              </WBox>
            ))}
          </div>

          {/* main columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
            <WBox seed="curve" style={{ padding: 12, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <WH size={16}>Progress curve</WH>
                <WT size={11} color="ink-soft">planned vs actual · by system</WT>
              </div>
              <div style={{ flex: 1, position: 'relative', marginTop: 8 }}>
                <WSparkline points={[6, 9, 12, 18, 24, 31, 40, 48, 55, 62, 64]} width={520} height={140} color="primary" />
                <div style={{ position: 'absolute', top: 10, right: 6 }}>
                  <WSparkline points={[6, 8, 10, 15, 22, 30, 38, 45, 50, 55, 58]} width={520} height={120} color="ink-soft" fill={false} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <WT size={11} color="primary">— actual 62%</WT>
                <WT size={11} color="ink-soft">— planned 64%</WT>
              </div>
            </WBox>

            <WBox seed="systems" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WH size={16}>Systems by readiness</WH>
              {[
                ['Mechanical · AHU + chilled water', 78, 'primary'],
                ['Electrical · PDU + UPS', 54, 'ai'],
                ['Controls · BMS integration', 41, 'warn'],
                ['Fire / life safety', 86, 'ok'],
                ['Security · access + CCTV', 22, 'warn'],
              ].map(([n, v, c], i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <WT size={12}>{n}</WT>
                    <WT size={12} color={c}>{v}%</WT>
                  </div>
                  <WBar value={v} color={c} style={{ marginTop: 2 }} />
                </div>
              ))}
            </WBox>
          </div>

          {/* bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, height: 170 }}>
            <WBox seed="issues" style={{ padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <WH size={14}>Critical issues</WH>
                <WT size={11} color="warn">6</WT>
              </div>
              {['PDU-04 ground fault sensor', 'CRAH-12 leak in return', 'BMS↔PLC alarm flood', 'AHU-07 VFD comm loss'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px dashed var(--wk-line)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--wk-warn)' }} />
                  <WT size={12}>{t}</WT>
                </div>
              ))}
            </WBox>
            <WBox seed="agenda" style={{ padding: 10 }}>
              <WH size={14}>Today on site</WH>
              {[['08:30', 'AHU-07 functional w/ Acme Mech'], ['11:00', 'PDU-04 megger · Apex Elec'], ['14:00', 'CxA walkdown · Hall B'], ['16:30', 'Owner sync']].map(([t, l], i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px dashed var(--wk-line)' }}>
                  <WT size={12} color="ink-soft" style={{ width: 38 }}>{t}</WT>
                  <WT size={12}>{l}</WT>
                </div>
              ))}
            </WBox>
            <WBox seed="ai-actions" style={{ padding: 10, borderColor: 'var(--wk-ai)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <WIcon glyph="✦" color="ai" />
                <WH size={14}>AI suggestions</WH>
              </div>
              <WT size={11} color="ink-soft" style={{ marginBottom: 4 }}>workflows offered for you</WT>
              {['Draft daily report · stakeholders', 'Reschedule blocked AHU tests', 'Bundle 3 similar issues → 1 RFI', 'Pull all PDU-04 history'].map((t, i) => (
                <div key={i} style={{ padding: '4px 0', borderBottom: '1px dashed var(--wk-line)', display: 'flex', justifyContent: 'space-between' }}>
                  <WT size={12}>{t}</WT>
                  <WT size={12} color="ai">run →</WT>
                </div>
              ))}
            </WBox>
          </div>
        </div>
      </div>

      <WNote style={{ position: 'absolute', top: 88, right: -110, width: 100 }} arrow="left">
        AI brief = always-on; never blocks the UI
      </WNote>
    </WFrame>
  );
}

function DashboardV2() {
  // V2 — Physical bay map first. Datacenter floor plan is the hero.
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12 · Hudson Valley', 'Bay map']} role="Field Tech">
        <WPill tone="primary" seed="role-2">role: field</WPill>
      </WHeader>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: 200, padding: 14, borderRight: '1.5px solid var(--wk-line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <WT size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Filter map by</WT>
          {['System · all', 'Phase · Pre-functional', 'Discipline · Mech / Elec', 'Status · blocked', 'Owner · me'].map((f, i) => (
            <WBox key={i} seed={`f${i}`} style={{ padding: '6px 8px' }}>
              <WT size={12}>{f}</WT>
            </WBox>
          ))}
          <div style={{ marginTop: 12 }}>
            <WAI compact>describe what you want highlighted...</WAI>
          </div>
          <div style={{ flex: 1 }} />
          <WBox seed="legend" style={{ padding: 8 }}>
            <WT size={11} color="ink-soft">Legend</WT>
            {[['ok', 'commissioned'], ['primary', 'in progress'], ['warn', 'blocked'], ['ink-soft', 'not started']].map(([c, l], i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                <span style={{ width: 10, height: 10, background: `var(--wk-${c}-soft)`, border: `1.4px solid var(--wk-${c})`, borderRadius: 2 }} />
                <WT size={11}>{l}</WT>
              </div>
            ))}
          </WBox>
        </div>

        {/* Map */}
        <div style={{ flex: 1, padding: 16, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <WH size={20}>Hall B · Bay map</WH>
            <div style={{ display: 'flex', gap: 8 }}>
              <WPill tone="ink" seed="b1">Hall A</WPill>
              <WPill tone="primary" filled seed="b2">Hall B</WPill>
              <WPill tone="ink" seed="b3">Hall C</WPill>
            </div>
          </div>

          <WBox seed="map" style={{ flex: 1, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div className="wk-blueprint fine" style={{ position: 'absolute', inset: 0, opacity: 0.45 }} />
            <WDots style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
            {/* rack rows */}
            <div style={{ position: 'relative', display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', gap: 16, height: '100%' }}>
              {[0, 1, 2, 3, 4].map(row => (
                <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4 }}>
                  {Array.from({ length: 14 }).map((_, col) => {
                    const states = ['ok', 'ok', 'primary', 'primary', 'warn', 'ink-soft', 'ok', 'primary'];
                    const s = states[(row * 5 + col * 3) % states.length];
                    return (
                      <div key={col} style={{
                        background: `var(--wk-${s}-soft)`,
                        border: `1.4px solid var(--wk-${s})`,
                        borderRadius: 3,
                        position: 'relative',
                      }}>
                        {col === 0 ? <WT size={9} color="ink-soft" style={{ position: 'absolute', left: -18, top: '50%' }}>R{row + 1}</WT> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Selected callout */}
            <div style={{ position: 'absolute', top: '38%', left: '36%', pointerEvents: 'none' }}>
              <WBox seed="callout" style={{ padding: 8, background: 'var(--wk-panel)', minWidth: 180 }}>
                <WT size={11} color="ink-soft">R3 · C5</WT>
                <WH size={15}>PDU-04 → rack B-038</WH>
                <WT size={12}>Load validation · blocked</WT>
                <WPill tone="warn" filled seed="wpill" style={{ marginTop: 4 }}>2 open issues</WPill>
              </WBox>
            </div>
          </WBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <WBox seed="m1" style={{ padding: 8 }}><WT size={11} color="ink-soft">Racks energized</WT><WH size={20}>312 / 480</WH></WBox>
            <WBox seed="m2" style={{ padding: 8 }}><WT size={11} color="ink-soft">PDUs commissioned</WT><WH size={20}>14 / 24</WH></WBox>
            <WBox seed="m3" style={{ padding: 8 }}><WT size={11} color="ink-soft">CRAH on line</WT><WH size={20}>9 / 12</WH></WBox>
            <WBox seed="m4" style={{ padding: 8 }}><WT size={11} color="ink-soft">Blocked items</WT><WH size={20} style={{ color: 'var(--wk-warn)' }}>8</WH></WBox>
          </div>
        </div>

        {/* AI right rail */}
        <div style={{ width: 240, padding: 14, borderLeft: '1.5px solid var(--wk-line)', background: 'var(--wk-panel)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WIcon glyph="✦" color="ai" />
            <WH size={15}>Copilot</WH>
          </div>
          <WT size={11} color="ink-soft">map-aware · knows selection</WT>
          <WBox seed="chat1" style={{ padding: 8, background: 'var(--wk-ai-soft)', borderColor: 'var(--wk-ai)' }}>
            <WT size={12}>What's blocking the highlighted racks?</WT>
          </WBox>
          <WBox seed="chat2" style={{ padding: 8 }}>
            <WT size={12}>2 issues on PDU-04 (gnd fault sensor, breaker label mismatch). Both block 16 racks in row 3. Want me to draft the RFI?</WT>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <WPill tone="ai" filled seed="c1">draft RFI</WPill>
              <WPill tone="ai" seed="c2">show history</WPill>
            </div>
          </WBox>
          <div style={{ flex: 1 }} />
          <WBox seed="prompt" style={{ padding: '8px 10px' }}>
            <WT size={12} color="ink-soft">ask · or run a workflow...</WT>
          </WBox>
        </div>
      </div>
    </WFrame>
  );
}

function DashboardV3() {
  // V3 — Prompt-first / agentic. Big input at top, structured cards generated.
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12 · Hudson Valley']} role="Owner Rep" />

      <div style={{ flex: 1, padding: '24px 60px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        <div>
          <WH size={28}>Good morning, Jamie.</WH>
          <WT size={14} color="ink-soft" style={{ marginTop: 2 }}>You have 3 things to approve before 11am · DC-12 commissioning</WT>
        </div>

        {/* Big AI prompt */}
        <WBox seed="hero-prompt" style={{ padding: 18, borderColor: 'var(--wk-ai)', borderStyle: 'dashed', background: 'var(--wk-ai-soft)', boxShadow: 'var(--ui-shadow-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <WIcon glyph="✦" color="ai" size={20} />
            <WH size={18}>What do you need today?</WH>
          </div>
          <WBox seed="input" style={{ padding: 10, background: 'var(--wk-panel)', borderColor: 'var(--wk-ai)' }}>
            <WT size={13} color="ink-soft">"Show me everything blocking go-live by Friday and draft a customer email about scope"</WT>
          </WBox>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['📋 build a report', '📊 analyze trends', '✉ draft a comms', '🔍 find asset', '🧾 review issues', '📅 reschedule'].map((c, i) => (
              <WPill key={i} tone="ai" seed={`q${i}`}>{c}</WPill>
            ))}
          </div>
        </WBox>

        {/* Pinned answers / cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <WSectionLabel tone="primary" dot>generated for you · today</WSectionLabel>
            <WT size={11} color="ink-faint" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }}>updated 2 min ago</WT>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <WBox seed="card1" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <WAI compact>cost-to-finish forecast</WAI>
                <WT size={11} color="ink-soft">pin · share · regenerate</WT>
              </div>
              <WH size={22} style={{ marginTop: 6 }}>$1.42M remaining</WH>
              <WT size={12} color="ink-soft">vs $1.31M plan · variance driven by AHU rework (+$94k)</WT>
              <WSparkline points={[40, 35, 32, 30, 26, 24, 20, 16, 14, 12]} width={300} height={50} color="primary" />
            </WBox>

            <WBox seed="card2" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <WAI compact>3 things needing approval</WAI>
                <WT size={11} color="ink-soft">2 from CxA · 1 from PM</WT>
              </div>
              {['Change order #042 — controls labor', 'Substitution: VFD model B → C', 'Add scope: CCTV row 5'].map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed var(--wk-line)' }}>
                  <WT size={12}>{t}</WT>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <WPill tone="ok" seed={`a${i}`}>approve</WPill>
                    <WPill tone="ink-soft" seed={`b${i}`}>skip</WPill>
                  </div>
                </div>
              ))}
            </WBox>

            <WBox seed="card3" style={{ padding: 12, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <WAI compact>risk to go-live: aug 14</WAI>
                <WT size={11} color="ink-soft">model · ARIMA + manual factors</WT>
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 6, alignItems: 'center' }}>
                <WDonut value={72} size={70} color="warn" label="confidence" />
                <div style={{ flex: 1 }}>
                  <WT size={13}>Forecast: <b style={{ color: 'var(--wk-warn)' }}>Aug 17 (+3d)</b>. Top drivers: BMS integration scope creep, PDU-04 rework. Mitigations: parallel testing of zones 3+4, vendor escalation on controls.</WT>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <WPill tone="primary" filled seed="dr1">view drivers</WPill>
                    <WPill tone="ai" filled seed="dr2">run "what if?" </WPill>
                    <WPill tone="ai" seed="dr3">draft owner update</WPill>
                  </div>
                </div>
              </div>
            </WBox>
          </div>
        </div>
      </div>

      <WNote style={{ position: 'absolute', top: 96, left: 24, width: 130 }} arrow="right">
        every screen starts blank-ish. AI fills it from the prompt.
      </WNote>
    </WFrame>
  );
}

Object.assign(window, { DashboardV1, DashboardV2, DashboardV3 });
