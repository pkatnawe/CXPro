/* screens/checklist-templates.jsx — checklist & equipment template library */

function ChecklistTemplates() {
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <WHeader crumbs={['CX Pro · org', 'Template library']} role="CxA">
        <WBtn variant="ghost" tone="ai" size="sm" icon="✦">copilot</WBtn>
        <WBtn variant="outline" tone="primary" size="sm" icon="↑">import .xlsx</WBtn>
        <WBtn tone="primary" size="sm" icon="+">new template</WBtn>
      </WHeader>

      {/* Top */}
      <div style={{ padding: '18px 24px 8px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
        <WSectionLabel tone="primary">org · template library</WSectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
          <div>
            <WH size={26}>Templates</WH>
            <WT size={13} color="ink-soft" style={{ marginTop: 2 }}>Versioned · clone into any project · used by 12 active projects</WT>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Checklists', 'Assets', 'Reports', 'RFIs', 'Forms'].map((t, i) => (
              <WBtn key={i} variant={i === 1 ? 'outline' : 'ghost'} tone="primary" size="sm">{t}</WBtn>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 320px', minHeight: 0 }}>
        {/* Left: tags */}
        <div style={{ borderRight: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', padding: 14, overflow: 'auto' }}>
          <WWell style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <WT size={12} color="ink-soft" mono>⌕ search templates...</WT>
          </WWell>
          {[
            ['discipline', [['Mechanical', 38], ['Electrical', 24], ['Controls', 18], ['Life Safety', 9], ['Security', 6]]],
            ['asset type', [['AHU', 8], ['PDU', 6], ['UPS', 4], ['CRAH', 5], ['BMS', 7], ['Switchgear', 4]]],
            ['phase', [['Pre-functional', 22], ['Functional', 18], ['Integrated', 9], ['Level 5', 4]]],
            ['standard', [['ASHRAE 0', 12], ['NETA ATS', 8], ['Owner spec', 24]]],
          ].map(([title, items], i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 }}>{title}</WT>
              {items.map(([n, c], j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 4px', borderRadius: 4 }}>
                  <WT size={12}>{n}</WT>
                  <WT size={10.5} mono color="ink-faint">{c}</WT>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Center: template grid */}
        <div style={{ padding: 18, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>92 templates · sorted by · most used</WT>
            <div style={{ display: 'flex', gap: 6 }}>
              <WBtn variant="ghost" tone="ink-soft" size="sm">grid</WBtn>
              <WBtn variant="outline" tone="primary" size="sm">list</WBtn>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { id: 'ahu.mech.pre-func', title: 'AHU · Mechanical pre-functional', desc: '18 items · 5 sections · MERV-13 ready', items: 18, rev: 'v3.2', used: 48, hot: true, ai: true },
              { id: 'pdu.elec.load-val', title: 'PDU · Electrical load validation', desc: '14 items · 3 sections · NETA ATS aligned', items: 14, rev: 'v2.0', used: 36, hot: true, ai: false },
              { id: 'ups.elec.string', title: 'UPS · String pre-functional', desc: '12 items · 4 sections · battery + bypass', items: 12, rev: 'v1.4', used: 24, hot: false, ai: false },
              { id: 'crah.mech.startup', title: 'CRAH · Startup', desc: '11 items · 3 sections · airflow + condensate', items: 11, rev: 'v2.1', used: 21, hot: false, ai: true },
              { id: 'bms.ctrl.p2p', title: 'BMS · Point-to-point verification', desc: '40 items · 1 section · I/O matrix', items: 40, rev: 'v1.0', used: 18, hot: false, ai: true },
              { id: 'fls.fa.integrated', title: 'FLS · Integrated systems test', desc: '24 items · 6 sections · level 4', items: 24, rev: 'v1.2', used: 12, hot: false, ai: false },
            ].map((tpl, i) => (
              <WBox key={i} seed={`tpl${i}`} style={{ padding: 14, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <WStamp k="id" v={tpl.id} />
                    <WStamp k="rev" v={tpl.rev} />
                  </div>
                  {tpl.hot ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: 'var(--ui-ok-soft)', color: 'var(--ui-ok)', border: '1px solid var(--ui-ok-line)' }}>
                      <WLiveDot tone="ok" size={5} />
                      <WT size={9.5} mono color="ok" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>popular</WT>
                    </span>
                  ) : null}
                </div>
                <WH size={16} weight={600} style={{ marginTop: 10 }}>{tpl.title}</WH>
                <WT size={11.5} color="ink-soft" style={{ marginTop: 4 }}>{tpl.desc}</WT>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, padding: '8px 0', borderTop: '1px dashed var(--ui-line)', borderBottom: '1px dashed var(--ui-line)' }}>
                  <div>
                    <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>items</WT>
                    <WT size={14} weight={600} mono>{tpl.items}</WT>
                  </div>
                  <div>
                    <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>projects</WT>
                    <WT size={14} weight={600} mono>{tpl.used}</WT>
                  </div>
                  <div>
                    <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>last edit</WT>
                    <WT size={11.5} mono color="ink-soft">12 d ago</WT>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                  {tpl.ai ? <WAI compact>AI-built</WAI> : null}
                  <div style={{ flex: 1 }} />
                  <WBtn variant="ghost" tone="ink-soft" size="sm">preview</WBtn>
                  <WBtn variant="outline" tone="primary" size="sm">clone</WBtn>
                  <WBtn tone="primary" size="sm" icon="▶">use</WBtn>
                </div>
              </WBox>
            ))}
          </div>
        </div>

        {/* Right: AI-generate panel */}
        <div style={{ borderLeft: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <WBox seed="ai-gen" style={{ padding: 14, borderColor: 'var(--ui-ai-line)', boxShadow: 'var(--ui-shadow-accent)' }}>
            <WSectionLabel tone="ai" dot>generate from prompt</WSectionLabel>
            <WT size={12.5} style={{ marginTop: 10, lineHeight: 1.4 }}>
              Drop a spec PDF or describe the asset — CX Pro builds a draft template with sections, items, and witness rules.
            </WT>
            <WWell style={{ marginTop: 10, padding: 10 }}>
              <WT size={12} color="ink-soft" style={{ lineHeight: 1.4 }}>
                "Pre-functional for an N+1 chiller plant with two 800-ton centrifugal chillers, 4 CHWPs, primary-secondary loop..."
              </WT>
            </WWell>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <WBtn variant="outline" tone="ai" size="sm" icon="📎">attach spec</WBtn>
              <WBtn tone="ai" size="sm" icon="✦" hero style={{ flex: 1 }}>generate template</WBtn>
            </div>
          </WBox>

          <div>
            <WSectionLabel tone="primary">recent generations</WSectionLabel>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Generator · weekly run', '14 items · from NETA spec'],
                ['Switchgear · pre-energization', '22 items · from owner OPR'],
                ['Cooling tower · startup', '9 items · from O&M manual'],
              ].map(([t, d], i) => (
                <WBox key={i} seed={`gen${i}`} style={{ padding: 10 }}>
                  <WT size={12.5} weight={500}>{t}</WT>
                  <WT size={11} color="ink-soft" style={{ marginTop: 2 }}>{d}</WT>
                </WBox>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { ChecklistTemplates });
