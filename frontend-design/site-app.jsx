/* CX Pro — Direction B: SITE — Hi-vis industrial, brutalist edges */

const { useState, useEffect, useMemo } = React;
const D = window.CXP_DATA;

/* ───────── ICONS ───────── */
const I = {
  cube: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/></svg>),
  grid: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>),
  wrench: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2a5 5 0 1 0 4 8l-2-2 4-4-3-3-4 4-2-2A5 5 0 0 0 14 2zM5 21l8.5-8.5"/></svg>),
  check: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l5 5L21 4"/></svg>),
  alert: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 2 22h20L12 2z"/><path d="M12 9v6M12 18h.01"/></svg>),
  drawing: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 3v18"/></svg>),
  report: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 2h12l4 4v16H4z"/><path d="M16 2v4h4"/></svg>),
  search: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  bolt: () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h8l-1 8 10-13h-7z"/></svg>),
  sun: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>),
  moon: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>),
  send: () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12 21 3l-7 18-2-7z"/></svg>),
  camera: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>),
  doc: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4"/></svg>),
  plus: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>),
  close: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l14 14M19 5 5 19"/></svg>),
  arrow: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>),
  pin: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  paperclip: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L11 18a2 2 0 0 1-3-3l7-7"/></svg>),
};

/* ───────── EQUIPMENT GLYPH (industrial style) ───────── */
function Glyph({ type }) {
  const s = 36, sw = 1.6;
  if (type === "Air Handling Unit") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><rect x="4" y="20" width="72" height="40"/><line x1="22" y1="20" x2="22" y2="60"/><line x1="58" y1="20" x2="58" y2="60"/><circle cx="13" cy="40" r="6"/><path d="M13 34v12M7 40h12"/><rect x="26" y="28" width="28" height="24"/><circle cx="67" cy="40" r="5"/></svg>);
  if (type === "Chiller") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><rect x="8" y="12" width="64" height="56"/><circle cx="25" cy="32" r="9"/><circle cx="55" cy="32" r="9"/><path d="M8 54h64"/></svg>);
  if (type === "Pump") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><circle cx="40" cy="40" r="20"/><circle cx="40" cy="40" r="3" fill="currentColor"/><path d="M40 20v8M40 52v8M20 40h8M52 40h8"/></svg>);
  if (type === "Boiler") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><rect x="14" y="10" width="52" height="60"/><circle cx="40" cy="34" r="12"/><path d="M14 50h52"/></svg>);
  if (type === "Generator") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><rect x="8" y="20" width="64" height="40"/><path d="M30 30 L26 42 L40 42 L36 54 M50 30v24M50 30h8"/></svg>);
  return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={sw}><rect x="14" y="14" width="52" height="52"/><path d="M14 30h52M14 50h52M30 14v52M50 14v52"/></svg>);
}

function HazardStripe({ height = 8, className = "" }) {
  return (<div className={`s-hazard ${className}`} style={{ height }}/>);
}

/* ───────── SIDE RAIL ───────── */
function SideRail({ route, setRoute }) {
  const items = [
    { id: "projects", label: "Projects", icon: I.grid },
    { id: "dashboard", label: "Dashboard", icon: I.cube },
    { id: "equipment", label: "Equipment", icon: I.wrench },
    { id: "checklist-detail", label: "Checklists", icon: I.check, badge: "2.1K" },
    { id: "tests", label: "Tests", icon: I.bolt, badge: "312" },
    { id: "issues", label: "Issues", icon: I.alert, badge: "34", alert: true },
    { id: "drawings", label: "Drawings", icon: I.drawing },
    { id: "reports", label: "Reports", icon: I.report },
  ];
  return (
    <aside className="s-rail">
      <div className="s-rail-logo">
        <div className="s-rail-logo-mark">
          <span className="s-rail-logo-x">×</span>
        </div>
        <div className="s-rail-logo-tag">CXP</div>
      </div>
      <nav className="s-rail-nav">
        {items.map(it => {
          const IC = it.icon;
          const active = route.name === it.id;
          return (
            <button key={it.id} className={`s-rail-item ${active?"is-on":""}`} onClick={()=>setRoute({ name: it.id })} title={it.label}>
              <IC />
              <span className="s-rail-label">{it.label}</span>
              {it.badge && <span className={`s-rail-badge ${it.alert?"is-alert":""}`}>{it.badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="s-rail-foot">
        <div className="s-rail-status">
          <span className="s-rail-status-dot"/>
          <span>ONLINE</span>
        </div>
        <div className="s-rail-user">MO</div>
      </div>
    </aside>
  );
}

/* ───────── CONSOLE BAR (top) ───────── */
function ConsoleBar({ route, setRoute, theme, setTheme, setAiOpen }) {
  const proj = D.projects[0];
  return (
    <header className="s-console">
      <div className="s-console-proj" onClick={()=>setRoute({ name: "projects" })}>
        <div className="s-console-proj-num">{proj.number}</div>
        <div className="s-console-proj-name">
          <span>{proj.name}</span>
          <span className="s-console-proj-chev">▾</span>
        </div>
      </div>
      <div className="s-console-phase">
        <span className="s-tag">PHASE</span>
        <span className="s-console-phase-val">{proj.phase}</span>
      </div>
      <div className="s-console-tools">
        <div className="s-search">
          <I.search/>
          <input placeholder="search · assets · issues · lines" readOnly/>
          <span className="s-kbd">⌘K</span>
        </div>
        <button className="s-ai-launch" onClick={()=>setAiOpen(true)}>
          <span className="s-ai-launch-dot"/>
          <span>ASK CXP</span>
        </button>
        <button className="s-iconbtn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>
          {theme==="dark" ? <I.sun/> : <I.moon/>}
        </button>
      </div>
    </header>
  );
}

/* ───────── PROJECTS ───────── */
function ProjectsScreen({ setRoute }) {
  return (
    <div className="s-screen">
      <HazardStripe/>
      <div className="s-page-head">
        <div>
          <div className="s-tag">ACCOUNT · WORKINGBUILDINGS / OKAFOR CX</div>
          <h1 className="s-h1">PROJECTS</h1>
          <div className="s-sub">14 active · 3 in pre-construction · 41 archived</div>
        </div>
        <div className="s-page-tools">
          <button className="s-btn-ghost">FILTER</button>
          <button className="s-btn-primary"><I.plus/> NEW PROJECT</button>
        </div>
      </div>

      <div className="s-proj-list">
        {D.projects.map((p, i) => (
          <div key={p.id} className="s-proj-row" onClick={()=>setRoute({ name: "dashboard" })}>
            <div className="s-proj-idx">[ {String(i+1).padStart(2,"0")} ]</div>
            <div className="s-proj-num">{p.number}</div>
            <div className="s-proj-main">
              <div className="s-proj-name">{p.name}</div>
              <div className="s-proj-meta">
                <span>{p.client}</span><span className="s-dot"/>
                <span>{p.location}</span><span className="s-dot"/>
                <span>{p.type}</span>
              </div>
            </div>
            <div className="s-proj-cells">
              <div className="s-proj-cell">
                <div className="s-tag">PHASE</div>
                <div className="s-proj-cell-val">{p.phase}</div>
              </div>
              <div className="s-proj-cell">
                <div className="s-tag">EQUIP</div>
                <div className="s-proj-cell-val s-mono">{p.equipment.toLocaleString()}</div>
              </div>
              <div className="s-proj-cell">
                <div className="s-tag">ISSUES</div>
                <div className={`s-proj-cell-val s-mono ${p.issues.critical?"s-warn":""}`}>{p.issues.open}{p.issues.critical?` / ${p.issues.critical}!`:""}</div>
              </div>
              <div className="s-proj-cell">
                <div className="s-tag">PROGRESS</div>
                <div className="s-proj-cell-val s-mono">{Math.round(p.progress*100)}%</div>
              </div>
            </div>
            <div className="s-proj-gauge">
              <div className="s-proj-gauge-track"><i style={{width:`${p.progress*100}%`}}/></div>
              <div className="s-proj-gauge-label s-mono">▸ {p.milestone}</div>
            </div>
            <div className="s-proj-go"><I.arrow/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── DASHBOARD ───────── */
function DashboardScreen({ setRoute, setAiOpen }) {
  const p = D.projects[0];
  return (
    <div className="s-screen">
      <HazardStripe/>
      <div className="s-page-head">
        <div>
          <div className="s-tag">PROJECT · {p.number} · {p.location}</div>
          <h1 className="s-h1">{p.name}</h1>
          <div className="s-sub">{p.client} · {p.type} · phase: <b>{p.phase}</b></div>
        </div>
        <div className="s-page-tools">
          <button className="s-btn-ghost">EXPORT</button>
          <button className="s-btn-primary" onClick={()=>setAiOpen(true)}><I.bolt/> GENERATE</button>
        </div>
      </div>

      <div className="s-stats">
        {[
          { tag: "PROGRESS", val: `${Math.round(p.progress*100)}`, unit: "%", sub: "+4.2 / WEEK", bar: p.progress, big: true },
          { tag: "OPEN ISSUES", val: p.issues.open, sub: `${p.issues.critical} CRITICAL · ${p.issues.total} TOTAL`, warn: !!p.issues.critical },
          { tag: "CHECKLISTS", val: p.checklists.complete.toLocaleString(), unit: `/${(p.checklists.total/1000).toFixed(1)}K`, sub: "61% COMPLETE", bar: p.checklists.complete/p.checklists.total },
          { tag: "FUNCTIONAL TESTS", val: p.tests.complete, unit: `/${p.tests.total}`, sub: "29% COMPLETE", bar: p.tests.complete/p.tests.total },
        ].map((s,i) => (
          <div key={i} className={`s-stat ${s.warn?"s-stat-warn":""}`}>
            <div className="s-tag">{s.tag}</div>
            <div className="s-stat-val">
              <span className="s-mono">{s.val}</span>
              {s.unit && <span className="s-stat-unit">{s.unit}</span>}
            </div>
            {s.bar !== undefined && <div className="s-stat-bar"><i style={{width:`${s.bar*100}%`}}/></div>}
            <div className="s-stat-sub">{s.sub}</div>
            {s.warn && <div className="s-stat-flag">!</div>}
          </div>
        ))}
      </div>

      <div className="s-dash-grid">
        <div className="s-block">
          <div className="s-block-head">
            <div className="s-block-bar"/>
            <h3 className="s-h3">MILESTONES · SUB.COMPLETION JUN 14</h3>
            <button className="s-btn-ghost-sm">VIEW ALL · 12</button>
          </div>
          <div className="s-miles">
            {[
              { id: "M01", title: "Mechanical Pre-Functional Complete", target: "MAY 22", pct: 0.94, ok: true },
              { id: "M02", title: "Electrical Energization", target: "MAY 28", pct: 0.78, ok: true },
              { id: "M03", title: "AHU Functional Testing — Bldg A", target: "JUN 02", pct: 0.41, risk: true },
              { id: "M04", title: "Fire Life Safety Witnessing", target: "JUN 06", pct: 0.18, risk: true },
              { id: "M05", title: "Air & Water Balance Review", target: "JUN 10", pct: 0.0 },
              { id: "M06", title: "Substantial Completion", target: "JUN 14", pct: 0.0, key: true },
            ].map(m => (
              <div key={m.id} className={`s-mile ${m.key?"is-key":""}`}>
                <div className="s-mile-id">{m.id}</div>
                <div className="s-mile-title">{m.title}</div>
                <div className="s-mile-gauge"><i style={{width:`${m.pct*100}%`}} className={m.risk?"is-risk":m.ok?"is-ok":""}/></div>
                <div className="s-mile-pct s-mono">{Math.round(m.pct*100)}%</div>
                <div className={`s-mile-tgt s-mono ${m.risk?"s-warn":""}`}>{m.target}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="s-block s-block-ai">
          <div className="s-block-head">
            <div className="s-block-bar"/>
            <h3 className="s-h3">CXP · INSIGHTS</h3>
            <span className="s-pulse"/>
          </div>
          <div className="s-insight">
            <div className="s-insight-tag">[ RISK ]</div>
            <p>AHU functional testing in Bldg A is <b>9 days behind</b> milestone curve. Expected slip <b>~7 days</b>.</p>
            <button className="s-link">→ AFFECTED TESTS</button>
          </div>
          <div className="s-insight">
            <div className="s-insight-tag">[ PATTERN ]</div>
            <p>Westgate Mechanical · <b>4 open issues</b> share root cause: vibration isolator selection for &gt;60 ton AHUs.</p>
            <div className="s-insight-actions">
              <button className="s-link">→ CLUSTER</button>
              <button className="s-link">→ NOTIFY</button>
            </div>
          </div>
          <div className="s-insight">
            <div className="s-insight-tag">[ READY ]</div>
            <p><b>14 nameplate photos</b> uploaded today not yet matched. CXP can extract + link automatically.</p>
            <button className="s-link">→ RUN MATCHER</button>
          </div>
        </div>

        <div className="s-block">
          <div className="s-block-head">
            <div className="s-block-bar"/>
            <h3 className="s-h3">ACTIVITY · LIVE</h3>
            <button className="s-btn-ghost-sm">AUDIT</button>
          </div>
          <div className="s-activity">
            {D.activity.map((a, i) => (
              <div key={i} className={`s-act ${a.ai?"is-ai":""}`}>
                <div className="s-act-who">{a.ai ? <span className="s-act-ai"><I.bolt/></span> : <span className="s-act-av">{a.who.split(" ").map(s=>s[0]).join("")}</span>}</div>
                <div className="s-act-body"><b>{a.who}</b> {a.what} <span className="s-mono">{a.target}</span></div>
                <div className="s-act-when s-mono">{a.when}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="s-block">
          <div className="s-block-head">
            <div className="s-block-bar"/>
            <h3 className="s-h3">CRITICAL · OPEN ISSUES</h3>
            <button className="s-btn-ghost-sm">ALL · 34</button>
          </div>
          <div className="s-issues">
            {D.issues.map(iss => (
              <div key={iss.id} className="s-issue">
                <div className={`s-pri s-pri-${iss.priority.toLowerCase()}`}>{iss.priority[0]}</div>
                <div className="s-issue-body">
                  <div className="s-issue-title">{iss.title}</div>
                  <div className="s-issue-meta">#{iss.id} · {iss.asset} · {iss.assigned}</div>
                </div>
                <div className="s-issue-age s-mono">{iss.age}D</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── EQUIPMENT ───────── */
function EquipmentScreen({ setRoute }) {
  const [filter, setFilter] = useState("All");
  const types = ["All", "Air Handling Unit", "Chiller", "Boiler", "Pump", "VAV Box", "Generator"];
  const filtered = filter==="All" ? D.equipment : D.equipment.filter(e => e.type === filter);
  return (
    <div className="s-screen">
      <HazardStripe/>
      <div className="s-page-head">
        <div>
          <div className="s-tag">PROJECT · 24-118 · ASSETS</div>
          <h1 className="s-h1">EQUIPMENT</h1>
          <div className="s-sub s-mono">[ {D.equipment.length} OF 487 VISIBLE ]</div>
        </div>
        <div className="s-page-tools">
          <button className="s-btn-ghost"><I.camera/> SCAN PLATE</button>
          <button className="s-btn-ghost"><I.doc/> IMPORT</button>
          <button className="s-btn-primary"><I.plus/> ADD</button>
        </div>
      </div>

      <div className="s-equip-chips">
        {types.map(t => (
          <button key={t} className={`s-chip ${filter===t?"is-on":""}`} onClick={()=>setFilter(t)}>
            {t.toUpperCase()}
            {filter===t && <span className="s-mono">[{filtered.length}]</span>}
          </button>
        ))}
      </div>

      <div className="s-equip-grid">
        {filtered.map(e => (
          <div key={e.id} className={`s-equip-card ${e.hero?"is-hero":""}`} onClick={()=>e.hero && setRoute({ name: "checklist-detail" })}>
            <div className="s-equip-card-head">
              <div className="s-equip-glyph"><Glyph type={e.type}/></div>
              <div className="s-equip-card-id">
                <div className="s-equip-tag s-mono">{e.id}</div>
                <div className="s-equip-type">{e.type}</div>
              </div>
              {e.hero && <div className="s-equip-hero-tag">▸ ACTIVE</div>}
            </div>
            <div className="s-equip-card-body">
              <div className="s-equip-row"><span className="s-tag">LOC</span><span className="s-mono">{e.building}/{e.floor} · {e.area}</span></div>
              <div className="s-equip-row"><span className="s-tag">MFR</span><span className="s-mono">{e.mfg}</span></div>
              <div className="s-equip-row"><span className="s-tag">MODEL</span><span className="s-mono">{e.model}</span></div>
            </div>
            <div className="s-equip-status">
              <div className={`s-equip-status-pill s-status-${e.status.toLowerCase().replace(/ /g,"-")}`}>{e.status.toUpperCase()}</div>
              {e.issues > 0 && <div className="s-equip-iss">▲ {e.issues}</div>}
            </div>
            <div className="s-equip-prog">
              {[
                ["INST", e.install],
                ["STRT", e.startup],
                ["PFC", e.pfc],
                ["FPT", e.fpt],
              ].map(([l,v]) => (
                <div key={l} className="s-equip-prog-col">
                  <div className="s-tag">{l}</div>
                  <div className={`s-equip-prog-bar ${v===1?"is-done":v===0?"is-zero":""}`}>
                    <i style={{width:`${v*100}%`}}/>
                    <span className="s-mono">{v===1?"✓":v===0?"—":Math.round(v*100)+"%"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── CHECKLIST (HERO) ───────── */
function ChecklistDetail({ setRoute, setAiOpen }) {
  const cl = D.checklist;
  const equip = D.equipment.find(e => e.id === "AHU-03");
  const [answers, setAnswers] = useState(() => {
    const o = {};
    cl.sections.forEach(s => s.lines.forEach(l => { o[l.n] = l.answer; }));
    return o;
  });
  const [activeSection, setActiveSection] = useState("general");

  const all = cl.sections.flatMap(s => s.lines);
  const done = all.filter(l => answers[l.n]).length;
  const pct = done / all.length;

  function setAnswer(n, v) { setAnswers(a => ({...a, [n]: v})); }

  return (
    <div className="s-cl">
      <HazardStripe/>
      <div className="s-cl-mast">
        <div className="s-cl-mast-l">
          <div className="s-cl-glyph"><Glyph type="Air Handling Unit"/><div className="s-cl-glyph-tag">AHU</div></div>
          <div>
            <div className="s-tag">EQUIPMENT · AHU-03 · BLDG A / ROOF / CENTRAL PENTHOUSE</div>
            <h1 className="s-h1">PRE-FUNCTIONAL CHECKLIST</h1>
            <div className="s-cl-h-sub">Air Handling Unit · Trane T-CLIMATE-CG-060</div>
            <div className="s-cl-meta">
              <span className="s-mono">{cl.number}</span>
              <span className="s-cl-pill">{cl.discipline.toUpperCase()}</span>
              <span className="s-cl-pill">{cl.template.toUpperCase()}</span>
              <span>ASSIGNED · <b>{cl.assignedTo}</b></span>
            </div>
          </div>
        </div>
        <div className="s-cl-mast-r">
          <div className="s-cl-readout">
            <div className="s-cl-readout-pct">
              <span className="s-mono">{String(Math.round(pct*100)).padStart(2,"0")}</span>
              <span className="s-cl-readout-pct-pct">%</span>
            </div>
            <div className="s-cl-readout-label">[ {done} / {all.length} ANSWERED ]</div>
            <div className="s-cl-readout-gauge">
              {[...Array(20)].map((_,i)=>(<i key={i} className={i < Math.round(pct*20) ? "is-on" : ""}/>))}
            </div>
          </div>
          <div className="s-cl-actions">
            <button className="s-btn-ghost"><I.paperclip/></button>
            <button className="s-btn-ghost" onClick={()=>setAiOpen(true)}><I.bolt/> AI</button>
            <button className="s-btn-primary">▸ MARK COMPLETE</button>
          </div>
        </div>
      </div>

      <div className="s-cl-strip">
        {[
          ["MFR", equip.mfg],
          ["MODEL", equip.model],
          ["SERIAL", "TC-2606-AHU-03842"],
          ["TAG", "AHU-03 · M-301.2"],
          ["VOLT", "480/3/60"],
          ["FLA", "38.2 A"],
          ["CFM", "24,000"],
        ].map(([l, v], i) => (
          <div key={i} className="s-cl-strip-cell">
            <div className="s-tag">{l}</div>
            <div className="s-cl-strip-val s-mono">{v}</div>
          </div>
        ))}
      </div>

      <div className="s-cl-tabs">
        {cl.sections.map((s, i) => {
          const sd = s.lines.filter(l => answers[l.n]).length;
          const st = s.lines.length;
          const active = activeSection === s.id;
          return (
            <button key={s.id} className={`s-cl-tab ${active?"is-on":""}`} onClick={()=>setActiveSection(s.id)}>
              <span className="s-cl-tab-n s-mono">§{String(i+1).padStart(2,"0")}</span>
              <span className="s-cl-tab-t">{s.title}</span>
              <span className="s-cl-tab-c s-mono">{sd}/{st}</span>
              {sd===st && st>0 && <span className="s-cl-tab-done">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="s-cl-body">
        {cl.sections.filter(s => s.id === activeSection).map(section => (
          <div key={section.id} className="s-cl-section">
            <div className="s-cl-section-head">
              <span className="s-section-num">SECTION</span>
              <h2>{section.title.toUpperCase()}</h2>
              <span className="s-section-count s-mono">{section.lines.length} LINES</span>
            </div>
            {section.lines.map(line => (
              <Line key={line.n} line={line} answer={answers[line.n]} onAnswer={(v)=>setAnswer(line.n, v)}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Line({ line, answer, onAnswer }) {
  return (
    <div className={`s-line ${answer==="no"?"is-flag":""} ${line.ai?"is-ai":""}`}>
      <div className="s-line-n s-mono">{line.n}</div>
      <div className="s-line-q">
        <div className="s-line-q-txt">
          {line.q}
          {line.ai && <span className="s-ai-pill"><I.bolt/> AI · LIKELY YES (AHU-01 / AHU-02 same template)</span>}
        </div>
        {line.note && <div className="s-line-note">▸ {line.note}</div>}
        {line.type === "numeric" && (
          <div className="s-line-num">
            <div className="s-num-input">
              <input className="s-mono" defaultValue={line.value || ""} placeholder="—"/>
              <span className="s-mono">{line.units}</span>
            </div>
            <span className="s-num-target s-mono">TARGET · {line.target}</span>
          </div>
        )}
      </div>
      <div className="s-line-resp">
        {line.type === "ynna" && (
          <div className="s-yn">
            {[["yes","YES"],["no","NO"],["na","N/A"]].map(([v,l])=>(
              <button key={v} className={`s-yn-btn s-yn-${v} ${answer===v?"is-on":""}`} onClick={()=>onAnswer(v)}>{l}</button>
            ))}
          </div>
        )}
      </div>
      <div className="s-line-icons">
        <button className={`s-line-ico ${line.note?"is-on":""}`}>●</button>
        <button className={`s-line-ico ${line.issues?"is-warn":""}`}><I.alert/></button>
        <button className={`s-line-ico ${line.files?"is-on":""}`}><I.paperclip/></button>
      </div>
      <div className="s-line-meta s-mono">
        {line.responder ? <><span>{line.responder.split(" ").map(s=>s[0]).join("")}</span><span>{line.date}</span></> : <span>—</span>}
      </div>
    </div>
  );
}

/* ───────── AI PANEL ───────── */
function AiPanel({ open, onClose, initialTab }) {
  const [tab, setTab] = useState(initialTab || "ask");
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const [messages, setMessages] = useState([
    { role: "ai", text: "CXP online. Watching Aurora Medical Center · Ph II. Query equipment, schedules, tests, or anything else in the project." },
  ]);
  const [input, setInput] = useState("");
  const prompts = [
    "Overdue HVAC tests in Bldg A",
    "Checklists blocked on Westgate Mechanical",
    "This week's critical issues",
    "Equipment with no response in 5+ days",
  ];
  const [genStep, setGenStep] = useState(0);
  const [scanStep, setScanStep] = useState(0);

  function send(text) {
    const t = text || input;
    if (!t.trim()) return;
    setMessages(m => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { role: "ai", text: "14 OVERDUE TESTS · 4 SYSTEMS · BLDG A. AHU-03 leads with 3 tests, avg 6 days late.", result: "query" }]);
    }, 600);
  }
  function runGen() { setGenStep(1); setTimeout(()=>setGenStep(2),1100); setTimeout(()=>setGenStep(3),2400); setTimeout(()=>setGenStep(4),3700); }
  function runScan() { setScanStep(1); setTimeout(()=>setScanStep(2),900); setTimeout(()=>setScanStep(3),2000); }

  return (
    <>
      <div className={`s-ai-scrim ${open?"is-on":""}`} onClick={onClose}/>
      <aside className={`s-ai-panel ${open?"is-on":""}`}>
        <HazardStripe height={6}/>
        <div className="s-ai-head">
          <div className="s-ai-head-l">
            <div className="s-ai-orb"><I.bolt/></div>
            <div>
              <div className="s-tag">CXP · ASSISTANT</div>
              <div className="s-ai-title">AURORA MEDICAL · PH II</div>
            </div>
          </div>
          <button className="s-iconbtn" onClick={onClose}><I.close/></button>
        </div>

        <div className="s-ai-tabs">
          {[["ask","ASK"],["generate","GENERATE"],["scan","SCAN PLATE"]].map(([k,l])=>(
            <button key={k} className={`s-ai-tab ${tab===k?"is-on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="s-ai-body">
          {tab === "ask" && (
            <div className="s-ai-ask">
              <div className="s-ai-msgs">
                {messages.map((m,i)=>(
                  <div key={i} className={`s-ai-msg s-ai-msg-${m.role}`}>
                    {m.role==="ai" && <div className="s-ai-av"><I.bolt/></div>}
                    <div className="s-ai-msg-body">
                      <div className="s-ai-msg-txt">{m.text}</div>
                      {m.result === "query" && (
                        <div className="s-ai-result">
                          <div className="s-ai-result-head"><span>14 OVERDUE · BLDG A</span><button>OPEN LIST →</button></div>
                          <div className="s-ai-result-row"><span className="s-mono">FPT-AHU-03-S2</span><span>AHU-03 SUPPLY FAN</span><span className="s-mono s-warn">+6D</span></div>
                          <div className="s-ai-result-row"><span className="s-mono">FPT-AHU-03-S4</span><span>AHU-03 ECONOMIZER</span><span className="s-mono s-warn">+9D</span></div>
                          <div className="s-ai-result-row"><span className="s-mono">FPT-VAV-3-118</span><span>VAV BOX L3</span><span className="s-mono s-warn">+4D</span></div>
                          <div className="s-ai-result-foot s-mono">+ 11 MORE</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="s-ai-prompts">
                {prompts.map((p,i)=>(
                  <button key={i} className="s-ai-prompt" onClick={()=>send(p)}>▸ {p}</button>
                ))}
              </div>
              <div className="s-ai-input">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="QUERY THE PROJECT..."/>
                <button onClick={()=>send()}><I.send/></button>
              </div>
            </div>
          )}

          {tab === "generate" && (
            <div className="s-ai-gen">
              <div className="s-tag">GENERATE · FROM SPEC</div>
              <p className="s-ai-lede">Drop submittal · spec · sequence-of-operations. CXP extracts and drafts checklist + test lines.</p>
              {genStep === 0 ? (
                <button className="s-ai-drop" onClick={runGen}>
                  <I.doc/>
                  <div className="s-ai-drop-t">DROP FILE</div>
                  <div className="s-ai-drop-sub s-mono">.PDF · .DOCX · .XLSX · &lt;50MB</div>
                </button>
              ) : (
                <div className="s-ai-doc">
                  <div className="s-ai-doc-icon"><I.doc/></div>
                  <div>
                    <b>AHU-Submittal-Rev3.pdf</b>
                    <div className="s-mono">42 PAGES · 3.4 MB</div>
                  </div>
                </div>
              )}
              {genStep >= 1 && (
                <div className="s-ai-steps">
                  <Step done={genStep>=2} active={genStep===1}>PARSE DOCUMENT STRUCTURE</Step>
                  <Step done={genStep>=3} active={genStep===2}>IDENTIFY 14 EQUIPMENT SCOPES</Step>
                  <Step done={genStep>=4} active={genStep===3}>MATCH TO TEMPLATE LIBRARY</Step>
                  <Step done={genStep>=4} active={false}>DRAFT 124 LINES / 4 SECTIONS</Step>
                </div>
              )}
              {genStep >= 4 && (
                <div className="s-ai-result-block">
                  <div className="s-ai-result-block-head">
                    <div>
                      <div className="s-tag">OUTPUT</div>
                      <h4 className="s-mono">124 LINES DRAFTED</h4>
                    </div>
                    <div className="s-ai-conf s-mono">CONF 94%</div>
                  </div>
                  <div className="s-ai-sections">
                    {[
                      ["General Installation", 18],
                      ["Mechanical · Ductwork & Coils", 42],
                      ["Electrical · Power & Disconnects", 28],
                      ["Controls · BAS Integration", 36],
                    ].map(([t,n],i)=>(
                      <div key={i}><b>{t}</b><span className="s-mono">{n} LINES</span></div>
                    ))}
                  </div>
                  <div className="s-ai-cta">
                    <button className="s-btn-ghost">REVIEW</button>
                    <button className="s-btn-primary">▸ APPLY</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "scan" && (
            <div className="s-ai-gen">
              <div className="s-tag">PHOTO → EQUIPMENT DATA</div>
              <p className="s-ai-lede">Snap a nameplate. CXP reads it, matches your equipment, auto-fills MFR / Model / Serial / Electrical.</p>
              {scanStep === 0 ? (
                <button className="s-ai-drop" onClick={runScan}>
                  <I.camera/>
                  <div className="s-ai-drop-t">OPEN CAMERA</div>
                  <div className="s-ai-drop-sub s-mono">OR UPLOAD .JPG / .PNG / .HEIC</div>
                </button>
              ) : (
                <div className="s-plate">
                  <div className="s-plate-head"><b>TRANE</b><span className="s-mono">CLIMATE CHANGER™</span></div>
                  <div className="s-plate-grid">
                    <div><span>MODEL</span><b>T-CLIMATE-CG-060</b></div>
                    <div><span>SERIAL</span><b>TC-2606-AHU-03842</b></div>
                    <div><span>TAG</span><b>AHU-03</b></div>
                    <div><span>V/PH/HZ</span><b>480/3/60</b></div>
                    <div><span>FLA</span><b>38.2 A</b></div>
                    <div><span>MOCP</span><b>50 A</b></div>
                    <div><span>CFM</span><b>24,000</b></div>
                    <div><span>WEIGHT</span><b>6,420 LB</b></div>
                  </div>
                  {scanStep >= 2 && [...Array(8)].map((_,i)=>(<div key={i} className="s-plate-box" style={{top:`${30+Math.floor(i/2)*18}%`,left:`${i%2?52:5}%`,width:'43%',height:'14%'}}/>))}
                </div>
              )}
              {scanStep >= 2 && (
                <div className="s-ai-steps">
                  <Step done={scanStep>=3} active={scanStep===2}>OCR · 8 FIELDS · 99.2% CONF</Step>
                  <Step done={scanStep>=3} active={false}>MATCHED TO <b>AHU-03</b></Step>
                </div>
              )}
              {scanStep >= 3 && (
                <div className="s-ai-result-block">
                  <div className="s-ai-result-block-head">
                    <div>
                      <div className="s-tag">READY · 6 NEW · 2 CONFIRMED</div>
                      <h4 className="s-mono">AHU-03 FIELDS</h4>
                    </div>
                  </div>
                  <div className="s-ai-fields s-mono">
                    <div><span>+ FLA</span><b>38.2 A</b></div>
                    <div><span>+ MOCP</span><b>50 A</b></div>
                    <div><span>+ CFM</span><b>24,000</b></div>
                    <div><span>+ WT</span><b>6,420 LB</b></div>
                    <div><span>~ MODEL</span><b>CG-060</b></div>
                    <div><span>~ SN</span><b>03842</b></div>
                  </div>
                  <div className="s-ai-cta">
                    <button className="s-btn-ghost">REVIEW</button>
                    <button className="s-btn-primary">▸ APPLY TO AHU-03</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Step({ done, active, children }) {
  return (
    <div className={`s-step ${done?"is-done":""} ${active?"is-active":""}`}>
      <span className="s-step-mark s-mono">{done?"✓":active?"●":"○"}</span>
      <span>{children}</span>
    </div>
  );
}

/* ───────── APP ───────── */
function getInitialStateS() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  const params = new URLSearchParams(window.location.search);
  const validRoutes = ["projects","dashboard","equipment","checklist-detail","tests","issues","drawings","reports"];
  const route = validRoutes.includes(hash) ? hash : "checklist-detail";
  const aiMode = params.get("ai");
  return { route, aiMode };
}

function App() {
  const init = useMemo(() => getInitialStateS(), []);
  const [route, setRoute] = useState({ name: init.route });
  const [theme, setTheme] = useState("dark");
  const [aiOpen, setAiOpen] = useState(!!init.aiMode);
  const [aiTab, setAiTab] = useState(init.aiMode || "ask");
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return (
    <div className={`s-app s-theme-${theme}`}>
      <SideRail route={route} setRoute={setRoute}/>
      <div className="s-main">
        <ConsoleBar route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} setAiOpen={setAiOpen}/>
        <div className="s-content">
          {route.name === "projects" && <ProjectsScreen setRoute={setRoute}/>}
          {route.name === "dashboard" && <DashboardScreen setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "equipment" && <EquipmentScreen setRoute={setRoute}/>}
          {route.name === "checklist-detail" && <ChecklistDetail setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {!["projects","dashboard","equipment","checklist-detail"].includes(route.name) && (
            <div className="s-screen"><HazardStripe/><div className="s-page-head"><div><div className="s-tag">STUB</div><h1 className="s-h1">{route.name.toUpperCase()}</h1><div className="s-sub">Out of scope for this prototype.</div></div></div></div>
          )}
        </div>
      </div>
      <AiPanel open={aiOpen} onClose={()=>setAiOpen(false)} initialTab={aiTab}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
