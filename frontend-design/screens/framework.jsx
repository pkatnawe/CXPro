/* screens/framework.jsx — intro / framework artboard */

function FrameworkOverview() {
  return (
    <WFrame style={{ width: '100%', height: '100%', padding: 40, background: 'var(--ui-bg)', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <WSectionLabel dot>CX Pro · turnkey commissioning</WSectionLabel>
          <WBrandHeading size={56} style={{ marginTop: 14 }}>
            Commissioning, <em>reimagined</em> for the AI era.
          </WBrandHeading>
          <WT size={15} color="ink-soft" style={{ marginTop: 12, maxWidth: 580, lineHeight: 1.5 }}>
            A single source of truth across CxAs, field crews and owners — with every screen wired to an AI that knows your project, drawings and history.
          </WT>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>vertical · data centers</WT>
          <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>users · CxA / field / PM</WT>
          <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>theme · light + dark</WT>
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--ui-ok-line)', background: 'var(--ui-ok-soft)' }}>
            <WLiveDot tone="ok" size={6} />
            <WT size={10} mono color="ok" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>system operational</WT>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        {/* What's different */}
        <WBox seed="diff" style={{ padding: 20 }}>
          <WSectionLabel tone="primary">01 · what's different</WSectionLabel>
          <WH size={22} weight={600} style={{ marginTop: 12 }}>Not "AI bolted on"</WH>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Role-specific tools', 'CxA, Field, PM each get tailored workflows — same data model'],
              ['Analytical dashboards', 'Real progress curves, forecasts, cost-to-finish, risk to go-live'],
              ['Prompt-built reports', 'Stakeholders get a custom report from a single sentence'],
              ['Field-first execution', 'Big targets, offline, photo/voice — phone & tablet are first class'],
              ['Every screen has AI', 'Ambient brief · inline suggestions · copilot rail · agent runs'],
            ].map(([t, d], i) => (
              <div key={i}>
                <WT size={13} weight={600}>{t}</WT>
                <WT size={11.5} color="ink-soft" style={{ marginTop: 2 }}>{d}</WT>
              </div>
            ))}
          </div>
        </WBox>

        {/* AI surfaces */}
        <WBox seed="ai-surf" style={{ padding: 20, borderColor: 'var(--ui-ai-line)' }}>
          <WSectionLabel tone="ai" dot>02 · ai surfaces</WSectionLabel>
          <WH size={22} weight={600} style={{ marginTop: 12 }}>Four layers, one model</WH>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Ambient', 'Morning brief · auto-summaries · activity narratives. Never blocks UI.'],
              ['Inline', 'Small ✦ chips next to filters, fields, buttons — suggests + completes.'],
              ['Copilot rail', 'Right-side chat, screen-aware. Knows what you have open + selected.'],
              ['Agent / workflows', '"Run a daily report" · "Bundle similar issues" · multi-step with diff preview.'],
            ].map(([t, d], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <WAI compact>{t}</WAI>
                <WT size={11.5} style={{ flex: 1, paddingTop: 2 }}>{d}</WT>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: '1px dashed var(--ui-line)' }}>
            <WT size={11} color="ink-soft">trust model · every AI output cites sources, supports regen, never auto-submits.</WT>
          </div>
        </WBox>

        {/* Information architecture */}
        <WBox seed="ia" style={{ padding: 20 }}>
          <WSectionLabel tone="primary">03 · information architecture</WSectionLabel>
          <WH size={22} weight={600} style={{ marginTop: 12 }}>Same nav for everyone</WH>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['§ project', ['Dashboard (role-aware)', 'Schedule', 'Team / roles']],
              ['§ work', ['Asset register', 'Checklists', 'Tests', 'Issues']],
              ['§ knowledge', ['Documents & drawings', 'Reports (prompt → PDF)', 'Audit log']],
            ].map(([sec, items], i) => (
              <div key={i}>
                <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{sec.replace('§ ', '')}</WT>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {items.map((it, j) => (
                    <WT key={j} size={12.5} style={{ paddingLeft: 0 }}>· {it}</WT>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: '1px dashed var(--ui-line)' }}>
            <WT size={11} color="ink-soft">role-aware dashboards: CxA gets queues + sign-off · Field gets today's punchlist · PM gets forecast + approvals.</WT>
          </div>
        </WBox>
      </div>

      <WNote tilt={0} style={{ alignSelf: 'flex-start' }}>
        wireframes are lo-fi on purpose — committing to structure & flow before high-fi visuals.
      </WNote>
    </WFrame>
  );
}

Object.assign(window, { FrameworkOverview });
