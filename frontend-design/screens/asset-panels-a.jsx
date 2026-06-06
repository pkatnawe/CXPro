/* screens/asset-panels-a.jsx — tab panels: Overview · Devices · Checklists · Tests
   Each panel root sets flex:1 + minHeight:0 and owns its own scroll. */

const panelScroll = { flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' };

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
function AssetOverview() {
  const parties = [
    ['Owner', 'Hudson DC LLC', 'D. Reyes', 'DR', 'primary'],
    ['CxA (lead)', 'Meridian Cx', 'J. Marsh', 'JM', 'primary'],
    ['GC', 'Turner Build', 'P. Okafor', 'PO', 'ink'],
    ['Mech sub', 'Acme Mechanical', 'B. Lewis', 'BL', 'ink'],
    ['EOR', 'BR+A Engineers', 'S. Vance', 'SV', 'ink'],
  ];
  const submittals = [
    ['23-23.10', 'AHU schedule & cut sheets', 'approved', 'ok'],
    ['23-05.40', 'VFD — ABB ACS580', 'appr. as noted', 'ai'],
    ['23-08.13', 'Coil performance data', 'approved', 'ok'],
    ['23-09.93', 'Sequence of operations', 'pending', 'warn'],
  ];
  const turnover = [
    ['O&M manual', true], ['Warranty certificate', true], ['As-built drawings', false],
    ['Attic stock / spares', false], ['Training (owner)', false], ['Final test reports', false],
  ];
  const milestones = [
    ['Delivered to site', 'May 12', 'done'],
    ['Set & anchored', 'May 19', 'done'],
    ['Pre-functional start', 'May 24', 'done'],
    ['Functional test', 'Jun 04', 'target'],
    ['Integrated systems test', 'Jun 18', 'target'],
    ['Substantial completion', 'Jul 01', 'target'],
  ];
  return (
    <div style={panelScroll}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseTracker />

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14, alignItems: 'start' }}>
          {/* LEFT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nameplate & spec */}
            <ACard seed="spec" label="nameplate & spec data" right={<WBtn variant="ghost" tone="primary" size="sm" icon="⤢">full datasheet</WBtn>}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
                  <AKV k="manufacturer" v="Daikin Applied" />
                  <AKV k="model" v="Vision 042-CW" mono />
                  <AKV k="serial no." v="STX-0042-118" mono />
                  <AKV k="supply airflow" v="28,000 cfm" mono />
                  <AKV k="external SP" v="3.5 in. w.c." mono />
                  <AKV k="motor" v="75 hp · premium eff" />
                  <AKV k="electrical" v="460 V / 3Ø / 92 A" mono />
                  <AKV k="cooling coil" v="CHW · 12-row" />
                  <AKV k="filtration" v="MERV 13 + 14" />
                  <AKV k="op. weight" v="9,840 lb" mono />
                </div>
                <div style={{ width: 150, flexShrink: 0 }}>
                  <div style={{ height: 118, borderRadius: 8, border: '1px dashed var(--ui-line-strong)', background: 'repeating-linear-gradient(45deg, var(--ui-panel-2), var(--ui-panel-2) 7px, var(--ui-panel-3) 7px, var(--ui-panel-3) 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>nameplate photo</WT>
                  </div>
                  <WT size={10.5} mono color="ink-faint" style={{ marginTop: 6, textAlign: 'center' }}>verified · BL · May 24</WT>
                </div>
              </div>
            </ACard>

            {/* Schedule & milestones */}
            <ACard seed="sched" label="schedule & milestones" right={<WT size={11} mono color="ink-soft">on plan · ±0d</WT>}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {milestones.map(([m, d, s], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < milestones.length - 1 ? '1px solid var(--ui-line)' : 'none' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s === 'done' ? 'var(--ui-ok)' : 'var(--ui-panel)', border: `1.5px solid ${s === 'done' ? 'var(--ui-ok)' : 'var(--ui-line-strong)'}`, color: 'var(--ui-on-ok)', fontSize: 10 }}>{s === 'done' ? '✓' : ''}</span>
                    <WT size={13} weight={s === 'done' ? 400 : 500} color={s === 'done' ? 'ink-soft' : 'ink'} style={{ flex: 1 }}>{m}</WT>
                    {s === 'target' ? <WPill tone="primary" size="sm">target</WPill> : null}
                    <WT size={12} mono color="ink-soft">{d}</WT>
                  </div>
                ))}
              </div>
            </ACard>
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AI summary */}
            <WBox seed="ai" style={{ padding: 14, borderColor: 'var(--ui-ai-line)', boxShadow: 'var(--ui-shadow-accent)' }}>
              <WSectionLabel tone="ai" dot>copilot · this asset</WSectionLabel>
              <WT size={13} style={{ marginTop: 10, lineHeight: 1.45 }}>
                AHU-007 is 67% commissioned and on schedule. One blocker: <b style={{ color: 'var(--ui-warn)' }}>COIL-DX</b> refrigerant charge is below spec 23-23. Sequence-of-operations submittal is still <b>pending</b> — it gates functional testing on Jun 4.
              </WT>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <WBtn variant="outline" tone="ai" size="sm" icon="✎">draft RFI</WBtn>
                <WBtn variant="ghost" tone="ai" size="sm">turnover gaps</WBtn>
              </div>
            </WBox>

            {/* Responsible parties */}
            <ACard seed="party" label="responsible parties">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {parties.map(([role, co, person, init, tone], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < parties.length - 1 ? '1px solid var(--ui-line)' : 'none' }}>
                    <WAvatar initials={init} size={28} seed={init + i} />
                    <div style={{ flex: 1 }}>
                      <WT size={12.5} weight={500}>{co}</WT>
                      <WT size={11} color="ink-soft">{person}</WT>
                    </div>
                    <WPill tone={tone === 'primary' ? 'primary' : 'ink'} size="sm">{role}</WPill>
                  </div>
                ))}
              </div>
            </ACard>

            {/* Submittals & approvals */}
            <ACard seed="sub" label="submittals & approvals" tone="primary" right={<WBtn variant="ghost" tone="primary" size="sm">all 7 →</WBtn>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {submittals.map(([num, title, st, tone], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < submittals.length - 1 ? '1px solid var(--ui-line)' : 'none' }}>
                    <WT size={11.5} mono color="ink-soft" style={{ width: 64, flexShrink: 0 }}>{num}</WT>
                    <WT size={12.5} style={{ flex: 1 }}>{title}</WT>
                    <WPill tone={tone} size="sm">{st}</WPill>
                  </div>
                ))}
              </div>
            </ACard>

            {/* Turnover readiness */}
            <ACard seed="turn" label="turnover / O&M readiness" tone="ai" right={<WT size={11} mono color="ai">42%</WT>}>
              <WBar value={42} color="ai" style={{ marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                {turnover.map(([t, done], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--ui-ok)' : 'var(--ui-panel-3)', border: `1px solid ${done ? 'var(--ui-ok)' : 'var(--ui-line-strong)'}`, color: 'var(--ui-on-ok)', fontSize: 10 }}>{done ? '✓' : ''}</span>
                    <WT size={12} color={done ? 'ink' : 'ink-soft'}>{t}</WT>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ui-line)', display: 'flex', justifyContent: 'space-between' }}>
                <AKV k="warranty start" v="at substantial compl." />
                <AKV k="warranty term" v="2 yr parts + labor" />
              </div>
            </ACard>

            {/* Linked drawings & BIM */}
            <ACard seed="dwg" label="linked drawings & location" right={<WBtn variant="ghost" tone="primary" size="sm" icon="⤢">BIM</WBtn>}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {['M-204', 'M-510', 'E-403', 'C-091', 'FA-12'].map((d, i) => (
                  <WPill key={i} tone="ink" seed={d}>{d}</WPill>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 6, background: 'var(--ui-panel-3)', border: '1px solid var(--ui-line)' }}>
                <WIcon glyph="◈" color="primary" />
                <div style={{ flex: 1 }}>
                  <WT size={12.5} weight={500}>Hall B · Level 1 · Mech room 1.04</WT>
                  <WT size={11} mono color="ink-soft">grid C-7 · BIM model v.42</WT>
                </div>
                <WBtn variant="outline" tone="primary" size="sm">locate</WBtn>
              </div>
            </ACard>

            {/* Open issues */}
            <ACard seed="iss" label="open issues · 2" tone="warn" right={<WBtn variant="ghost" tone="warn" size="sm">view all →</WBtn>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['critical', 'COIL-DX refrigerant charge below spec', 'logged 3d ago · BL'], ['minor', 'Filter rack tag faded — replace', 'logged today · BL']].map(([sev, t, m], i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <WLiveDot tone={sev === 'critical' ? 'warn' : 'ink-faint'} size={6} style={{ marginTop: 5 }} />
                    <div style={{ flex: 1 }}>
                      <WT size={12.5} weight={500}>{t}</WT>
                      <WT size={10.5} mono color="ink-faint" style={{ marginTop: 2 }}>{sev} · {m}</WT>
                    </div>
                  </div>
                ))}
              </div>
            </ACard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DEVICES · sub-assets (refined)
// ════════════════════════════════════════════════════════════════════════════
function AssetDevices() {
  const rows = [
    ['DMP-01', 'Outside air damper', 'Damper', 'Belimo · F6...', 'commissioned', 'func', '5/5', 0],
    ['DMP-02', 'Mixed air damper', 'Damper', 'Belimo · F6...', 'commissioned', 'func', '5/5', 0],
    ['FIL-01', 'Pre-filter rack', 'Filter', 'AAF · MERV-13', 'commissioned', 'func', '—', 0],
    ['FIL-02', 'Final filter rack', 'Filter', 'AAF · MERV-14', 'in progress', 'pre-func', '—', 0],
    ['COIL-CHW', 'Chilled water coil', 'Coil', 'Daikin · 12-row', 'in progress', 'pre-func', '8/12', 0],
    ['COIL-DX', 'DX cooling coil', 'Coil', 'Trane · DX-A', 'blocked', 'pre-func', '2/10', 2],
    ['FAN-SF1', 'Supply fan VFD', 'VFD', 'ABB · ACS580', 'in progress', 'p2p', '14/22', 0],
    ['FAN-SF1-M', 'Supply fan motor', 'Motor', 'Baldor · 75hp', 'commissioned', 'func', '4/4', 0],
    ['HUM-01', 'Steam humidifier', 'Humidifier', 'Nortec · …', 'in progress', 'pre-func', '3/9', 0],
    ['SD-01', 'Smoke detector', 'Detector', 'Honeywell · …', 'awaiting', '—', '0/4', 0],
  ];
  return (
    <div style={panelScroll}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">14 devices · sub-assets</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Devices mounted on AHU-007</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WBtn variant="outline" tone="primary" size="sm" icon="⊞">group · system</WBtn>
          <WBtn variant="ghost" tone="ai" size="sm" icon="✦">find similar AHUs</WBtn>
          <WBtn tone="primary" size="sm" icon="+">add device</WBtn>
        </div>
      </div>

      {/* Blueprint device map */}
      <WBox seed="map" style={{ padding: 14, position: 'relative', marginBottom: 12 }}>
        <div className="wk-blueprint fine" style={{ position: 'absolute', inset: 0, opacity: 0.35, borderRadius: 8 }} />
        <div style={{ position: 'relative', height: 180, padding: '14px 10px' }}>
          <svg viewBox="0 0 600 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect x="40" y="40" width="520" height="100" fill="none" stroke="var(--ui-line-strong)" strokeWidth="1.5" />
            {[140, 260, 380, 480].map((x, i) => <line key={i} x1={x} y1="40" x2={x} y2="140" stroke="var(--ui-line)" strokeWidth="1" strokeDasharray="3 3" />)}
            {[['INTAKE', 90], ['FILTER', 200], ['COIL', 320], ['FAN', 430], ['SUPPLY', 520]].map(([t, x], i) => (
              <text key={i} x={x} y="160" fontFamily="Geist Mono" fontSize="9" fill="var(--ui-ink-faint)" textAnchor="middle">{t}</text>
            ))}
          </svg>
          {[[85, 90, 'ok', 'DMP-01'], [195, 90, 'ok', 'FIL-01'], [320, 70, 'primary', 'COIL-CHW'], [320, 110, 'warn', 'COIL-DX'], [430, 90, 'primary', 'FAN-SF1'], [520, 90, 'ink-soft', 'SD-01']].map(([x, y, c, label], i) => (
            <div key={i} style={{ position: 'absolute', left: `${(x / 600) * 100}%`, top: `${(y / 180) * 100}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: `var(--ui-${c}-soft)`, border: `1.5px solid var(--ui-${c})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--ui-${c})`, fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 600 }}>◆</span>
              <WT size={9.5} mono color={c === 'ink-soft' ? 'ink-faint' : c}>{label}</WT>
            </div>
          ))}
        </div>
      </WBox>

      {/* Sub-asset table */}
      <WBox seed="sub" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1.4fr 90px 110px 110px 90px 70px 70px', padding: '8px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)' }}>
          {['Tag', 'Description', 'Type', 'Mfr · Model', 'Status', 'Phase', 'P2P', 'Issues'].map((h, i) => (
            <WT key={i} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{h}</WT>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1.4fr 90px 110px 110px 90px 70px 70px', padding: '8px 14px', borderBottom: '1px solid var(--ui-line)', alignItems: 'center' }}>
            <WT size={12} mono weight={500}>{r[0]}</WT>
            <WT size={12.5}>{r[1]}</WT>
            <WT size={11.5} color="ink-soft">{r[2]}</WT>
            <WT size={11} color="ink-soft" mono>{r[3]}</WT>
            <AStatusPill status={r[4]} size={10} />
            <WT size={11} color="ink-soft">{r[5]}</WT>
            <WT size={11} mono color="ink-soft">{r[6]}</WT>
            <WT size={11.5} mono color={r[7] > 0 ? 'warn' : 'ink-faint'} weight={r[7] > 0 ? 600 : 400}>{r[7]}</WT>
          </div>
        ))}
        <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ui-panel-2)' }}>
          <WT size={11} color="ink-soft">10 of 14 shown</WT>
          <WBtn variant="ghost" tone="primary" size="sm">show 4 more →</WBtn>
        </div>
      </WBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHECKLISTS
// ════════════════════════════════════════════════════════════════════════════
function AssetChecklists() {
  const lists = [
    ['Mechanical pre-functional', 67, 'primary', 'in progress', 'BL', '12 / 18', 'M-PFC-AHU'],
    ['Mechanical functional', 0, 'ink-soft', 'queued', '—', '0 / 22', 'M-FT-AHU'],
    ['Smoke control test', 0, 'ink-soft', 'queued', '—', '0 / 9', 'LS-SMK'],
  ];
  const items = [
    ['M-01', 'Shipping stops, bracing & packing removed', 'pass', 'BL', 'IMG_2042'],
    ['M-01', 'Nameplate / tag readable and correct', 'flag', 'BL', 'IMG_2043'],
    ['M-02', 'Asset location matches drawing M-204', 'pass', 'BL', '—'],
    ['M-02', 'Installation per spec; anchor bolts torqued', 'pass', 'BL', '—'],
    ['M-03', 'Access clearance per code (3 ft front)', 'pass', 'BL', '—'],
    ['M-04', 'Coil piping connected & labeled correctly', 'pending', '—', '—'],
    ['M-04', 'Condensate drain trapped & flowing', 'fail', 'BL', 'IMG_2051'],
  ];
  const res = { pass: ['ok', '✓'], fail: ['warn', '✕'], flag: ['ai', '!'], pending: ['ink-soft', '○'] };
  return (
    <div style={panelScroll}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">3 checklists linked</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Commissioning checklists for AHU-007</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WBtn variant="outline" tone="primary" size="sm" icon="⤓">export PDF</WBtn>
          <WBtn tone="primary" size="sm" icon="+">assign checklist</WBtn>
        </div>
      </div>

      {/* Checklist summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {lists.map(([name, p, tone, status, who, frac, code], i) => (
          <WBox key={i} seed={`cl${i}`} style={{ padding: 13, borderColor: i === 0 ? 'var(--ui-primary-line)' : 'var(--ui-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <WStamp k="" v={code} />
              <WT size={16} mono weight={600} color={tone === 'ink-soft' ? 'ink-faint' : tone}>{p}%</WT>
            </div>
            <WT size={13.5} weight={500} style={{ marginTop: 10 }}>{name}</WT>
            <WBar value={p} color={tone === 'ink-soft' ? 'primary' : tone} style={{ marginTop: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {status === 'in progress' ? <WLiveDot tone="primary" size={5} /> : <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--ui-ink-faint)' }} />}
                <WT size={10.5} mono color={status === 'in progress' ? 'primary' : 'ink-faint'} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{status}</WT>
              </span>
              <WT size={11} mono color="ink-soft">{frac}</WT>
            </div>
          </WBox>
        ))}
      </div>

      {/* Expanded checklist preview */}
      <WBox seed="exp" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WSectionLabel tone="primary" dot>mechanical pre-functional</WSectionLabel>
            <WT size={11} mono color="ink-soft">witness · CxA required</WT>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <WPill tone="ok" size="sm">4 pass</WPill>
            <WPill tone="warn" size="sm">1 fail</WPill>
            <WPill tone="ai" size="sm">1 flag</WPill>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 70px 60px 80px', padding: '7px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-3)' }}>
          {['Ref', 'Item', 'Result', 'By', 'Photo'].map((h, i) => <WT key={i} size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{h}</WT>)}
        </div>
        {items.map((r, i) => {
          const [tone, glyph] = res[r[2]];
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 70px 60px 80px', padding: '9px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--ui-line)' : 'none', alignItems: 'center' }}>
              <WT size={11.5} mono color="ink-soft">{r[0]}</WT>
              <WT size={12.5}>{r[1]}</WT>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `var(--ui-${tone}-soft)`, border: `1px solid var(--ui-${tone}-line)`, color: `var(--ui-${tone})`, fontSize: 10, fontWeight: 700 }}>{glyph}</span>
                <WT size={10.5} mono color={tone} style={{ textTransform: 'uppercase' }}>{r[2]}</WT>
              </span>
              <WT size={11.5} mono color="ink-soft">{r[3]}</WT>
              {r[4] !== '—' ? <WPill tone="primary" size="sm">▦ 1</WPill> : <WT size={11} color="ink-faint">—</WT>}
            </div>
          );
        })}
        <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ui-panel-2)' }}>
          <WT size={11} color="ink-soft">7 of 18 items shown · sections M-01 → M-04</WT>
          <WBtn variant="ghost" tone="primary" size="sm">open full checklist →</WBtn>
        </div>
      </WBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TESTS (functional / performance)
// ════════════════════════════════════════════════════════════════════════════
function AssetTests() {
  const scripts = [
    ['FT-01', 'Supply fan VFD speed verification', 'pass', 'May 26'],
    ['FT-02', 'Airflow balancing & damper stroke', 'pass', 'May 27'],
    ['FT-03', 'CHW coil valve control loop', 'in progress', '—'],
    ['FT-04', 'Economizer & mixed-air sequence', 'queued', 'Jun 04'],
    ['FT-05', 'Smoke control / IST integration', 'queued', 'Jun 18'],
  ];
  const readings = [
    ['Supply airflow', '28,000 cfm', '27,640 cfm', '±5%', 'pass'],
    ['External static', '3.50 in', '3.61 in', '±10%', 'pass'],
    ['Fan motor amps', '92 A', '88 A', '≤ FLA', 'pass'],
    ['CHW coil ΔT', '12 °F', '8.4 °F', '±1.5 °F', 'fail'],
    ['Disch. air temp', '55 °F', '57 °F', '±2 °F', 'pass'],
  ];
  const tone = { pass: 'ok', fail: 'warn', 'in progress': 'primary', queued: 'ink-soft' };
  return (
    <div style={panelScroll}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">5 test scripts · functional</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Functional & performance testing</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WBtn variant="ghost" tone="ai" size="sm" icon="✦">explain ΔT failure</WBtn>
          <WBtn tone="primary" size="sm" icon="▶">run test</WBtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14, alignItems: 'start' }}>
        {/* Test scripts */}
        <ACard seed="scr" label="test scripts">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {scripts.map(([id, name, st, date], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < scripts.length - 1 ? '1px solid var(--ui-line)' : 'none' }}>
                <WT size={11.5} mono color="ink-soft" style={{ width: 44, flexShrink: 0 }}>{id}</WT>
                <WT size={13} style={{ flex: 1 }}>{name}</WT>
                <WT size={11} mono color="ink-faint">{date}</WT>
                <AStatusPill status={st} size={10} />
              </div>
            ))}
          </div>
        </ACard>

        {/* Readings vs design */}
        <ACard seed="rd" label="key readings vs design" tone="primary" right={<WPill tone="warn" size="sm">1 out of tolerance</WPill>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 0.8fr 70px', padding: '0 0 8px', borderBottom: '1px solid var(--ui-line)' }}>
            {['Parameter', 'Design', 'Measured', 'Tol.', 'Result'].map((h, i) => <WT key={i} size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</WT>)}
          </div>
          {readings.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 0.8fr 70px', padding: '9px 0', borderBottom: i < readings.length - 1 ? '1px solid var(--ui-line)' : 'none', alignItems: 'center' }}>
              <WT size={12.5}>{r[0]}</WT>
              <WT size={12} mono color="ink-soft">{r[1]}</WT>
              <WT size={12} mono color={r[4] === 'fail' ? 'warn' : 'ink'} weight={r[4] === 'fail' ? 600 : 500}>{r[2]}</WT>
              <WT size={11} mono color="ink-faint">{r[3]}</WT>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: `var(--ui-${tone[r[4]]})`, fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: `var(--ui-${tone[r[4]]})` }} />{r[4]}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 11, borderRadius: 6, background: 'var(--ui-warn-soft)', border: '1px solid var(--ui-warn-line)' }}>
            <WT size={12} color="warn"><b>CHW coil ΔT 8.4 °F</b> is below the 12 °F design — points to low water flow or air-side bypass. Linked to issue #1 (COIL-DX).</WT>
          </div>
        </ACard>
      </div>
    </div>
  );
}

Object.assign(window, { AssetOverview, AssetDevices, AssetChecklists, AssetTests, panelScroll });
