/* CX Pro — Direction A: BLUEPRINT
   Paper + ink. Engineered precision. Light primary, dark variant. */

const { useState, useEffect, useRef, useMemo } = React;
const D = window.CXP_DATA;

/* ───────────────────────────── ICONS (inline svg) ─────────────────────── */
const Icon = {
  reticle: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1v6M12 17v6M1 12h6M17 12h6"/></svg>),
  search: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  dash: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
  equip: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 3v18"/></svg>),
  check: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18"/></svg>),
  flask: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h6M10 3v6l-5 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3"/></svg>),
  alert: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>),
  drawing: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h18v16H3z"/><path d="M3 9h18M9 4v16"/></svg>),
  report: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4M8 12h8M8 16h8M8 8h4"/></svg>),
  ai: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l2.5 5 5.5.8-4 4 1 5.5L12 14.8 7 17.3l1-5.5-4-4 5.5-.8z"/></svg>),
  send: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l18-9-7 18-2-7z"/></svg>),
  chev: ({ d = "right" }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{transform: d === "down" ? "rotate(90deg)" : d === "left" ? "rotate(180deg)" : "none"}}><path d="m9 6 6 6-6 6"/></svg>),
  plus: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>),
  paperclip: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L11 18a2 2 0 0 1-3-3l7-7"/></svg>),
  camera: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>),
  sun: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>),
  moon: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>),
  filter: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>),
  bolt: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>),
  doc: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4"/></svg>),
  close: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5 5 19"/></svg>),
};

/* ───────────────────────── PROJECT THUMB (svg, no images) ──────────── */
function ProjectThumb({ kind }) {
  const palettes = {
    aurora:    ["#E6E1D4", "#1240FF", "#1a1a1a"],
    meridian:  ["#1a1a1a", "#1240FF", "#3a3a3a"],
    northpoint:["#E6E1D4", "#1a1a1a", "#1240FF"],
    foundry:   ["#1240FF", "#1a1a1a", "#E6E1D4"],
  };
  const c = palettes[kind] || palettes.aurora;
  if (kind === "aurora") return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice"><rect width="200" height="110" fill={c[0]}/><path d="M0 90 L200 90" stroke={c[2]} strokeWidth="0.5" opacity="0.3"/>{[...Array(20)].map((_,i)=><line key={i} x1={i*10} y1="90" x2={i*10} y2="110" stroke={c[2]} strokeWidth="0.3" opacity="0.2"/>)}<rect x="50" y="40" width="40" height="50" fill="none" stroke={c[2]} strokeWidth="0.8"/><rect x="55" y="48" width="6" height="8" fill={c[1]} opacity="0.7"/><rect x="65" y="48" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="75" y="48" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="55" y="60" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="65" y="60" width="6" height="8" fill={c[1]} opacity="0.7"/><rect x="75" y="60" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="55" y="72" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="65" y="72" width="6" height="8" fill={c[2]} opacity="0.4"/><rect x="75" y="72" width="6" height="8" fill={c[1]} opacity="0.7"/><rect x="100" y="30" width="60" height="60" fill="none" stroke={c[2]} strokeWidth="0.8"/><rect x="105" y="36" width="6" height="6" fill={c[1]} opacity="0.7"/><rect x="115" y="36" width="6" height="6" fill={c[2]} opacity="0.4"/><rect x="125" y="36" width="6" height="6" fill={c[2]} opacity="0.4"/><rect x="135" y="36" width="6" height="6" fill={c[2]} opacity="0.4"/><rect x="145" y="36" width="6" height="6" fill={c[1]} opacity="0.5"/>{[1,2,3,4,5,6,7].map(i=><rect key={i} x={105+(i%5)*10} y={46+Math.floor(i/5)*10} width="6" height="6" fill={c[2]} opacity={i%2?0.4:0.7}/>)}<path d="M40 90 L40 25 L100 25" fill="none" stroke={c[1]} strokeWidth="1" strokeDasharray="3 2"/><circle cx="40" cy="25" r="2" fill={c[1]}/></svg>
  );
  if (kind === "meridian") return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice"><rect width="200" height="110" fill={c[0]}/>{[...Array(11)].map((_,i)=><line key={i} x1="0" y1={i*10} x2="200" y2={i*10} stroke="#fff" strokeWidth="0.2" opacity="0.1"/>)}{[...Array(21)].map((_,i)=><line key={i} x1={i*10} y1="0" x2={i*10} y2="110" stroke="#fff" strokeWidth="0.2" opacity="0.1"/>)}{[...Array(8)].map((_,r)=>[...Array(15)].map((_,c)=><rect key={r+'-'+c} x={20+c*11} y={20+r*9} width="6" height="5" fill={c[1]} opacity={Math.random()>0.4?0.7:0.2}/>))}<rect x="14" y="14" width="172" height="84" fill="none" stroke={c[1]} strokeWidth="0.5"/></svg>
  );
  if (kind === "northpoint") return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice"><rect width="200" height="110" fill={c[0]}/>{[...Array(38)].map((_,i)=><rect key={i} x={60} y={110-i*2.6-2} width="80" height="2" fill="none" stroke={c[1]} strokeWidth="0.4"/>)}<rect x="60" y="10" width="80" height="100" fill="none" stroke={c[1]} strokeWidth="1"/><path d="M30 100 L60 100 M140 100 L170 100" stroke={c[1]} strokeWidth="0.5" strokeDasharray="2 2"/><circle cx="100" cy="20" r="3" fill={c[2]}/><path d="M85 35 L115 35 M85 35 L100 20 L115 35" fill="none" stroke={c[2]} strokeWidth="0.6"/></svg>
  );
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice"><rect width="200" height="110" fill={c[0]}/>{[...Array(20)].map((_,i)=><line key={i} x1="0" y1={i*6} x2="200" y2={i*6} stroke="#fff" strokeWidth="0.3" opacity="0.15"/>)}<polygon points="20,90 60,40 100,70 140,30 180,80" fill="none" stroke="#fff" strokeWidth="1.2"/><circle cx="60" cy="40" r="3" fill="#fff"/><circle cx="140" cy="30" r="3" fill="#fff"/><path d="M20 90 L180 90" stroke="#fff" strokeWidth="0.4" strokeDasharray="3 2" opacity="0.5"/></svg>
  );
}

/* ───────────────────────── EQUIPMENT GLYPH ──────────── */
function EquipGlyph({ type, big }) {
  const s = big ? 80 : 36;
  const stroke = "currentColor";
  const sw = big ? 1 : 1.2;
  if (type === "Air Handling Unit") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}><rect x="6" y="22" width="68" height="36"/><line x1="20" y1="22" x2="20" y2="58"/><line x1="40" y1="22" x2="40" y2="58"/><line x1="60" y1="22" x2="60" y2="58"/><circle cx="13" cy="40" r="5"/><path d="M13 35 L13 45 M8 40 L18 40 M9.5 36.5 L16.5 43.5 M9.5 43.5 L16.5 36.5"/><rect x="24" y="30" width="12" height="20" fill="none" strokeDasharray="2 2"/><path d="M44 28 L56 28 M44 32 L56 32 M44 36 L56 36 M44 40 L56 40 M44 44 L56 44 M44 48 L56 48 M44 52 L56 52"/><circle cx="67" cy="40" r="5"/><path d="M63 40 L71 40 M67 36 L67 44"/><path d="M6 22 L6 14 L24 14 M74 22 L74 14 L56 14" /><path d="M6 58 L6 66 M74 58 L74 66"/></svg>);
  if (type === "Chiller") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}><rect x="10" y="14" width="60" height="52"/><circle cx="25" cy="32" r="8"/><circle cx="55" cy="32" r="8"/><path d="M25 24 L25 40 M17 32 L33 32 M55 24 L55 40 M47 32 L63 32"/><path d="M10 52 L70 52"/><path d="M16 60 L24 60 M30 60 L38 60 M44 60 L52 60 M58 60 L66 60"/></svg>);
  if (type === "Pump") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}><circle cx="40" cy="40" r="18"/><circle cx="40" cy="40" r="3" fill={stroke}/><path d="M40 22 L40 30 M40 50 L40 58 M22 40 L30 40 M50 40 L58 40 M27 27 L33 33 M47 47 L53 53 M27 53 L33 47 M47 33 L53 27"/><path d="M40 58 L40 70 L20 70 M40 58 L40 70 L60 70" /><path d="M6 40 L22 40"/></svg>);
  if (type === "Boiler") return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}><rect x="14" y="10" width="52" height="60" rx="2"/><circle cx="40" cy="34" r="12"/><path d="M40 28 Q34 34 40 40 Q46 34 40 28"/><path d="M14 50 L66 50"/><circle cx="24" cy="60" r="3"/><circle cx="40" cy="60" r="3"/><circle cx="56" cy="60" r="3"/></svg>);
  return (<svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}><rect x="14" y="14" width="52" height="52"/><path d="M14 30 L66 30 M14 50 L66 50 M30 14 L30 66 M50 14 L50 66"/></svg>);
}

/* ───────────────────────── SIDEBAR ──────────── */
function Sidebar({ route, setRoute }) {
  const [proj] = useState(D.projects[0]);
  const items = [
    { id: "dashboard", label: "Dashboard", icon: Icon.dash },
    { id: "equipment", label: "Equipment", icon: Icon.equip, count: 487 },
    { id: "checklist", label: "Checklists", icon: Icon.check, count: 2106 },
    { id: "tests", label: "Tests", icon: Icon.flask, count: 312 },
    { id: "issues", label: "Issues", icon: Icon.alert, count: 34, alert: true },
    { id: "drawings", label: "Drawings", icon: Icon.drawing },
    { id: "reports", label: "Reports", icon: Icon.report },
    { id: "integrations", label: "Integrations", icon: Icon.ai, count: 4 },
  ];
  return (
    <aside className="bp-sidebar">
      <div className="bp-brand" onClick={() => setRoute({ name: "projects" })}>
        <div className="bp-brand-mark"><Icon.reticle /></div>
        <div>
          <div className="bp-brand-name">CX·PRO</div>
          <div className="bp-brand-sub">commissioning</div>
        </div>
      </div>

      <div className="bp-proj-card" onClick={() => setRoute({ name: "dashboard" })}>
        <div className="bp-proj-num">PROJ · {proj.number}</div>
        <div className="bp-proj-name">{proj.name}</div>
        <div className="bp-proj-row">
          <span>{proj.phase}</span>
          <span className="bp-mono">{Math.round(proj.progress*100)}%</span>
        </div>
        <div className="bp-proj-bar"><i style={{width:`${proj.progress*100}%`}}/></div>
      </div>

      <nav className="bp-nav">
        <div className="bp-nav-label">— navigation —</div>
        {items.map(it => {
          const IC = it.icon;
          const active = route.name === it.id || (it.id === "checklist" && route.name === "checklist-detail");
          return (
            <button key={it.id} className={`bp-nav-item ${active ? "is-active" : ""}`} onClick={() => setRoute({ name: it.id })}>
              <span className="bp-nav-icon"><IC /></span>
              <span className="bp-nav-label-txt">{it.label}</span>
              {it.count !== undefined && <span className={`bp-nav-count ${it.alert ? "is-alert" : ""}`}>{it.count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="bp-side-foot">
        <div className="bp-side-foot-row">
          <span className="bp-tick"/>
          <span>synced · 2s ago</span>
        </div>
        <div className="bp-side-foot-row bp-mono bp-dim">
          v.10.5.1 · build 240412
        </div>
      </div>
    </aside>
  );
}

/* ───────────────────────── TOPBAR ──────────── */
function Topbar({ route, setRoute, theme, setTheme, setAiOpen }) {
  let crumbs = [{ label: "Aurora Medical Center / Ph II", to: { name: "dashboard" }}];
  if (route.name === "projects") crumbs = [{ label: "All projects" }];
  else if (route.name === "dashboard") crumbs.push({ label: "Dashboard" });
  else if (route.name === "equipment") crumbs.push({ label: "Equipment" });
  else if (route.name === "checklist") crumbs.push({ label: "Checklists" });
  else if (route.name === "checklist-detail") {
    crumbs.push({ label: "Checklists", to: { name: "checklist" }});
    crumbs.push({ label: D.checklist.number });
  }

  return (
    <header className="bp-topbar">
      <div className="bp-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} className="bp-crumb">
            {i > 0 && <span className="bp-crumb-sep">/</span>}
            {c.to ? <button onClick={() => setRoute(c.to)}>{c.label}</button> : <span>{c.label}</span>}
          </span>
        ))}
      </div>
      <div className="bp-topbar-tools">
        <div className="bp-search">
          <Icon.search />
          <input placeholder="Search assets, issues, lines…  ⌘K" readOnly />
          <span className="bp-kbd">⌘K</span>
        </div>
        <button className="bp-ai-btn" onClick={() => setAiOpen(true)}>
          <span className="bp-ai-dot"/><Icon.ai /> Ask CX·Pro
        </button>
        <button className="bp-icon-btn" onClick={() => setTheme(t => t === "light" ? "dark" : "light")} title="Toggle theme">
          {theme === "light" ? <Icon.moon/> : <Icon.sun/>}
        </button>
        <div className="bp-user">MO</div>
      </div>
    </header>
  );
}

/* ───────────────────────── PROJECTS SCREEN ──────────── */
function ProjectsScreen({ setRoute }) {
  return (
    <div className="bp-screen">
      <div className="bp-page-head">
        <div>
          <div className="bp-eyebrow">— ACCOUNT · WORKINGBUILDINGS / OKAFOR CX</div>
          <h1 className="bp-h1">All Projects</h1>
          <div className="bp-subtle">14 active · 3 in pre-construction · 41 archived</div>
        </div>
        <div className="bp-page-tools">
          <button className="bp-btn-ghost"><Icon.filter/> Filter</button>
          <button className="bp-btn-primary"><Icon.plus/> New Project</button>
        </div>
      </div>

      <div className="bp-proj-grid">
        {D.projects.map(p => (
          <div key={p.id} className="bp-proj-tile" onClick={() => setRoute({ name: "dashboard" })}>
            <div className="bp-proj-tile-thumb"><ProjectThumb kind={p.img}/></div>
            <div className="bp-proj-tile-body">
              <div className="bp-proj-tile-num">PROJ · {p.number}</div>
              <div className="bp-proj-tile-name">{p.name}</div>
              <div className="bp-proj-tile-meta">
                <span>{p.client}</span>
                <span className="bp-dot"/>
                <span>{p.location}</span>
                <span className="bp-dot"/>
                <span>{p.type}</span>
              </div>
              <div className="bp-proj-tile-grid">
                <div><div className="bp-mini-label">phase</div><div className="bp-mini-val">{p.phase}</div></div>
                <div><div className="bp-mini-label">progress</div><div className="bp-mini-val bp-mono">{Math.round(p.progress*100)}%</div></div>
                <div><div className="bp-mini-label">equipment</div><div className="bp-mini-val bp-mono">{p.equipment.toLocaleString()}</div></div>
                <div><div className="bp-mini-label">open issues</div><div className={`bp-mini-val bp-mono ${p.issues.critical?"bp-warn":""}`}>{p.issues.open}{p.issues.critical?` (${p.issues.critical}!)`:""}</div></div>
              </div>
              <div className="bp-proj-tile-bar"><i style={{width:`${p.progress*100}%`}}/></div>
              <div className="bp-proj-tile-foot">
                <span className="bp-mono">▸ {p.milestone}</span>
                <span>lead · {p.lead}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── DASHBOARD SCREEN ──────────── */
function DashboardScreen({ setRoute, setAiOpen }) {
  const p = D.projects[0];
  return (
    <div className="bp-screen">
      <div className="bp-page-head">
        <div>
          <div className="bp-eyebrow">— PROJECT · {p.number} · {p.location}</div>
          <h1 className="bp-h1">{p.name}</h1>
          <div className="bp-subtle">{p.client} · {p.type} · phase: <b>{p.phase}</b></div>
        </div>
        <div className="bp-page-tools">
          <button className="bp-btn-ghost"><Icon.report/> Export</button>
          <button className="bp-btn-primary" onClick={()=>setAiOpen(true)}><Icon.ai/> Generate from Spec</button>
        </div>
      </div>

      <div className="bp-stats-row">
        {[
          { label: "Commissioning Progress", value: `${Math.round(p.progress*100)}`, unit: "%", sub: "+4.2 this week", bar: p.progress },
          { label: "Open Issues", value: p.issues.open, unit: "", sub: `${p.issues.critical} critical · ${p.issues.total} total`, warn: p.issues.critical>0 },
          { label: "Checklists", value: p.checklists.complete.toLocaleString(), unit: `/ ${p.checklists.total.toLocaleString()}`, sub: "61% complete", bar: p.checklists.complete/p.checklists.total },
          { label: "Functional Tests", value: p.tests.complete, unit: `/ ${p.tests.total}`, sub: "29% complete", bar: p.tests.complete/p.tests.total },
        ].map((s,i) => (
          <div key={i} className="bp-stat">
            <div className="bp-stat-label">{s.label}</div>
            <div className="bp-stat-val">
              <span className="bp-mono">{s.value}</span>
              {s.unit && <span className="bp-stat-unit">{s.unit}</span>}
            </div>
            {s.bar !== undefined && <div className="bp-bar"><i style={{width:`${s.bar*100}%`}}/></div>}
            <div className={`bp-stat-sub ${s.warn?"bp-warn":""}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bp-dash-grid">
        <div className="bp-card bp-card-wide">
          <div className="bp-card-head">
            <div>
              <div className="bp-eyebrow">— MILESTONES</div>
              <h3 className="bp-h3">Substantial Completion · Jun 14, 2026</h3>
            </div>
            <button className="bp-btn-ghost-sm">View all 12</button>
          </div>
          <div className="bp-mile">
            {[
              { id: "M-01", title: "Mechanical Pre-Functional Complete", target: "May 22", pct: 0.94, ok: true },
              { id: "M-02", title: "Electrical Energization", target: "May 28", pct: 0.78, ok: true },
              { id: "M-03", title: "AHU Functional Testing — Bldg A", target: "Jun 02", pct: 0.41, risk: true },
              { id: "M-04", title: "Fire Life Safety Witnessing", target: "Jun 06", pct: 0.18, risk: true },
              { id: "M-05", title: "Air & Water Balance Review", target: "Jun 10", pct: 0.0 },
              { id: "M-06", title: "Substantial Completion", target: "Jun 14", pct: 0.0, milestone: true },
            ].map(m => (
              <div key={m.id} className="bp-mile-row">
                <div className="bp-mile-id bp-mono">{m.id}</div>
                <div className="bp-mile-title">{m.title}{m.milestone && <span className="bp-mile-flag">▼ KEY DATE</span>}</div>
                <div className="bp-mile-bar"><i style={{width:`${m.pct*100}%`}} className={m.risk?"bp-bar-warn":""}/></div>
                <div className="bp-mile-pct bp-mono">{Math.round(m.pct*100)}%</div>
                <div className={`bp-mile-tgt bp-mono ${m.risk?"bp-warn":""}`}>{m.target}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bp-card">
          <div className="bp-card-head">
            <div className="bp-eyebrow">— AI INSIGHTS</div>
            <span className="bp-pulse"/>
          </div>
          <div className="bp-ai-insight">
            <div className="bp-ai-tag">RISK FORECAST</div>
            <p>AHU functional testing in Bldg A is <b>9 days behind</b> the milestone curve. At current velocity, expected slip is <b>~7 days</b>.</p>
            <div className="bp-ai-actions">
              <button>Show affected tests</button>
            </div>
          </div>
          <div className="bp-ai-insight">
            <div className="bp-ai-tag">PATTERN</div>
            <p>Westgate Mechanical has <b>4 open issues</b> with similar root cause: vibration isolator selection for &gt;60 ton AHUs.</p>
            <div className="bp-ai-actions">
              <button>Cluster issues</button><button>Notify foreman</button>
            </div>
          </div>
          <div className="bp-ai-insight">
            <div className="bp-ai-tag">SUGGESTION</div>
            <p>14 nameplate photos uploaded today have not been matched to equipment. CX·Pro can extract data and link them automatically.</p>
            <div className="bp-ai-actions">
              <button>Run nameplate matcher</button>
            </div>
          </div>
        </div>

        <div className="bp-card">
          <div className="bp-card-head">
            <div className="bp-eyebrow">— ACTIVITY</div>
            <button className="bp-btn-ghost-sm">Audit log</button>
          </div>
          <div className="bp-activity">
            {D.activity.map((a, i) => (
              <div key={i} className={`bp-activity-row ${a.ai?"is-ai":""}`}>
                <div className="bp-activity-who">
                  {a.ai ? <span className="bp-ai-chip"><Icon.ai/></span> : <span className="bp-avatar">{a.who.split(" ").map(s=>s[0]).join("")}</span>}
                </div>
                <div className="bp-activity-body">
                  <b>{a.who}</b> {a.what} <span className="bp-mono">{a.target}</span>
                </div>
                <div className="bp-activity-when bp-mono">{a.when}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bp-card">
          <div className="bp-card-head">
            <div className="bp-eyebrow">— CRITICAL ISSUES</div>
            <button className="bp-btn-ghost-sm">All 34</button>
          </div>
          <div className="bp-issues">
            {D.issues.map(iss => (
              <div key={iss.id} className="bp-issue-row">
                <div className={`bp-pri bp-pri-${iss.priority.toLowerCase()}`}>{iss.priority[0]}</div>
                <div className="bp-issue-body">
                  <div className="bp-issue-title">{iss.title}</div>
                  <div className="bp-issue-meta bp-mono">#{iss.id} · {iss.asset} · {iss.assigned}</div>
                </div>
                <div className="bp-issue-age bp-mono">{iss.age}d</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── EQUIPMENT SCREEN ──────────── */
function EquipmentScreen({ setRoute }) {
  const [filter, setFilter] = useState("All");
  const [hover, setHover] = useState(null);
  const types = ["All", "Air Handling Unit", "Chiller", "Boiler", "Pump", "VAV Box", "Generator", "Fire Alarm Panel"];
  const filtered = filter === "All" ? D.equipment : D.equipment.filter(e => e.type === filter);

  return (
    <div className="bp-screen">
      <div className="bp-page-head">
        <div>
          <div className="bp-eyebrow">— PROJECT · 24-118 · ASSETS</div>
          <h1 className="bp-h1">Equipment <span className="bp-mono bp-dim">[ {D.equipment.length} of 487 visible ]</span></h1>
        </div>
        <div className="bp-page-tools">
          <button className="bp-btn-ghost"><Icon.camera/> Scan Nameplate</button>
          <button className="bp-btn-ghost"><Icon.doc/> Import CSV</button>
          <button className="bp-btn-primary"><Icon.plus/> Add Equipment</button>
        </div>
      </div>

      <div className="bp-equip-filters">
        {types.map(t => (
          <button key={t} className={`bp-chip ${filter===t?"is-on":""}`} onClick={()=>setFilter(t)}>{t}{filter===t && <span className="bp-mono">·{filtered.length}</span>}</button>
        ))}
      </div>

      <div className="bp-equip-table">
        <div className="bp-equip-head bp-mono">
          <div>tag</div>
          <div>type</div>
          <div>location</div>
          <div>status</div>
          <div>install</div>
          <div>startup</div>
          <div>pfc</div>
          <div>fpt</div>
          <div>iss</div>
          <div></div>
        </div>
        {filtered.map(e => (
          <div key={e.id} className={`bp-equip-row ${e.hero?"is-hero":""}`} onMouseEnter={()=>setHover(e.id)} onMouseLeave={()=>setHover(null)} onClick={()=>e.hero && setRoute({ name: "checklist-detail" })}>
            <div className="bp-equip-tag bp-mono">
              <span className="bp-equip-glyph"><EquipGlyph type={e.type}/></span>
              {e.id}
            </div>
            <div className="bp-equip-cell">{e.type}<div className="bp-dim bp-mono">{e.mfg} · {e.model}</div></div>
            <div className="bp-equip-cell bp-mono">{e.building} / {e.floor}<div className="bp-dim">{e.area}</div></div>
            <div className="bp-equip-cell"><span className={`bp-status bp-status-${e.status.toLowerCase().replace(/ /g,"-")}`}>{e.status}</span></div>
            <ProgCell v={e.install}/>
            <ProgCell v={e.startup}/>
            <ProgCell v={e.pfc}/>
            <ProgCell v={e.fpt}/>
            <div className="bp-equip-cell"><span className={`bp-iss-pill ${e.issues>0?"is-warn":""}`}>{e.issues}</span></div>
            <div className="bp-equip-cell"><Icon.chev /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgCell({ v }) {
  if (v === 0) return <div className="bp-equip-cell"><div className="bp-prog bp-prog-0">—</div></div>;
  if (v === 1) return <div className="bp-equip-cell"><div className="bp-prog bp-prog-done">✓</div></div>;
  return <div className="bp-equip-cell"><div className="bp-prog"><i style={{width:`${v*100}%`}}/><span className="bp-mono">{Math.round(v*100)}%</span></div></div>;
}

/* ───────────────────────── CHECKLIST DETAIL (HERO) ──────────── */
function ChecklistDetail({ setRoute, setAiOpen }) {
  const cl = D.checklist;
  const equip = D.equipment.find(e => e.id === "AHU-03");
  const [answers, setAnswers] = useState(() => {
    const o = {};
    cl.sections.forEach(s => s.lines.forEach(l => { o[l.n] = l.answer; }));
    return o;
  });
  const [activeSection, setActiveSection] = useState("general");
  const [openLine, setOpenLine] = useState(null);

  const all = cl.sections.flatMap(s => s.lines);
  const done = all.filter(l => answers[l.n] && answers[l.n] !== null).length;
  const total = all.length;
  const pct = done / total;

  function setAnswer(n, v) {
    setAnswers(a => ({...a, [n]: v}));
  }

  return (
    <div className="bp-screen bp-checklist">
      {/* Equipment masthead */}
      <div className="bp-cl-mast">
        <div className="bp-cl-mast-left">
          <div className="bp-cl-glyph"><EquipGlyph type="Air Handling Unit" big/></div>
          <div>
            <div className="bp-eyebrow bp-mono">— EQUIPMENT · AHU-03 · {equip.building} / {equip.floor} / {equip.area}</div>
            <h1 className="bp-h1">{cl.title}</h1>
            <div className="bp-cl-meta">
              <span className="bp-mono">{cl.number}</span><span className="bp-dot"/>
              <span>{cl.template}</span><span className="bp-dot"/>
              <span>{cl.discipline}</span><span className="bp-dot"/>
              <span>assigned · {cl.assignedTo}</span>
            </div>
          </div>
        </div>
        <div className="bp-cl-mast-right">
          <div className="bp-cl-prog">
            <div className="bp-cl-prog-pct"><span className="bp-mono">{Math.round(pct*100)}</span><sup>%</sup></div>
            <div className="bp-cl-prog-bar"><i style={{width:`${pct*100}%`}}/></div>
            <div className="bp-cl-prog-label bp-mono">{done} / {total} answered</div>
          </div>
          <div className="bp-cl-actions">
            <button className="bp-btn-ghost"><Icon.paperclip/> Attach</button>
            <button className="bp-btn-ghost" onClick={()=>setAiOpen(true)}><Icon.ai/> AI Assist</button>
            <button className="bp-btn-primary">[ MARK COMPLETE ]</button>
          </div>
        </div>
      </div>

      {/* Sub-equipment info strip */}
      <div className="bp-cl-strip">
        {[
          { l: "MFR", v: equip.mfg },
          { l: "MODEL", v: equip.model },
          { l: "SERIAL", v: "TC-2606-AHU-03842" },
          { l: "TAG", v: "AHU-03 · M-301.2" },
          { l: "STATUS", v: equip.status },
          { l: "STARTED", v: cl.started },
          { l: "CX-AUTH", v: cl.cxAuthority },
        ].map((x,i) => (
          <div key={i} className="bp-cl-strip-cell">
            <div className="bp-mini-label">{x.l}</div>
            <div className="bp-mini-val bp-mono">{x.v}</div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="bp-cl-tabs">
        {cl.sections.map(s => {
          const sDone = s.lines.filter(l => answers[l.n]).length;
          const sTotal = s.lines.length;
          return (
            <button key={s.id} className={`bp-cl-tab ${activeSection===s.id?"is-on":""}`} onClick={()=>setActiveSection(s.id)}>
              <span className="bp-mono">§{s.id.slice(0,3).toUpperCase()}</span>
              <span className="bp-cl-tab-title">{s.title}</span>
              <span className="bp-cl-tab-count bp-mono">{sDone}/{sTotal}</span>
            </button>
          );
        })}
      </div>

      {/* Lines */}
      <div className="bp-cl-body">
        {cl.sections.filter(s => s.id === activeSection).map(section => (
          <div key={section.id} className="bp-cl-section">
            <div className="bp-cl-section-head">
              <div className="bp-eyebrow">— § {section.title.toUpperCase()}</div>
              <div className="bp-mono bp-dim">{section.lines.length} LINES</div>
            </div>
            {section.lines.map(line => (
              <ChecklistLine key={line.n} line={line} answer={answers[line.n]} onAnswer={(v)=>setAnswer(line.n, v)} open={openLine===line.n} onToggle={()=>setOpenLine(openLine===line.n?null:line.n)} onAiOpen={()=>setAiOpen(true)}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistLine({ line, answer, onAnswer, open, onToggle, onAiOpen }) {
  const hasIssue = !!line.issues;
  return (
    <div className={`bp-cl-line ${answer==="no"?"is-flag":""} ${line.ai?"is-ai":""}`}>
      <div className="bp-cl-line-main">
        <div className="bp-cl-line-n bp-mono">{line.n}</div>
        <div className="bp-cl-line-q">
          <div className="bp-cl-line-q-text">
            {line.q}
            {line.ai && <span className="bp-ai-suggest"><Icon.ai/> AI: likely YES based on AHU-01 / AHU-02 same template</span>}
          </div>
          {line.note && <div className="bp-cl-line-note">▸ {line.note}</div>}
          {line.type === "numeric" && (
            <div className="bp-cl-numeric">
              <div className="bp-cl-numeric-input">
                <input className="bp-mono" defaultValue={line.value || ""} placeholder="—"/>
                <span className="bp-mono bp-dim">{line.units}</span>
              </div>
              <span className="bp-mono bp-dim">target · {line.target}</span>
            </div>
          )}
        </div>
        <div className="bp-cl-line-resp">
          {line.type === "ynna" && (
            <div className="bp-yn">
              {["yes","no","na"].map(v => (
                <button key={v} className={`bp-yn-btn bp-yn-${v} ${answer===v?"is-on":""}`} onClick={()=>onAnswer(v)}>
                  {v === "yes" ? "Y" : v === "no" ? "N" : "N/A"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bp-cl-line-icons">
          <button className={`bp-cl-ico ${line.note?"is-on":""}`} title="Note">●</button>
          <button className={`bp-cl-ico ${hasIssue?"is-warn":""}`} title="Issue"><Icon.alert/></button>
          <button className={`bp-cl-ico ${line.files?"is-on":""}`} title="Files"><Icon.paperclip/></button>
        </div>
        <div className="bp-cl-line-meta bp-mono bp-dim">
          {line.responder && <><span>{line.responder.split(" ").map(s=>s[0]).join("")}</span><span>{line.date}</span></>}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── AI PANEL ──────────── */
function AiPanel({ open, onClose, initialTab }) {
  const [tab, setTab] = useState(initialTab || "ask");
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello Maya. I'm watching this project. Ask me about anything in Aurora Medical Center — equipment, checklists, schedules, drawings." },
  ]);
  const [input, setInput] = useState("");
  const prompts = [
    "Show me overdue HVAC tests in Building A",
    "Which checklists are blocked on Westgate Mechanical?",
    "Summarize this week's critical issues",
    "Equipment with no responses for >5 days",
  ];
  const [genStep, setGenStep] = useState(0);
  const [scanStep, setScanStep] = useState(0);

  function send(text) {
    const t = text || input;
    if (!t.trim()) return;
    setMessages(m => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: "Found 14 overdue tests across 4 systems in Building A. AHU-03 is the largest contributor (3 tests, avg 6 days late).",
        result: "query"
      }]);
    }, 600);
  }

  function runGen() {
    setGenStep(1);
    setTimeout(()=>setGenStep(2), 1100);
    setTimeout(()=>setGenStep(3), 2400);
    setTimeout(()=>setGenStep(4), 3700);
  }
  function runScan() {
    setScanStep(1);
    setTimeout(()=>setScanStep(2), 900);
    setTimeout(()=>setScanStep(3), 2000);
  }

  return (
    <>
      <div className={`bp-ai-scrim ${open?"is-on":""}`} onClick={onClose}/>
      <aside className={`bp-ai-panel ${open?"is-on":""}`}>
        <div className="bp-ai-head">
          <div className="bp-ai-head-left">
            <div className="bp-ai-orb"><Icon.reticle/></div>
            <div>
              <div className="bp-eyebrow">— CX·PRO ASSISTANT</div>
              <div className="bp-ai-title">Aurora Medical Center · Ph II</div>
            </div>
          </div>
          <button className="bp-icon-btn" onClick={onClose}><Icon.close/></button>
        </div>

        <div className="bp-ai-tabs">
          {[["ask","Ask"],["generate","Generate"],["scan","Scan"]].map(([k,l])=>(
            <button key={k} className={`bp-ai-tab ${tab===k?"is-on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="bp-ai-body">
          {tab === "ask" && (
            <div className="bp-ai-ask">
              <div className="bp-ai-msgs">
                {messages.map((m,i) => (
                  <div key={i} className={`bp-ai-msg bp-ai-msg-${m.role}`}>
                    {m.role==="ai" && <div className="bp-ai-msg-avatar"><Icon.ai/></div>}
                    <div className="bp-ai-msg-body">
                      <div className="bp-ai-msg-text">{m.text}</div>
                      {m.result === "query" && (
                        <div className="bp-ai-result">
                          <div className="bp-ai-result-head"><span>14 OVERDUE TESTS · BUILDING A</span><button>open list →</button></div>
                          <div className="bp-ai-result-row"><span className="bp-mono">FPT-AHU-03-S2</span><span>AHU-03 supply fan</span><span className="bp-mono bp-warn">+6d</span></div>
                          <div className="bp-ai-result-row"><span className="bp-mono">FPT-AHU-03-S4</span><span>AHU-03 economizer</span><span className="bp-mono bp-warn">+9d</span></div>
                          <div className="bp-ai-result-row"><span className="bp-mono">FPT-VAV-3-118</span><span>VAV box L3</span><span className="bp-mono bp-warn">+4d</span></div>
                          <div className="bp-ai-result-foot bp-mono bp-dim">+ 11 more</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bp-ai-prompts">
                {prompts.map((p,i)=>(
                  <button key={i} className="bp-ai-prompt" onClick={()=>send(p)}>{p}</button>
                ))}
              </div>
              <div className="bp-ai-input">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything about this project…"/>
                <button onClick={()=>send()}><Icon.send/></button>
              </div>
            </div>
          )}

          {tab === "generate" && (
            <div className="bp-ai-gen">
              <div className="bp-eyebrow">— GENERATE CHECKLIST FROM SPEC</div>
              <p className="bp-ai-lede">Drop a submittal, equipment spec, or sequence of operations. CX·Pro extracts requirements and generates checklist & test lines aligned to your template library.</p>
              {genStep === 0 && (
                <button className="bp-ai-drop" onClick={runGen}>
                  <Icon.doc/>
                  <div>Drop file or click to select</div>
                  <div className="bp-mono bp-dim">.pdf · .docx · .xlsx — up to 50MB</div>
                </button>
              )}
              {genStep > 0 && (
                <div className="bp-ai-gen-doc">
                  <div className="bp-ai-doc-icon"><Icon.doc/></div>
                  <div className="bp-ai-doc-meta">
                    <b>AHU-Submittal-Rev3.pdf</b>
                    <span className="bp-mono bp-dim">42 pages · 3.4 MB · Trane T-CLIMATE-CG-060</span>
                  </div>
                </div>
              )}
              {genStep >= 1 && (
                <div className="bp-ai-steps">
                  <Step done={genStep>=2} active={genStep===1}>Parsing document structure</Step>
                  <Step done={genStep>=3} active={genStep===2}>Identifying 14 equipment scopes</Step>
                  <Step done={genStep>=4} active={genStep===3}>Matching to template library</Step>
                  <Step done={genStep>=4} active={false}>Drafting 124 lines across 4 sections</Step>
                </div>
              )}
              {genStep >= 4 && (
                <div className="bp-ai-gen-result">
                  <div className="bp-ai-gen-result-head">
                    <div>
                      <div className="bp-eyebrow">— RESULT</div>
                      <h4>124 lines drafted</h4>
                    </div>
                    <div className="bp-ai-conf bp-mono">conf · 94%</div>
                  </div>
                  <div className="bp-ai-gen-sections">
                    <div><b>General Installation</b><span className="bp-mono">18 lines</span></div>
                    <div><b>Mechanical · Ductwork & Coils</b><span className="bp-mono">42 lines</span></div>
                    <div><b>Electrical · Power & Disconnects</b><span className="bp-mono">28 lines</span></div>
                    <div><b>Controls · BAS Integration</b><span className="bp-mono">36 lines</span></div>
                  </div>
                  <div className="bp-ai-gen-cta">
                    <button className="bp-btn-ghost">Review lines</button>
                    <button className="bp-btn-primary">[ APPLY TO TEMPLATE ]</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "scan" && (
            <div className="bp-ai-scan">
              <div className="bp-eyebrow">— PHOTO → EQUIPMENT DATA</div>
              <p className="bp-ai-lede">Snap any nameplate. CX·Pro reads it, matches to your equipment list, and auto-fills MFR / Model / Serial / Electrical data.</p>
              {scanStep === 0 && (
                <button className="bp-ai-drop" onClick={runScan}>
                  <Icon.camera/>
                  <div>Open camera or upload photo</div>
                  <div className="bp-mono bp-dim">.jpg · .png · .heic</div>
                </button>
              )}
              {scanStep >= 1 && (
                <div className="bp-ai-scan-pic">
                  <div className="bp-ai-plate">
                    <div className="bp-plate-head"><b>TRANE</b><span className="bp-mono">CLIMATE CHANGER™</span></div>
                    <div className="bp-plate-grid">
                      <div><span>MODEL</span><b className="bp-mono">T-CLIMATE-CG-060</b></div>
                      <div><span>SERIAL</span><b className="bp-mono">TC-2606-AHU-03842</b></div>
                      <div><span>UNIT TAG</span><b className="bp-mono">AHU-03</b></div>
                      <div><span>VOLT/PH/HZ</span><b className="bp-mono">480/3/60</b></div>
                      <div><span>FLA</span><b className="bp-mono">38.2 A</b></div>
                      <div><span>MOCP</span><b className="bp-mono">50 A</b></div>
                      <div><span>CFM</span><b className="bp-mono">24,000</b></div>
                      <div><span>WEIGHT</span><b className="bp-mono">6,420 LB</b></div>
                    </div>
                    {scanStep >= 2 && [...Array(8)].map((_,i)=><div key={i} className="bp-plate-box" style={{top:`${30+Math.floor(i/2)*18}%`,left:`${i%2?52:5}%`,width:'43%',height:'14%'}}/>)}
                  </div>
                </div>
              )}
              {scanStep >= 2 && (
                <div className="bp-ai-steps">
                  <Step done={scanStep>=3} active={scanStep===2}>OCR · 8 fields read at 99.2% confidence</Step>
                  <Step done={scanStep>=3} active={false}>Matched to <b>AHU-03</b> in equipment list</Step>
                </div>
              )}
              {scanStep >= 3 && (
                <div className="bp-ai-gen-result">
                  <div className="bp-ai-gen-result-head">
                    <div>
                      <div className="bp-eyebrow">— READY TO APPLY</div>
                      <h4>AHU-03 · 6 fields updated, 2 confirmed</h4>
                    </div>
                  </div>
                  <div className="bp-ai-scan-fields">
                    <div className="bp-mono"><span>+ FLA</span><b>38.2 A</b></div>
                    <div className="bp-mono"><span>+ MOCP</span><b>50 A</b></div>
                    <div className="bp-mono"><span>+ CFM</span><b>24,000</b></div>
                    <div className="bp-mono"><span>+ WEIGHT</span><b>6,420 LB</b></div>
                    <div className="bp-mono"><span>~ MODEL</span><b>T-CLIMATE-CG-060</b></div>
                    <div className="bp-mono"><span>~ SERIAL</span><b>TC-2606-AHU-03842</b></div>
                  </div>
                  <div className="bp-ai-gen-cta">
                    <button className="bp-btn-ghost">Review</button>
                    <button className="bp-btn-primary">[ APPLY TO AHU-03 ]</button>
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
    <div className={`bp-step ${done?"is-done":""} ${active?"is-active":""}`}>
      <span className="bp-step-mark">{done?"✓":active?"●":"○"}</span>
      <span>{children}</span>
    </div>
  );
}

/* ───────────────────────── APP ──────────── */
function getInitialState() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  const params = new URLSearchParams(window.location.search);
  const validRoutes = ["projects","dashboard","equipment","checklist","checklist-detail","tests","issues","drawings","reports","integrations"];
  const route = validRoutes.includes(hash) ? hash : "checklist-detail";
  const aiMode = params.get("ai");
  return { route, aiMode };
}

function App() {
  const init = useMemo(() => getInitialState(), []);
  const [route, setRoute] = useState({ name: init.route });
  const [theme, setTheme] = useState("light");
  const [aiOpen, setAiOpen] = useState(!!init.aiMode);
  const [aiTab, setAiTab] = useState(init.aiMode || "ask");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className={`bp-app bp-theme-${theme}`}>
      <Sidebar route={route} setRoute={setRoute}/>
      <div className="bp-main">
        <Topbar route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} setAiOpen={setAiOpen}/>
        <div className="bp-content">
          {route.name === "projects" && <ProjectsScreen setRoute={setRoute}/>}
          {route.name === "dashboard" && <DashboardScreen setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "equipment" && <EquipmentScreen setRoute={setRoute}/>}
          {route.name === "checklist-detail" && <ChecklistDetail setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "checklist" && <ChecklistDetail setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "drawings" && window.BlueprintDrawings && <window.BlueprintDrawings setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "reports" && window.BlueprintReports && <window.BlueprintReports setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {route.name === "integrations" && window.BlueprintIntegrations && <window.BlueprintIntegrations setRoute={setRoute} setAiOpen={setAiOpen}/>}
          {!["projects","dashboard","equipment","checklist-detail","checklist","drawings","reports","integrations"].includes(route.name) && (
            <div className="bp-screen"><div className="bp-eyebrow">— STUB</div><h1 className="bp-h1">{route.name}</h1><p className="bp-subtle">Out of scope for this prototype.</p></div>
          )}
        </div>
      </div>
      <AiPanel open={aiOpen} onClose={()=>setAiOpen(false)} initialTab={aiTab}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
