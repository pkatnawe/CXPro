/* screens/checklists.jsx — 3 checklist wireframe variations */

function ChecklistsV1() {
  // V1 — Mobile/tablet field execution: one item at a time, big targets
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--wk-bg)', padding: 20 }}>
      <div style={{ width: 420, height: 720, border: '2px solid var(--wk-ink)', borderRadius: 30, padding: 10, background: 'var(--wk-panel)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 14px' }}>
          <WT size={11} color="ink-soft">9:41 AM</WT>
          <WT size={11} color="ink-soft">●●●●● 100%</WT>
        </div>
        {/* header */}
        <div style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <WT size={12} color="ink-soft">← AHU-007</WT>
          <WT size={12} color="primary">save · sync</WT>
        </div>
        <div style={{ padding: '0 14px' }}>
          <WT size={11} color="ink-soft">Mechanical pre-functional · A-ITR</WT>
          <WH size={20}>Item 7 of 18</WH>
          <WBar value={(7 / 18) * 100} color="primary" style={{ marginTop: 6 }} />
        </div>

        {/* current item */}
        <WBox seed="item" style={{ margin: '0 14px', padding: 14, flex: 1 }}>
          <WT size={11} color="ink-soft">Section: Installation</WT>
          <WH size={22} weight={500} style={{ marginTop: 6, lineHeight: 1.25 }}>Verify all shipping stops, bracing and packing have been removed from the AHU.</WH>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {['Pass', 'Fail', 'N/A'].map((s, i) => (
              <WBox key={i} seed={`opt${i}`} style={{
                padding: 14,
                borderColor: i === 0 ? 'var(--wk-ok)' : 'var(--wk-line)',
                background: i === 0 ? 'var(--wk-ok-soft)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `1.6px solid var(--wk-${i === 0 ? 'ok' : 'line'})`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{i === 0 ? <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--wk-ok)' }} /> : null}</span>
                <WT size={16}>{s}</WT>
              </WBox>
            ))}
          </div>

          <WBox seed="notes" style={{ padding: 10, marginTop: 12, borderStyle: 'dashed' }}>
            <WT size={11} color="ink-soft">Notes · photos · voice</WT>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <WPill tone="ink" seed="ph">📷 photo</WPill>
              <WPill tone="ink" seed="vo">🎙 voice→text</WPill>
              <WPill tone="ai" filled seed="ai">✦ auto-fill</WPill>
            </div>
          </WBox>
        </WBox>

        {/* AI hint */}
        <WBox seed="hint" style={{ margin: '0 14px', padding: 8, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)', borderStyle: 'dashed' }}>
          <WT size={11} color="ai">✦ Last 3 of these passed without notes — tap to bulk-pass remaining inspection items?</WT>
        </WBox>

        {/* nav */}
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
          <WBox seed="prev" style={{ padding: '10px 14px', flex: 1, textAlign: 'center' }}><WT size={14}>← prev</WT></WBox>
          <WBox seed="next" style={{ padding: '10px 14px', flex: 2, textAlign: 'center', borderColor: 'var(--wk-primary)', background: 'var(--wk-primary-soft)' }}>
            <WT size={14} color="primary"><b>next →</b></WT>
          </WBox>
        </div>
      </div>

      <div style={{ marginLeft: 30, width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <WNote tilt={-2}>Field-first. Big tap targets.<br />Offline by default; syncs on signal.</WNote>
        <WBox seed="info" style={{ padding: 10 }}>
          <WT size={11} color="ink-soft">scope</WT>
          <WT size={13}>Tablet & phone. CxA / Field Tech persona. Photo + voice + signature capture, offline queue.</WT>
        </WBox>
        <WBox seed="info2" style={{ padding: 10, borderColor: 'var(--wk-ai)' }}>
          <WT size={11} color="ai">✦ AI on-device</WT>
          <WT size={13}>Auto-fill from prior identical items · voice → structured notes · photo flag if blurry/off-target.</WT>
        </WBox>
      </div>
    </WFrame>
  );
}

function ChecklistsV2() {
  // V2 — Desktop spreadsheet style: dense grid, formulas, bulk actions
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'Checklists', 'AHU-007 · Mech pre-func']} role="CxA" />
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* toolbar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['↺', '⎘', '↷', '⎯ row', '⎯ col', '∑ formula', 'fill ▾'].map((t, i) => (
            <WPill key={i} tone="ink" seed={`tb${i}`}>{t}</WPill>
          ))}
          <div style={{ flex: 1 }} />
          <WPill tone="ai" filled seed="ai">✦ generate items from spec</WPill>
          <WPill tone="primary" filled seed="sign">sign + lock</WPill>
        </div>

        {/* progress strip */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <WBar value={68} color="primary" style={{ flex: 1, height: 8 }} />
          <WT size={12} color="ink-soft">12 / 18 complete · 1 fail · 2 N/A</WT>
        </div>

        {/* sheet */}
        <WBox seed="sheet" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {/* col headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1.8fr 70px 70px 70px 1.2fr 90px 90px', borderBottom: '1.5px solid var(--wk-line)', background: 'var(--wk-panel)', padding: '6px 8px' }}>
            {['#', 'Ref', 'Description', 'Pass', 'Fail', 'N/A', 'Comments', 'Photo', 'Signed by'].map((h, i) => (
              <WT key={i} size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</WT>
            ))}
          </div>
          {[
            [1, 'M-01', 'Shipping stops, bracing & packing removed', '✓', '', '', 'Observed clean', 'IMG_2042', 'BL'],
            [2, 'M-01', 'Name plate / tag readable and correct', '', '✓', '', 'Tag faded — replacement requested', 'IMG_2043', 'BL'],
            [3, 'M-02', 'Asset location matches drawing M-204', '✓', '', '', '—', '—', 'BL'],
            [4, 'M-02', 'Installation per spec; bolts tight', '✓', '', '', 'Torqued to 45 ft-lb', '—', 'BL'],
            [5, 'M-03', 'Access clearance per code (3 ft front)', '✓', '', '', '—', '—', 'BL'],
            [6, 'M-03', 'Drain piping installed & trapped', '', '', '✓', 'No drain req. this unit', '—', 'BL'],
            [7, 'M-04', 'Filter racks installed; correct rating MERV-13', '⋯', '', '', '...in progress', '—', '—'],
            [8, 'M-04', 'Belts aligned & tensioned', '', '', '', '', '', ''],
            [9, 'M-05', 'Damper actuators wired & stroked', '', '', '', '', '', ''],
            [10, 'M-05', 'Smoke detector mounted in supply duct', '', '', '', '', '', ''],
            [11, 'M-06', 'Coil clean; no shipping debris', '', '', '', '', '', ''],
          ].map((row, i) => {
            const failed = row[4] === '✓';
            const passed = row[3] === '✓';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 60px 1.8fr 70px 70px 70px 1.2fr 90px 90px',
                padding: '5px 8px', borderBottom: '1px dashed var(--wk-line)',
                background: failed ? 'var(--wk-warn-soft)' : (i === 6 ? 'var(--wk-primary-soft)' : 'transparent'),
                alignItems: 'center',
              }}>
                <WT size={11} color="ink-soft">{row[0]}</WT>
                <WT size={11} color="ink-soft">{row[1]}</WT>
                <WT size={12}>{row[2]}</WT>
                <WT size={14} color={passed ? 'ok' : 'ink-soft'} style={{ textAlign: 'center' }}>{row[3]}</WT>
                <WT size={14} color={failed ? 'warn' : 'ink-soft'} style={{ textAlign: 'center' }}>{row[4]}</WT>
                <WT size={14} color="ink-soft" style={{ textAlign: 'center' }}>{row[5]}</WT>
                <WT size={11} color="ink-soft">{row[6]}</WT>
                <WT size={11} color={row[7] && row[7] !== '—' ? 'primary' : 'ink-soft'}>{row[7]}</WT>
                <WT size={11}>{row[8]}</WT>
              </div>
            );
          })}
        </WBox>

        {/* footer formula bar */}
        <WBox seed="formula" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <WT size={11} color="ink-soft" style={{ fontFamily: 'ui-monospace, monospace' }}>fx</WT>
          <WT size={12} color="ink-soft" style={{ fontFamily: 'ui-monospace, monospace' }}>=COUNTIF(Pass:Pass, "✓") / (rows - COUNTIF(N/A:N/A, "✓")) → 68%</WT>
          <div style={{ flex: 1 }} />
          <WAI compact>generate report from this sheet</WAI>
        </WBox>
      </div>
      <WNote arrow="down" style={{ position: 'absolute', bottom: 100, left: 50, width: 160 }}>
        spreadsheet familiarity. formulas. CSV/Excel import. CxAs love this.
      </WNote>
    </WFrame>
  );
}

function ChecklistsV3() {
  // V3 — AI-guided conversational wizard
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wk-bg)' }}>
      <WHeader crumbs={['DC-12', 'AHU-007', 'Pre-functional · guided']} role="Field Tech" />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 280px', minHeight: 0 }}>
        {/* progress sidebar */}
        <div style={{ borderRight: '1.5px solid var(--wk-line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
          <WT size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Sections</WT>
          {[
            ['Installation', 6, 6, 'ok'],
            ['Mechanical', 4, 5, 'primary'],
            ['Electrical', 1, 4, 'primary'],
            ['Controls', 0, 2, 'ink-soft'],
            ['Cleanup & sign', 0, 1, 'ink-soft'],
          ].map(([n, done, tot, c], i) => (
            <div key={i} style={{
              padding: '8px 10px',
              border: `1.4px solid var(--wk-${c})`,
              borderRadius: wkRadius(`sec${i}`),
              background: i === 1 ? 'var(--wk-primary-soft)' : 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <WT size={13}>{n}</WT>
              <WT size={12} color={c}>{done}/{tot}</WT>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: 10, borderTop: '1.5px dashed var(--wk-line)' }}>
            <WT size={11} color="ink-soft">est. remaining</WT>
            <WH size={22}>18 min</WH>
            <WT size={11} color="ink-soft">at your current pace · 6 items left</WT>
          </div>
        </div>

        {/* conversation column */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          {/* AI prompt */}
          <div style={{ display: 'flex', gap: 10 }}>
            <WAvatar initials="✦" size={26} seed="ai" />
            <div style={{ flex: 1 }}>
              <WT size={11} color="ai">CX Pro · guide</WT>
              <WBox seed="aiq" style={{ padding: 12, marginTop: 4, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
                <WT size={14}>Filter racks installed — are they MERV-13?</WT>
                <WT size={11} color="ink-soft" style={{ marginTop: 6 }}>refs · spec 23-08-00 §2.3 · M-04 item #7</WT>
              </WBox>
            </div>
          </div>

          {/* user response */}
          <div style={{ display: 'flex', gap: 10, flexDirection: 'row-reverse' }}>
            <WAvatar initials="BL" size={26} seed="bl" />
            <div style={{ flex: 1, textAlign: 'right' }}>
              <WBox seed="usr" style={{ padding: 12, marginTop: 4, display: 'inline-block', textAlign: 'left', maxWidth: '80%' }}>
                <WT size={13}>Yes — MERV-13. Filter manufacturer label shows it. Photo attached.</WT>
                <div style={{ marginTop: 6 }}>
                  <WBox seed="photo" style={{ width: 120, height: 70, background: 'var(--wk-line)', borderStyle: 'dashed' }}>
                    <WT size={10} color="ink-soft" style={{ textAlign: 'center', marginTop: 26 }}>IMG_2044.jpg</WT>
                  </WBox>
                </div>
              </WBox>
            </div>
          </div>

          {/* AI confirms + next */}
          <div style={{ display: 'flex', gap: 10 }}>
            <WAvatar initials="✦" size={26} seed="ai2" />
            <div style={{ flex: 1 }}>
              <WBox seed="aiack" style={{ padding: 12, marginTop: 4, borderColor: 'var(--wk-ai)', background: 'var(--wk-ai-soft)' }}>
                <WT size={13}>✓ confirmed MERV-13 from photo OCR. Pass logged for items #7 and #8 (related). Next:</WT>
                <WBox seed="aiq2" style={{ padding: 10, marginTop: 8, background: 'var(--wk-panel)' }}>
                  <WT size={14}><b>Belts aligned and tensioned?</b></WT>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {['Yes — pass', 'No — fail (log issue)', 'N/A', 'Need to check', 'Show me how'].map((o, i) => (
                      <WPill key={i} tone={i === 0 ? 'ok' : (i === 1 ? 'warn' : 'ink')} seed={`o${i}`}>{o}</WPill>
                    ))}
                  </div>
                </WBox>
              </WBox>
            </div>
          </div>

          {/* input bar */}
          <div style={{ marginTop: 'auto' }}>
            <WBox seed="input" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <WT size={13} color="ink-soft">say or type your answer...</WT>
              <div style={{ flex: 1 }} />
              <WPill tone="ink" seed="att">📷</WPill>
              <WPill tone="ink" seed="mic">🎙</WPill>
              <WPill tone="primary" filled seed="send">send</WPill>
            </WBox>
          </div>
        </div>

        {/* context rail */}
        <div style={{ borderLeft: '1.5px solid var(--wk-line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          <WT size={11} color="ink-soft" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Context</WT>
          <WBox seed="ctx1" style={{ padding: 10 }}>
            <WT size={11} color="ink-soft">Drawing</WT>
            <WT size={12}><b>M-204 · AHU-007 plan</b></WT>
            <WBox seed="dwg" style={{ height: 100, marginTop: 6 }}><WDots style={{ width: '100%', height: '100%' }} /></WBox>
            <WT size={11} color="primary" style={{ marginTop: 4 }}>open in viewer →</WT>
          </WBox>
          <WBox seed="ctx2" style={{ padding: 10 }}>
            <WT size={11} color="ink-soft">Spec excerpt · 23-08-00 §2.3</WT>
            <WT size={12} style={{ marginTop: 4 }}>"Filters shall meet MERV-13 minimum. Verify rated face velocity ≤ 500 fpm."</WT>
          </WBox>
          <WBox seed="ctx3" style={{ padding: 10 }}>
            <WT size={11} color="ink-soft">Similar items closed</WT>
            <WT size={12}>AHU-006 · same checklist · 1d ago</WT>
            <WT size={11} color="ai">✦ pattern: 0 fails this section</WT>
          </WBox>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { ChecklistsV1, ChecklistsV2, ChecklistsV3 });
