/* screens/drawing-collab.jsx — drawing markup + RFI collab (Figma-style commenting) */

function DrawingCollab() {
  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <WHeader crumbs={['DC-12', 'Documents', 'E-302 · Breaker schedule', 'rev 03']} role="CxA">
        {/* Presence avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: -8 }}>
          {[['BL', 'ok'], ['AC', 'primary'], ['KP', 'ai']].map(([n, tone], i) => (
            <span key={i} style={{ marginLeft: i === 0 ? 0 : -8, position: 'relative' }}>
              <WAvatar initials={n} size={26} seed={n + 'p'} />
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 8, height: 8, borderRadius: 999,
                background: `var(--ui-${tone})`, border: '2px solid var(--ui-panel)',
              }} />
            </span>
          ))}
        </div>
        <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>3 live</WT>
        <div style={{ width: 1, height: 18, background: 'var(--ui-line)', margin: '0 4px' }} />
        <WBtn variant="ghost" tone="ai" size="sm" icon="✦">copilot</WBtn>
        <WBtn variant="outline" tone="primary" size="sm" icon="↗">share</WBtn>
        <WBtn tone="primary" size="sm" icon="✎">new RFI</WBtn>
      </WHeader>

      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <WStamp k="sheet" v="E-302" />
          <WStamp k="rev" v="03" />
          <WStamp k="released" v="2025-11-04" />
          <WT size={11.5} color="ink-soft" style={{ marginLeft: 6 }}>Breaker schedule · PDU-04 · sheet 4 of 9</WT>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <WBtn variant="outline" tone="primary" size="sm">prev rev</WBtn>
          <WBtn variant="ghost" tone="ink-soft" size="sm">compare ⇆</WBtn>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: '1px solid var(--ui-ok-line)', background: 'var(--ui-ok-soft)' }}>
            <WLiveDot tone="ok" size={5} />
            <WT size={10.5} mono color="ok" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>current</WT>
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr 360px', minHeight: 0 }}>
        {/* Tool rail */}
        <div style={{ borderRight: '1px solid var(--ui-line)', padding: '12px 0', background: 'var(--ui-panel-2)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {[
            ['↖', 'select', false],
            ['◯', 'pin', true],
            ['✎', 'draw', false],
            ['▭', 'rect', false],
            ['T', 'text', false],
            ['⤢', 'measure', false],
            ['◷', 'history', false],
            ['✦', 'AI', false, 'ai'],
          ].map(([g, label, active, tone], i) => (
            <div key={i} style={{
              width: 38, height: 38, borderRadius: 6,
              border: active ? `1px solid var(--ui-primary)` : '1px solid transparent',
              background: active ? 'var(--ui-primary-soft)' : 'transparent',
              color: active ? 'var(--ui-primary)' : (tone === 'ai' ? 'var(--ui-ai)' : 'var(--ui-ink-soft)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Geist', fontSize: 16,
            }} title={label}>{g}</div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <WBtn variant="outline" tone="ink-soft" size="sm" style={{ width: 38, padding: '6px 0', justifyContent: 'center' }}>−</WBtn>
            <WT size={10} mono color="ink-faint">100</WT>
            <WBtn variant="outline" tone="ink-soft" size="sm" style={{ width: 38, padding: '6px 0', justifyContent: 'center' }}>+</WBtn>
          </div>
        </div>

        {/* Drawing canvas */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* blueprint grid */}
          <div className="wk-blueprint fine" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, var(--ui-primary-soft) 0%, transparent 50%)', opacity: 0.35 }} />

          {/* Drawing */}
          <svg viewBox="0 0 800 500" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 30 }}>
            <rect x="40" y="40" width="720" height="420" fill="var(--ui-panel)" fillOpacity="0.6" stroke="var(--ui-ink-soft)" strokeWidth="1" />
            <text x="60" y="68" fontFamily="Geist Mono" fontSize="11" fill="var(--ui-ink-soft)">PDU-04  ·  BREAKER SCHEDULE  ·  E-302  REV 03</text>

            {/* Bus bar */}
            <line x1="60" y1="220" x2="740" y2="220" stroke="var(--ui-ink)" strokeWidth="2" />
            <text x="50" y="225" fontFamily="Geist Mono" fontSize="9" fill="var(--ui-ink-soft)" textAnchor="end">MAIN</text>

            {/* Breakers */}
            {[
              ['CB-01', '225A', 100],
              ['CB-02', '250A', 240],
              ['CB-03', '225A', 380],
              ['CB-04', '225A', 520],
              ['CB-05', '125A', 660],
            ].map(([n, r, x], i) => (
              <g key={i}>
                <line x1={x} y1="220" x2={x} y2="160" stroke="var(--ui-ink)" strokeWidth="1.5" />
                <rect x={x - 30} y="100" width="60" height="60" fill="var(--ui-panel)" stroke="var(--ui-ink-soft)" strokeWidth="1.2" />
                <text x={x} y="124" fontFamily="Geist Mono" fontSize="10" fill="var(--ui-ink)" fontWeight="600" textAnchor="middle">{n}</text>
                <text x={x} y="142" fontFamily="Geist Mono" fontSize="9" fill="var(--ui-ink-soft)" textAnchor="middle">{r}</text>
              </g>
            ))}

            {/* Lower racks */}
            {[100, 240, 380, 520, 660].map((x, i) => (
              <g key={i}>
                <line x1={x} y1="220" x2={x} y2="290" stroke="var(--ui-ink-soft)" strokeWidth="1" />
                <rect x={x - 50} y="290" width="100" height="80" fill="var(--ui-panel-2)" stroke="var(--ui-line-strong)" strokeWidth="1" strokeDasharray="3 3" />
                <text x={x} y="320" fontFamily="Geist Mono" fontSize="9" fill="var(--ui-ink-soft)" textAnchor="middle">{`B-${(i * 10 + 1).toString().padStart(3, '0')} →`}</text>
                <text x={x} y="335" fontFamily="Geist Mono" fontSize="9" fill="var(--ui-ink-soft)" textAnchor="middle">{`B-${(i * 10 + 8).toString().padStart(3, '0')}`}</text>
                <text x={x} y="352" fontFamily="Geist Mono" fontSize="8" fill="var(--ui-ink-faint)" textAnchor="middle">8 RACKS</text>
              </g>
            ))}
          </svg>

          {/* Comment / RFI pins overlaid */}
          {[
            { x: 100, y: 130, n: 1, tone: 'warn', sel: false },
            { x: 240, y: 130, n: 2, tone: 'ai', sel: false },
            { x: 380, y: 330, n: 3, tone: 'primary', sel: true },
            { x: 660, y: 130, n: 4, tone: 'ok', sel: false },
          ].map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `calc(${(p.x / 800) * 100}% + 30px)`,
              top: `calc(${(p.y / 500) * 100}% + 0px)`,
              transform: 'translate(-50%, -100%)',
              width: 28, height: 28,
              borderRadius: '50% 50% 50% 0',
              background: `var(--ui-${p.tone})`,
              border: p.sel ? '2px solid var(--ui-panel)' : '2px solid var(--ui-panel)',
              boxShadow: p.sel ? `0 0 0 3px var(--ui-${p.tone}), 0 4px 12px color-mix(in oklab, var(--ui-${p.tone}) 50%, transparent)` : '0 2px 6px rgba(13,23,42,0.25)',
              transformOrigin: 'bottom left',
              color: `var(--ui-on-${p.tone})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Geist', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ transform: 'rotate(45deg)' }}>{p.n}</span>
            </div>
          ))}

          {/* Live cursor (someone else editing) */}
          <div style={{ position: 'absolute', top: '46%', left: '60%' }}>
            <svg width={18} height={18} viewBox="0 0 18 18" style={{ filter: 'drop-shadow(0 2px 4px rgba(13,23,42,0.3))' }}>
              <path d="M2 2 L 14 8 L 8 10 L 6 16 Z" fill="var(--ui-ai)" />
            </svg>
            <span style={{ position: 'absolute', top: 14, left: 14, padding: '3px 7px', borderRadius: 4, background: 'var(--ui-ai)', color: 'var(--ui-on-ai)', fontSize: 10, fontFamily: 'Geist', fontWeight: 500, whiteSpace: 'nowrap' }}>KP · typing</span>
          </div>

          {/* Toolbar overlay */}
          <div style={{ position: 'absolute', top: 14, left: 50, display: 'flex', gap: 6 }}>
            <WBtn variant="outline" tone="primary" size="sm">layers · 4</WBtn>
            <WBtn variant="ghost" tone="ink-soft" size="sm">pins · 4</WBtn>
            <WBtn variant="ghost" tone="ink-soft" size="sm">RFIs · 1</WBtn>
            <WBtn variant="ghost" tone="ai" size="sm" icon="✦">ask about sheet</WBtn>
          </div>
        </div>

        {/* RFI / Comments rail */}
        <div style={{ borderLeft: '1px solid var(--ui-line)', display: 'flex', flexDirection: 'column', background: 'var(--ui-panel-2)', minHeight: 0 }}>
          {/* tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ui-line)', padding: '0 14px', background: 'var(--ui-panel)' }}>
            {[['Comments', '4', true], ['RFIs', '1', false], ['Issues', '2', false]].map(([t, c, active], i) => (
              <div key={i} style={{ padding: '12px 12px', borderBottom: active ? '2px solid var(--ui-primary)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1 }}>
                <WT size={12.5} color={active ? 'primary' : 'ink-soft'} weight={active ? 500 : 400}>{t}</WT>
                <WT size={10} mono color={active ? 'primary' : 'ink-faint'} style={{ padding: '1px 6px', borderRadius: 999, background: active ? 'var(--ui-primary-soft)' : 'var(--ui-panel-3)' }}>{c}</WT>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <WBtn variant="ghost" tone="ink-soft" size="sm">⊞</WBtn>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Pin 3 — active thread (selected) */}
            <WBox seed="thread3" style={{ padding: 0, borderColor: 'var(--ui-primary-line)', boxShadow: 'var(--ui-shadow-accent)' }}>
              <div style={{ padding: 12, borderBottom: '1px solid var(--ui-line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50% 50% 50% 0', background: 'var(--ui-primary)', color: 'var(--ui-on-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono', fontSize: 10, fontWeight: 600 }}>3</span>
                  <WT size={11.5} weight={500}>CB-03 → B-021 rack feed</WT>
                  <div style={{ flex: 1 }} />
                  <WT size={10} mono color="ink-faint">2 replies</WT>
                </div>
                <WStamp k="status" v="open" />
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <WAvatar initials="BL" size={26} seed="bl" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <WT size={12} weight={500}>Brad L · CxA</WT>
                      <WT size={10.5} mono color="ink-faint">2h</WT>
                    </div>
                    <WT size={12.5} style={{ marginTop: 2 }}>Breaker label on PDU panel reads <b>CB-03</b>, but field rack feed is going to <b>B-031</b>, not B-021 as drawn. Need confirmation before energize.</WT>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <WAvatar initials="AC" size={26} seed="ac" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <WT size={12} weight={500}>Ana C · Elec lead</WT>
                      <WT size={10.5} mono color="ink-faint">1h</WT>
                    </div>
                    <WT size={12.5} style={{ marginTop: 2 }}>Confirmed in field. Rev 02 had B-021. Rev 03 was supposed to update — looks like sheet didn't reflect. Cc'd Acme Elec.</WT>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--ui-ai-soft)', border: '1px solid var(--ui-ai-line)' }}>
                  <WIcon glyph="✦" color="ai" />
                  <div style={{ flex: 1 }}>
                    <WT size={10.5} mono color="ai" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>copilot suggestion</WT>
                    <WT size={12} style={{ marginTop: 2 }}>Promote to RFI? I'll pre-fill the scope, attach this pin + photo, route to GC.</WT>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <WBtn variant="ghost" tone="ink-soft" size="sm">reply</WBtn>
                  <WBtn variant="outline" tone="primary" size="sm" icon="✎">promote to RFI</WBtn>
                  <WBtn variant="ghost" tone="ok" size="sm" icon="✓">resolve</WBtn>
                </div>
              </div>
            </WBox>

            {/* Other pins collapsed */}
            {[
              { n: 1, tone: 'warn', t: 'CB-01 label mismatch vs PDU panel', by: 'BL · 4d', reply: 1, sev: 'critical' },
              { n: 2, tone: 'ai', t: 'CB-02 rating raised 225A → 250A — verify upstream', by: '✦ auto-flag · 2d', reply: 0, sev: 'review' },
              { n: 4, tone: 'ok', t: 'CB-04 verified during megger', by: 'AC · 2d · resolved', reply: 3, sev: 'resolved' },
            ].map((p, i) => (
              <WBox key={i} seed={`p${i}`} style={{ padding: 10, opacity: p.sev === 'resolved' ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50% 50% 50% 0', background: `var(--ui-${p.tone})`, color: `var(--ui-on-${p.tone})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{p.n}</span>
                  <WT size={12} weight={500} style={{ flex: 1 }}>{p.t}</WT>
                  {p.reply > 0 ? <WT size={10} mono color="ink-faint">{p.reply}</WT> : null}
                </div>
                <WT size={11} color="ink-soft" style={{ marginTop: 4, marginLeft: 26 }}>{p.by}</WT>
              </WBox>
            ))}
          </div>

          {/* Composer */}
          <div style={{ borderTop: '1px solid var(--ui-line)', padding: 12, background: 'var(--ui-panel)' }}>
            <WWell style={{ padding: '8px 12px' }}>
              <WT size={12} color="ink-soft">add a comment · @mention to notify</WT>
            </WWell>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
              <WBtn variant="ghost" tone="ink-soft" size="sm">📎</WBtn>
              <WBtn variant="ghost" tone="ink-soft" size="sm">📷</WBtn>
              <WBtn variant="ghost" tone="ai" size="sm" icon="✦">summarize thread</WBtn>
              <div style={{ flex: 1 }} />
              <WBtn variant="outline" tone="primary" size="sm">comment</WBtn>
              <WBtn tone="primary" size="sm" icon="✎">→ RFI</WBtn>
            </div>
          </div>
        </div>
      </div>
    </WFrame>
  );
}

Object.assign(window, { DrawingCollab });
