/* screens/asset-panels-b.jsx — tab panels: Issues · Files · RFIs · History · Linked
   Uses its own scroll style const (panelScrollB) to avoid cross-script name collision. */

const panelScrollB = { flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' };

// ════════════════════════════════════════════════════════════════════════════
// ISSUES / punch list
// ════════════════════════════════════════════════════════════════════════════
function AssetIssues() {
  const issues = [
    ['#1', 'critical', 'COIL-DX refrigerant charge 18% below spec 23-23', 'COIL-DX', 'open', 'Acme Mech', '3d', 'BL'],
    ['#2', 'minor', 'Filter rack tag faded — replacement requested', 'FIL-01', 'open', 'Acme Mech', '0d', 'BL'],
    ['#3', 'major', 'Condensate drain not trapped per detail M-510', 'AHU-007', 'in review', 'Turner GC', '1d', 'BL'],
    ['#4', 'minor', 'VFD parameter file not matching submittal', 'FAN-SF1', 'resolved', 'Acme Mech', '5d', 'JM'],
    ['#5', 'observation', 'Recommend access platform for coil service', 'AHU-007', 'closed', 'EOR', '8d', 'JM'],
  ];
  const sevTone = { critical: 'warn', major: 'ai', minor: 'ink', observation: 'ink' };
  const stTone = { open: 'warn', 'in review': 'ai', resolved: 'ok', closed: 'ink-soft' };
  return (
    <div style={panelScrollB}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="warn">5 issues · 2 open</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Issues & punch list</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WBtn variant="outline" tone="primary" size="sm" icon="⊞">group · severity</WBtn>
          <WBtn tone="warn" size="sm" icon="+">log issue</WBtn>
        </div>
      </div>

      {/* severity summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['critical', 1, 'warn'], ['major', 1, 'ai'], ['minor', 2, 'ink'], ['observation', 1, 'ink-soft']].map(([k, n, t], i) => (
          <WBox key={i} seed={`sv${i}`} style={{ padding: '10px 14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <WT size={11.5} mono color={t === 'ink' ? 'ink-soft' : t} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{k}</WT>
            <WH size={20} weight={600} color={t === 'ink' ? 'ink' : t}>{n}</WH>
          </WBox>
        ))}
      </div>

      <WBox seed="itbl" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '44px 100px 1fr 100px 90px 110px 50px 44px', padding: '8px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)' }}>
          {['ID', 'Severity', 'Description', 'Sub-asset', 'Status', 'Ball-in-court', 'Age', 'By'].map((h, i) => <WT key={i} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{h}</WT>)}
        </div>
        {issues.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 100px 1fr 100px 90px 110px 50px 44px', padding: '10px 14px', borderBottom: i < issues.length - 1 ? '1px solid var(--ui-line)' : 'none', alignItems: 'center' }}>
            <WT size={12} mono weight={600}>{r[0]}</WT>
            <WPill tone={sevTone[r[1]]} size="sm">{r[1]}</WPill>
            <WT size={12.5}>{r[2]}</WT>
            <WT size={11.5} mono color="ink-soft">{r[3]}</WT>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: `var(--ui-${stTone[r[4]]})`, fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: `var(--ui-${stTone[r[4]]})` }} />{r[4]}
            </span>
            <WT size={11.5} color="ink-soft">{r[5]}</WT>
            <WT size={11.5} mono color={r[6] === '3d' ? 'warn' : 'ink-soft'}>{r[6]}</WT>
            <WAvatar initials={r[7]} size={22} seed={r[7] + i} />
          </div>
        ))}
      </WBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FILES & documents
// ════════════════════════════════════════════════════════════════════════════
function AssetFiles() {
  const cats = [
    ['Submittals', 'primary', [['AHU schedule & cut sheets', 'PDF', 'rev C', '4.2 MB'], ['VFD ACS580 data', 'PDF', 'rev B', '1.8 MB'], ['Coil performance', 'PDF', 'rev A', '0.9 MB']]],
    ['O&M manuals', 'ai', [['Daikin Vision O&M', 'PDF', '—', '22 MB'], ['VFD programming guide', 'PDF', '—', '6.1 MB']]],
    ['Test reports', 'ok', [['TAB report — air balance', 'PDF', 'final', '3.4 MB'], ['Pre-func sign-off M-PFC', 'PDF', 'draft', '1.1 MB']]],
    ['Photos', 'ink', [['Install — set & anchor', 'JPG', '12 imgs', '—'], ['Nameplate verification', 'JPG', '3 imgs', '—']]],
    ['Warranty & turnover', 'ink', [['Warranty certificate', 'PDF', '2 yr', '0.4 MB'], ['Spare parts list', 'XLSX', '—', '0.1 MB']]],
    ['As-builts', 'ink', [['Marked-up M-204', 'PDF', 'pending', '—']]],
  ];
  return (
    <div style={panelScrollB}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">24 documents · 6 categories</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Files & documents</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WWell style={{ width: 200, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WT size={12} color="ink-soft" mono>⌕ search files</WT>
          </WWell>
          <WBtn tone="primary" size="sm" icon="↑">upload</WBtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
        {cats.map(([cat, tone, files], ci) => (
          <ACard key={ci} seed={`cat${ci}`} label={cat} tone={tone === 'ink' ? 'primary' : tone} right={<WT size={11} mono color="ink-faint">{files.length}</WT>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 6, background: 'var(--ui-panel-3)', border: '1px solid var(--ui-line)' }}>
                  <span style={{ width: 30, height: 36, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ui-panel)', border: '1px solid var(--ui-line-strong)', fontFamily: 'Geist Mono', fontSize: 8.5, fontWeight: 600, color: 'var(--ui-ink-soft)' }}>{f[1]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <WT size={12.5} weight={500} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f[0]}</WT>
                    <WT size={10.5} mono color="ink-faint" style={{ marginTop: 1 }}>{f[2]}{f[3] !== '—' ? ` · ${f[3]}` : ''}</WT>
                  </div>
                  <WIcon glyph="⤓" color="ink-faint" size={14} />
                </div>
              ))}
            </div>
          </ACard>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RFIs & submittals
// ════════════════════════════════════════════════════════════════════════════
function AssetRFIs() {
  const subs = [
    ['23-23.10', 'AHU schedule & cut sheets', '23 73 13', 'approved', 'ok', 'EOR', 'May 06'],
    ['23-05.40', 'VFD — ABB ACS580', '23 05 13', 'appr. as noted', 'ai', 'EOR', 'May 11'],
    ['23-08.13', 'Coil performance data', '23 82 16', 'approved', 'ok', 'EOR', 'May 09'],
    ['23-09.93', 'Sequence of operations', '23 09 93', 'pending', 'warn', 'CxA', '—'],
  ];
  const rfis = [
    ['RFI-118', 'Condensate routing conflict with cable tray at grid C-7', 'open', 'warn', 'EOR', '2d'],
    ['RFI-104', 'Confirm CHW supply temp setpoint for coil selection', 'answered', 'ok', 'EOR', 'closed'],
  ];
  return (
    <div style={panelScrollB}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">submittals & RFIs</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>Submittals & RFIs</WH>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <WBtn variant="ghost" tone="ai" size="sm" icon="✦">draft RFI</WBtn>
          <WBtn tone="primary" size="sm" icon="+">new submittal</WBtn>
        </div>
      </div>

      <ACard seed="subs" label="submittals · 7" tone="primary" right={<div style={{ display: 'flex', gap: 5 }}><WPill tone="ok" size="sm">5 approved</WPill><WPill tone="warn" size="sm">1 pending</WPill></div>} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 130px 70px 70px', padding: '0 0 8px', borderBottom: '1px solid var(--ui-line)' }}>
          {['Number', 'Title', 'Spec', 'Status', 'BIC', 'Date'].map((h, i) => <WT key={i} size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</WT>)}
        </div>
        {subs.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 130px 70px 70px', padding: '9px 0', borderBottom: i < subs.length - 1 ? '1px solid var(--ui-line)' : 'none', alignItems: 'center' }}>
            <WT size={11.5} mono color="ink-soft">{r[0]}</WT>
            <WT size={12.5}>{r[1]}</WT>
            <WT size={11} mono color="ink-faint">{r[2]}</WT>
            <WPill tone={r[4]} size="sm">{r[3]}</WPill>
            <WT size={11.5} mono color="ink-soft">{r[5]}</WT>
            <WT size={11} mono color="ink-faint">{r[6]}</WT>
          </div>
        ))}
      </ACard>

      <ACard seed="rfis" label="RFIs · 1 open" tone="warn">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rfis.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6, background: 'var(--ui-panel-3)', border: '1px solid var(--ui-line)' }}>
              <WT size={12} mono weight={600} color={r[3]} style={{ width: 64, flexShrink: 0 }}>{r[0]}</WT>
              <WT size={12.5} style={{ flex: 1 }}>{r[1]}</WT>
              <WT size={11} mono color="ink-soft">BIC · {r[4]}</WT>
              <WT size={11} mono color={r[2] === 'open' ? 'warn' : 'ink-faint'}>{r[5]}</WT>
              <WPill tone={r[3]} size="sm">{r[2]}</WPill>
            </div>
          ))}
        </div>
      </ACard>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HISTORY / activity log
// ════════════════════════════════════════════════════════════════════════════
function AssetHistory() {
  const days = [
    ['Today · May 31', [
      ['10:24', 'BL', 'logged issue #2 — filter rack tag faded', 'warn'],
      ['09:18', 'BL', 'completed pre-functional items M-01 → M-03 (4 pass, 1 flag)', 'ok'],
      ['08:32', 'BL', 'uploaded 12 install photos to AHU-007', 'ink'],
    ]],
    ['May 28', [
      ['16:40', 'JM', 'witnessed FT-02 airflow balancing — pass', 'ok'],
      ['14:02', 'AI', 'flagged CHW coil ΔT below design tolerance', 'ai'],
      ['11:15', 'BL', 'logged critical issue #1 — COIL-DX charge', 'warn'],
    ]],
    ['May 24', [
      ['09:00', 'JM', 'advanced phase to pre-functional', 'primary'],
      ['08:30', 'PO', 'marked asset set & anchored', 'ok'],
    ]],
  ];
  return (
    <div style={panelScrollB}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <WSectionLabel tone="primary">activity log</WSectionLabel>
          <WH size={18} weight={600} style={{ marginTop: 6 }}>History & audit trail</WH>
        </div>
        <WBtn variant="outline" tone="primary" size="sm" icon="⤓">export audit log</WBtn>
      </div>

      <div style={{ maxWidth: 760 }}>
        {days.map(([day, events], di) => (
          <div key={di} style={{ marginBottom: 18 }}>
            <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>{day}</WT>
            <div style={{ position: 'relative', paddingLeft: 26 }}>
              <div style={{ position: 'absolute', left: 9, top: 4, bottom: 4, width: 2, background: 'var(--ui-line)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {events.map(([time, who, text, tone], i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ position: 'absolute', left: -22, top: 3, width: 12, height: 12, borderRadius: 999, background: `var(--ui-${tone === 'ink' ? 'ink-faint' : tone})`, border: '2px solid var(--ui-panel)', boxShadow: '0 0 0 1px var(--ui-line)' }} />
                    <WT size={11} mono color="ink-faint" style={{ width: 42, flexShrink: 0, paddingTop: 1 }}>{time}</WT>
                    {who === 'AI' ? <WAI compact>copilot</WAI> : <WAvatar initials={who} size={22} seed={who + i} />}
                    <WT size={13} style={{ flex: 1, paddingTop: 1 }}>{text}</WT>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LINKED (drawings, systems, dependencies, location)
// ════════════════════════════════════════════════════════════════════════════
function AssetLinked() {
  const drawings = [
    ['M-204', 'Mech plan — Hall B L1', 'rev 04'],
    ['M-510', 'AHU piping detail', 'rev 02'],
    ['E-403', 'Power — mech room 1.04', 'rev 03'],
    ['C-091', 'Controls riser', 'rev 01'],
    ['FA-12', 'Fire alarm device plan', 'rev 02'],
  ];
  return (
    <div style={panelScrollB}>
      <div style={{ marginBottom: 14 }}>
        <WSectionLabel tone="primary">7 linked records</WSectionLabel>
        <WH size={18} weight={600} style={{ marginTop: 6 }}>Linked drawings, systems & dependencies</WH>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* System hierarchy */}
        <ACard seed="hier" label="system hierarchy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[[0, 'CHW Plant — Central', 'system', 'ink-soft'], [1, 'AHU group — Hall B', 'group', 'ink-soft'], [2, 'AHU-007', 'this asset', 'primary'], [3, 'COIL-CHW · COIL-DX · FAN-SF1 · …', '14 devices', 'ink-soft']].map(([lvl, name, tag, tone], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginLeft: lvl * 18, borderRadius: 6, background: tone === 'primary' ? 'var(--ui-primary-soft)' : 'transparent', border: tone === 'primary' ? '1px solid var(--ui-primary-line)' : '1px solid transparent' }}>
                <WIcon glyph={lvl === 3 ? '◆' : '⎇'} color={tone === 'primary' ? 'primary' : 'ink-faint'} size={13} />
                <WT size={12.5} weight={tone === 'primary' ? 600 : 400} color={tone === 'primary' ? 'primary' : 'ink'} style={{ flex: 1 }}>{name}</WT>
                <WT size={10.5} mono color="ink-faint">{tag}</WT>
              </div>
            ))}
          </div>
        </ACard>

        {/* Dependencies */}
        <ACard seed="dep" label="dependencies" tone="ai">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['upstream', 'CHWP-03 · chilled water supply', 'ok'], ['upstream', 'PDU-2B · power feed', 'ok'], ['controls', 'BMS PLC-12 · DDC points', 'primary'], ['downstream', '8 VAV boxes served — Hall B', 'ink-soft']].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WPill tone={d[0] === 'controls' ? 'primary' : 'ink'} size="sm" style={{ width: 88, justifyContent: 'center' }}>{d[0]}</WPill>
                <WT size={12.5} style={{ flex: 1 }}>{d[1]}</WT>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(--ui-${d[2] === 'ink-soft' ? 'ink-faint' : d[2]})` }} />
              </div>
            ))}
          </div>
        </ACard>

        {/* Linked drawings */}
        <ACard seed="dwgs" label="linked drawings · 5" right={<WBtn variant="ghost" tone="primary" size="sm" icon="⤢">viewer</WBtn>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drawings.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 6, background: 'var(--ui-panel-3)', border: '1px solid var(--ui-line)' }}>
                <span style={{ width: 30, height: 22, borderRadius: 3, flexShrink: 0, background: 'repeating-linear-gradient(90deg, var(--ui-panel), var(--ui-panel) 3px, var(--ui-panel-2) 3px, var(--ui-panel-2) 6px)', border: '1px solid var(--ui-line-strong)' }} />
                <WT size={12.5} mono weight={600} style={{ width: 56 }}>{d[0]}</WT>
                <WT size={12} color="ink-soft" style={{ flex: 1 }}>{d[1]}</WT>
                <WPill tone="ink" size="sm">{d[2]}</WPill>
              </div>
            ))}
          </div>
        </ACard>

        {/* BIM location */}
        <ACard seed="loc" label="BIM location" tone="primary" right={<WBtn variant="outline" tone="primary" size="sm">locate in model</WBtn>}>
          <div style={{ position: 'relative', height: 150, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ui-line)', background: 'var(--ui-panel-3)' }}>
            <div className="wk-blueprint fine" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
            <div style={{ position: 'absolute', left: '46%', top: '40%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--ui-primary-soft)', border: '1.5px solid var(--ui-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui-primary)', fontSize: 13 }}>◆</span>
              <WT size={9.5} mono color="primary">AHU-007</WT>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', marginTop: 12 }}>
            <AKV k="building / level" v="Hall B · L1" />
            <AKV k="room" v="Mech 1.04" />
            <AKV k="grid" v="C-7" mono />
            <AKV k="model rev" v="v.42" mono />
          </div>
        </ACard>
      </div>
    </div>
  );
}

Object.assign(window, { AssetIssues, AssetFiles, AssetRFIs, AssetHistory, AssetLinked });
