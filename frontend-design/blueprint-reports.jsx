/* CX Pro — Blueprint · Reports screen
   Configurable AI report generator with user-defined custom features */

(function(){
const { useState, useRef, useEffect } = React;
const D = window.CXP_DATA;

/* ─────────── ICONS ─────────── */
const RI = {
  doc: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4"/></svg>),
  plus: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14"/></svg>),
  bolt: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>),
  download: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>),
  trash: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>),
  drag: ()=>(<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>),
  check: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12l4 4L19 6"/></svg>),
  star: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 2 2.5 5 5.5.8-4 4 1 5.5L12 14.8 7 17.3l1-5.5-4-4 5.5-.8z"/></svg>),
  edit: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 4l6 6L8 22H2v-6z"/></svg>),
  send: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l18-9-7 18-2-7z"/></svg>),
  chev: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m9 6 6 6-6 6"/></svg>),
};

/* ─────────── TEMPLATES ─────────── */
const TEMPLATES = [
  { id: "cx-progress", name: "Cx Progress Report", audience: "Owner + GC", sections: 8, frequency: "Weekly", starred: true, popular: true },
  { id: "field-day", name: "Daily Field Report", audience: "Internal", sections: 5, frequency: "Daily" },
  { id: "issue-summary", name: "Issue Summary", audience: "GC", sections: 4, frequency: "Ad-hoc" },
  { id: "fpt-report", name: "Functional Test Report", audience: "Owner", sections: 6, frequency: "Per system" },
  { id: "rcx-baseline", name: "Retro-Cx Baseline", audience: "Owner", sections: 7, frequency: "Annual" },
  { id: "final-cx", name: "Final Commissioning Report", audience: "Owner", sections: 12, frequency: "Project end", starred: true },
];

/* ─────────── DEFAULT SECTIONS (for Cx Progress Report) ─────────── */
const DEFAULT_SECTIONS = [
  { id: "cover", name: "Cover & Project Summary", kind: "cover", enabled: true, status: "ready" },
  { id: "exec", name: "Executive Summary", kind: "exec", enabled: true, status: "ready" },
  { id: "milestones", name: "Schedule & Milestones", kind: "milestones", enabled: true, status: "ready" },
  { id: "equipment", name: "Equipment Status — by System", kind: "equipment", enabled: true, status: "ready" },
  { id: "issues", name: "Open Issues — by Priority", kind: "issues", enabled: true, status: "ready" },
  { id: "fpt", name: "Functional Test Progress", kind: "fpt", enabled: true, status: "ready" },
  { id: "outstanding", name: "Outstanding Items", kind: "outstanding", enabled: false, status: "ready" },
  { id: "photos", name: "Photo Log", kind: "photos", enabled: false, status: "ready" },
];

/* ─────────── RECENT REPORTS ─────────── */
const RECENT = [
  { id: "r1", title: "Weekly Cx Progress — Wk 19", date: "May 10, 2026", template: "Cx Progress", by: "M. Okafor", auto: false },
  { id: "r2", title: "Daily Field — May 15", date: "May 15, 2026", template: "Daily Field", by: "AI · CX·Pro", auto: true },
  { id: "r3", title: "AHU-03 Issue Cluster Report", date: "May 13, 2026", template: "Custom", by: "M. Okafor" },
  { id: "r4", title: "Procurement Risk Snapshot", date: "May 09, 2026", template: "Custom", by: "AI · CX·Pro", auto: true },
];

/* ─────────── REPORT RENDERED SECTIONS ─────────── */
function ReportCoverSection() {
  return (
    <div className="bp-rep-cover">
      <div className="bp-eyebrow">— COMMISSIONING PROGRESS REPORT</div>
      <h1 className="bp-rep-cover-h1">Aurora Medical Center<br/>Phase II</h1>
      <div className="bp-rep-cover-meta">
        <div><span className="bp-mini-label">PROJECT</span><b>24-118</b></div>
        <div><span className="bp-mini-label">REPORTING PERIOD</span><b>May 11 — May 17, 2026</b></div>
        <div><span className="bp-mini-label">PHASE</span><b>Functional Testing</b></div>
        <div><span className="bp-mini-label">CX AUTHORITY</span><b>M. Okafor · CxA</b></div>
      </div>
      <div className="bp-rep-cover-foot">
        <div className="bp-mono bp-dim">PREPARED BY · WORKINGBUILDINGS / OKAFOR CX · 05·17·26</div>
      </div>
    </div>
  );
}

function ReportExecSummary({ streamingText }) {
  return (
    <div className="bp-rep-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § 02 · EXECUTIVE SUMMARY</div>
      </div>
      <div className="bp-rep-prose">
        {streamingText || (
          <>
            <p>Project is at <b>62% commissioning complete</b>, with <b>4.2 points of progress</b> recorded this week. Critical path remains the AHU functional testing in Building A, currently <b>9 days behind</b> the milestone curve.</p>
            <p>Open issue count rose by 6 this week to <b>34 total</b> (4 critical), driven primarily by a vibration-isolator selection issue affecting AHU-03 and a cluster of condensate drain trap depths on AHU-series equipment. CxA recommends an immediate contractor coordination meeting with Westgate Mechanical.</p>
            <p>Energization of Building A electrical distribution remains on track for May 28. Fire/Life-Safety witnessing scheduled to begin June 2 contingent on FACP-01 final programming, expected this week.</p>
          </>
        )}
      </div>
    </div>
  );
}

function ReportMilestones() {
  const mil = [
    { id: "M01", title: "Mech Pre-Functional Complete", target: "May 22", pct: 0.94, status: "ok" },
    { id: "M02", title: "Electrical Energization", target: "May 28", pct: 0.78, status: "ok" },
    { id: "M03", title: "AHU Functional Testing — Bldg A", target: "Jun 02", pct: 0.41, status: "risk" },
    { id: "M04", title: "Fire/Life Safety Witnessing", target: "Jun 06", pct: 0.18, status: "risk" },
    { id: "M05", title: "Substantial Completion", target: "Jun 14", pct: 0.0, status: "key" },
  ];
  return (
    <div className="bp-rep-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § 03 · SCHEDULE & MILESTONES</div>
      </div>
      <table className="bp-rep-table">
        <thead><tr><th>ID</th><th>Milestone</th><th>Target</th><th>Progress</th><th>%</th><th>Status</th></tr></thead>
        <tbody>
          {mil.map(m => (
            <tr key={m.id}>
              <td className="bp-mono">{m.id}</td>
              <td>{m.title}</td>
              <td className="bp-mono">{m.target}</td>
              <td><div className="bp-rep-bar"><i style={{ width: `${m.pct*100}%`, background: m.status==="risk"?"var(--bp-warn)":"var(--bp-ink)" }}/></div></td>
              <td className="bp-mono">{Math.round(m.pct*100)}%</td>
              <td><span className={`bp-rep-pill bp-rep-pill-${m.status}`}>{m.status === "risk" ? "AT RISK" : m.status === "key" ? "KEY DATE" : "ON TRACK"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportEquipment() {
  const sys = [
    { sys: "HVAC · Air Handling", total: 24, op: 14, ft: 5, pf: 3, ins: 2, iss: 8 },
    { sys: "HVAC · Hydronic", total: 18, op: 12, ft: 4, pf: 2, ins: 0, iss: 4 },
    { sys: "HVAC · Distribution", total: 312, op: 198, ft: 0, pf: 88, ins: 26, iss: 0 },
    { sys: "Electrical · Power", total: 42, op: 34, ft: 6, pf: 2, ins: 0, iss: 1 },
    { sys: "Electrical · Backup", total: 4, op: 2, ft: 2, pf: 0, ins: 0, iss: 2 },
    { sys: "Life Safety", total: 12, op: 8, ft: 3, pf: 1, ins: 0, iss: 1 },
  ];
  return (
    <div className="bp-rep-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § 04 · EQUIPMENT STATUS BY SYSTEM</div>
      </div>
      <table className="bp-rep-table">
        <thead><tr><th>System</th><th>Total</th><th>Operational</th><th>FPT</th><th>PFC</th><th>Installed</th><th>Open Issues</th></tr></thead>
        <tbody>
          {sys.map(s => (
            <tr key={s.sys}>
              <td><b>{s.sys}</b></td>
              <td className="bp-mono">{s.total}</td>
              <td className="bp-mono"><span className="bp-rep-cell-ok">{s.op}</span></td>
              <td className="bp-mono">{s.ft}</td>
              <td className="bp-mono">{s.pf}</td>
              <td className="bp-mono bp-dim">{s.ins}</td>
              <td className="bp-mono"><span className={s.iss>0?"bp-warn":""}>{s.iss}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportIssues() {
  const bars = [
    { day: "5/11", c: 0, h: 1, m: 4, l: 2 },
    { day: "5/12", c: 1, h: 2, m: 3, l: 4 },
    { day: "5/13", c: 1, h: 4, m: 5, l: 1 },
    { day: "5/14", c: 2, h: 3, m: 2, l: 3 },
    { day: "5/15", c: 4, h: 5, m: 6, l: 2 },
    { day: "5/16", c: 3, h: 6, m: 8, l: 4 },
    { day: "5/17", c: 4, h: 7, m: 11, l: 12 },
  ];
  const max = 35;
  return (
    <div className="bp-rep-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § 05 · OPEN ISSUES BY PRIORITY</div>
      </div>
      <div className="bp-rep-chart">
        <div className="bp-rep-chart-bars">
          {bars.map(b => {
            const total = b.c + b.h + b.m + b.l;
            return (
              <div key={b.day} className="bp-rep-chart-col">
                <div className="bp-rep-chart-stack">
                  <div className="bp-rep-chart-seg bp-rep-chart-l" style={{ height: `${(b.l/max)*100}%` }}/>
                  <div className="bp-rep-chart-seg bp-rep-chart-m" style={{ height: `${(b.m/max)*100}%` }}/>
                  <div className="bp-rep-chart-seg bp-rep-chart-h" style={{ height: `${(b.h/max)*100}%` }}/>
                  <div className="bp-rep-chart-seg bp-rep-chart-c" style={{ height: `${(b.c/max)*100}%` }}/>
                  <div className="bp-rep-chart-total bp-mono">{total}</div>
                </div>
                <div className="bp-rep-chart-x bp-mono">{b.day}</div>
              </div>
            );
          })}
        </div>
        <div className="bp-rep-chart-legend">
          <span><i className="bp-rep-chart-c"/> Critical</span>
          <span><i className="bp-rep-chart-h"/> High</span>
          <span><i className="bp-rep-chart-m"/> Medium</span>
          <span><i className="bp-rep-chart-l"/> Low</span>
        </div>
      </div>
    </div>
  );
}

function ReportFpt() {
  const rows = [
    { tag: "AHU-01", sys: "HVAC", lines: 12, done: 12, status: "Pass" },
    { tag: "AHU-02", sys: "HVAC", lines: 12, done: 8, status: "In Progress" },
    { tag: "AHU-03", sys: "HVAC", lines: 12, done: 5, status: "Blocked" },
    { tag: "CH-01", sys: "HVAC", lines: 14, done: 13, status: "Pass" },
    { tag: "CH-02", sys: "HVAC", lines: 14, done: 0, status: "Not Started" },
    { tag: "GEN-01", sys: "Electrical", lines: 22, done: 11, status: "In Progress" },
    { tag: "FA-FACP-01", sys: "Life Safety", lines: 18, done: 13, status: "In Progress" },
  ];
  return (
    <div className="bp-rep-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § 06 · FUNCTIONAL TEST PROGRESS</div>
      </div>
      <table className="bp-rep-table">
        <thead><tr><th>Tag</th><th>System</th><th>Progress</th><th>Lines</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.tag}>
              <td className="bp-mono"><b>{r.tag}</b></td>
              <td>{r.sys}</td>
              <td><div className="bp-rep-bar"><i style={{ width: `${(r.done/r.lines)*100}%`, background: r.status==="Blocked"?"var(--bp-warn)":r.status==="Pass"?"var(--bp-ok)":"var(--bp-blue)" }}/></div></td>
              <td className="bp-mono">{r.done}/{r.lines}</td>
              <td><span className={`bp-rep-pill bp-rep-pill-${r.status.toLowerCase().replace(/ /g,"-")}`}>{r.status.toUpperCase()}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────── CUSTOM SECTION RENDERER ─────────── */
function ReportCustomSection({ feature, index }) {
  if (feature.status !== "ready") return null;
  return (
    <div className="bp-rep-block bp-rep-custom-block">
      <div className="bp-rep-section-head">
        <div className="bp-eyebrow">— § C{index+1} · CUSTOM · {feature.title.toUpperCase()}</div>
        <span className="bp-rep-custom-flag"><RI.bolt/> AI-DRAFTED</span>
      </div>
      <div className="bp-rep-prose">
        {feature.content}
      </div>
      {feature.metric && (
        <div className="bp-rep-custom-metrics">
          {feature.metric.map((m,i)=>(
            <div key={i} className="bp-rep-custom-metric">
              <div className="bp-mini-label">{m.label}</div>
              <div className="bp-mono bp-rep-custom-metric-v">{m.value}</div>
              <div className={`bp-rep-custom-metric-sub ${m.warn?"bp-warn":""}`}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── RENDER A SECTION BY KIND ─────────── */
function SectionRenderer({ section, customFeatures, isGenerating, streamText }) {
  if (!section.enabled) return null;
  if (section.status !== "ready") {
    return (
      <div className="bp-rep-block bp-rep-streaming">
        <div className="bp-rep-section-head"><div className="bp-eyebrow">— § {section.name.toUpperCase()}</div></div>
        <div className="bp-rep-shimmer">
          <div className="bp-rep-shimmer-line" style={{width: "92%"}}/>
          <div className="bp-rep-shimmer-line" style={{width: "78%"}}/>
          <div className="bp-rep-shimmer-line" style={{width: "85%"}}/>
        </div>
      </div>
    );
  }
  switch (section.kind) {
    case "cover": return <ReportCoverSection/>;
    case "exec": return <ReportExecSummary streamingText={streamText}/>;
    case "milestones": return <ReportMilestones/>;
    case "equipment": return <ReportEquipment/>;
    case "issues": return <ReportIssues/>;
    case "fpt": return <ReportFpt/>;
    default: return null;
  }
}

/* ─────────── CUSTOM FEATURE PRESETS ─────────── */
const FEATURE_PRESETS = [
  {
    title: "AHU performance vs design intent",
    prompt: "Compare measured airflow and static pressure for each AHU vs design and flag deviations >5%.",
    content: (
      <p>Across 4 commissioned AHUs, <b>AHU-01 and AHU-02 are tracking within ±3% of design</b> at both supply CFM and external static. <b>AHU-03</b> currently shows a +6% static-pressure deviation at design CFM, attributed to the unresolved drain-pan condensate issue restricting return airflow. CxA recommends re-measuring after Issue #4438 is closed.</p>
    ),
    metric: [
      { label: "AHU-01", value: "−2.1%", sub: "ΔSP @ design CFM" },
      { label: "AHU-02", value: "+1.4%", sub: "ΔSP @ design CFM" },
      { label: "AHU-03", value: "+5.8%", sub: "ΔSP @ design CFM", warn: true },
    ],
  },
  {
    title: "Procurement risk · long-lead equipment",
    prompt: "Identify any equipment with no installed status whose lead-time may impact substantial completion.",
    content: (
      <p>Three items still show <i>Not Delivered</i> at <b>27 days to substantial completion</b>: the second emergency generator paralleling switchgear, an OAU sensor package for the central penthouse, and 12 VAV controllers for Level 3 patient rooms. The switchgear is the only one with a known production date (target ship May 22), giving <b>9 days of float</b>. Other items lack a confirmed ETA from supplier.</p>
    ),
    metric: [
      { label: "GEN-PARA-SW", value: "9 D", sub: "FLOAT TO SC", warn: true },
      { label: "OAU-SENSOR-PKG", value: "—", sub: "NO ETA", warn: true },
      { label: "VAV-L3 (×12)", value: "—", sub: "NO ETA", warn: true },
    ],
  },
  {
    title: "Contractor responsiveness by issue age",
    prompt: "Score each contractor by their median time-to-respond on open issues.",
    content: (
      <p>Median issue response across contractors this period: <b>Halverson Electric — 1.4 days</b> (median, best in class), <b>Westgate Mechanical — 3.8 days</b>, <b>GC Site — 2.2 days</b>. Westgate is trending up over the last 14 days as their crew shifts toward functional testing; CxA recommends a check-in with their PM.</p>
    ),
    metric: [
      { label: "Halverson Elec", value: "1.4 D", sub: "median response" },
      { label: "GC · Site", value: "2.2 D", sub: "median response" },
      { label: "Westgate Mech", value: "3.8 D", sub: "median response", warn: true },
    ],
  },
];

/* ─────────── CUSTOM FEATURE CARD ─────────── */
function CustomFeatureCard({ feature, onRemove, onActivate }) {
  return (
    <div className={`bp-rep-feat bp-rep-feat-${feature.status}`}>
      <div className="bp-rep-feat-head">
        <span className={`bp-rep-feat-status bp-rep-feat-status-${feature.status}`}>
          {feature.status === "drafting" && <span className="bp-rep-feat-spinner"/>}
          {feature.status === "ready" && <RI.check/>}
          {feature.status === "queued" && <span className="bp-mono">○</span>}
        </span>
        <div className="bp-rep-feat-title">{feature.title}</div>
        <button className="bp-icon-btn bp-rep-feat-x" onClick={()=>onRemove(feature.id)} title="Remove"><RI.trash/></button>
      </div>
      <div className="bp-rep-feat-prompt bp-mono">"{feature.prompt}"</div>
      <div className="bp-rep-feat-foot">
        {feature.status === "drafting" && <span className="bp-mono bp-rep-feat-progress">{feature.progress || "ANALYZING…"}</span>}
        {feature.status === "ready" && <>
          <span className="bp-mono bp-rep-feat-meta">▸ Drafted · 1 section · {feature.metric?.length || 0} metrics</span>
          <button className="bp-rep-feat-link" onClick={()=>onActivate(feature.id)}>{feature.enabled?"Included ✓":"Include in report"}</button>
        </>}
      </div>
    </div>
  );
}

/* ─────────── REPORTS SCREEN ─────────── */
function ReportsScreen({ setRoute, setAiOpen }) {
  const [activeTemplate, setActiveTemplate] = useState("cx-progress");
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [features, setFeatures] = useState([]);
  const [audience, setAudience] = useState("Owner + GC");
  const [tone, setTone] = useState("Technical");
  const [length, setLength] = useState("Standard");
  const [period, setPeriod] = useState("This week");
  const [featurePrompt, setFeaturePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);

  function toggleSection(id) {
    setSections(ss => ss.map(s => s.id === id ? {...s, enabled: !s.enabled} : s));
  }

  function addFeature(preset) {
    const id = "f-" + Date.now();
    const newFeat = { id, title: preset.title, prompt: preset.prompt, status: "drafting", enabled: true, progress: "ANALYZING DATA…" };
    setFeatures(fs => [...fs, newFeat]);
    setFeaturePrompt("");
    // Simulate drafting
    setTimeout(()=>setFeatures(fs => fs.map(f => f.id===id?{...f, progress:"QUERYING 487 EQUIPMENT…"}:f)), 700);
    setTimeout(()=>setFeatures(fs => fs.map(f => f.id===id?{...f, progress:"DRAFTING NARRATIVE…"}:f)), 1500);
    setTimeout(()=>{
      setFeatures(fs => fs.map(f => f.id===id?{...f, status:"ready", content: preset.content, metric: preset.metric}:f));
    }, 2400);
  }

  function removeFeature(id) {
    setFeatures(fs => fs.filter(f => f.id !== id));
  }

  function activateFeature(id) {
    setFeatures(fs => fs.map(f => f.id===id?{...f, enabled: !f.enabled}:f));
  }

  function submitPrompt() {
    if (!featurePrompt.trim()) return;
    const preset = FEATURE_PRESETS[features.length % FEATURE_PRESETS.length];
    addFeature({ ...preset, title: featurePrompt.length > 60 ? featurePrompt.slice(0, 58) + "…" : featurePrompt, prompt: featurePrompt });
  }

  function regenerate() {
    setGenerating(true);
    setStreamProgress(0);
    setSections(ss => ss.map((s, i) => ({...s, status: i < 2 ? "ready" : "drafting"})));
    const intervals = sections.filter(s => s.enabled).length;
    let idx = 2;
    const tick = () => {
      setStreamProgress(p => p + 1);
      setSections(ss => ss.map((s, i) => i === idx ? {...s, status: "ready"} : s));
      idx++;
      if (idx < sections.length) setTimeout(tick, 700);
      else setGenerating(false);
    };
    setTimeout(tick, 700);
  }

  return (
    <div className="bp-rep">
      {/* LEFT RAIL */}
      <aside className="bp-rep-rail">
        <div className="bp-rep-rail-head">
          <div className="bp-eyebrow">— TEMPLATES</div>
          <button className="bp-btn-ghost-sm"><RI.plus/> NEW</button>
        </div>
        <div className="bp-rep-tpls">
          {TEMPLATES.map(t => (
            <button key={t.id} className={`bp-rep-tpl ${t.id===activeTemplate?"is-on":""}`} onClick={()=>setActiveTemplate(t.id)}>
              <div className="bp-rep-tpl-head">
                <RI.doc/>
                <div className="bp-rep-tpl-name">{t.name}</div>
                {t.starred && <RI.star/>}
              </div>
              <div className="bp-rep-tpl-meta">
                <span className="bp-mono">{t.sections} SEC</span>
                <span className="bp-dot"/>
                <span>{t.frequency}</span>
              </div>
              <div className="bp-rep-tpl-aud">{t.audience}</div>
              {t.popular && <div className="bp-rep-tpl-flag">▸ MOST USED</div>}
            </button>
          ))}
        </div>
        <div className="bp-rep-rail-head" style={{marginTop:14}}>
          <div className="bp-eyebrow">— RECENT</div>
        </div>
        <div className="bp-rep-recent">
          {RECENT.map(r => (
            <div key={r.id} className="bp-rep-recent-row">
              <div className={`bp-rep-recent-glyph ${r.auto?"is-ai":""}`}>{r.auto?"✦":<RI.doc/>}</div>
              <div className="bp-rep-recent-body">
                <div className="bp-rep-recent-title">{r.title}</div>
                <div className="bp-rep-recent-meta bp-mono">{r.date} · {r.template} · {r.by}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <div className="bp-rep-main">
        <div className="bp-rep-head">
          <div>
            <div className="bp-eyebrow">— PROJECT · 24-118 · REPORTS</div>
            <h1 className="bp-h1">{TEMPLATES.find(t => t.id === activeTemplate)?.name}</h1>
            <div className="bp-subtle">Configure once · regenerate any time · AI fills the data live.</div>
          </div>
          <div className="bp-page-tools">
            <button className="bp-btn-ghost"><RI.download/> EXPORT PDF</button>
            <button className="bp-btn-primary" onClick={regenerate}><RI.bolt/> {generating?"GENERATING…":"REGENERATE"}</button>
          </div>
        </div>

        {/* CONFIG ROW */}
        <div className="bp-rep-config">
          {/* knobs */}
          <div className="bp-rep-config-knobs">
            <Knob label="Period" value={period} options={["This week", "Last 14 days", "Month-to-date", "Custom…"]} onPick={setPeriod}/>
            <Knob label="Audience" value={audience} options={["Internal", "Owner + GC", "Owner only", "GC only"]} onPick={setAudience}/>
            <Knob label="Tone" value={tone} options={["Technical", "Executive", "Field-tech"]} onPick={setTone}/>
            <Knob label="Length" value={length} options={["Brief", "Standard", "Detailed"]} onPick={setLength}/>
          </div>
          {/* sections */}
          <div className="bp-rep-config-sections">
            <div className="bp-eyebrow">— SECTIONS · {sections.filter(s=>s.enabled).length} OF {sections.length} INCLUDED</div>
            <div className="bp-rep-sections-list">
              {sections.map(s => (
                <button key={s.id} className={`bp-rep-section-chip ${s.enabled?"is-on":""}`} onClick={()=>toggleSection(s.id)}>
                  <span className="bp-rep-section-chip-mark">{s.enabled?<RI.check/>:""}</span>
                  <span className="bp-rep-section-chip-drag"><RI.drag/></span>
                  <span>{s.name}</span>
                </button>
              ))}
              {features.filter(f=>f.status==="ready"&&f.enabled).map((f, i)=>(
                <button key={f.id} className="bp-rep-section-chip is-on is-custom">
                  <span className="bp-rep-section-chip-mark"><RI.check/></span>
                  <span className="bp-mono">CUSTOM</span>
                  <span>{f.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* custom features */}
          <div className="bp-rep-custom">
            <div className="bp-rep-custom-head">
              <div className="bp-eyebrow">— CUSTOM FEATURES · BUILD YOUR OWN SECTIONS</div>
              <div className="bp-rep-custom-sub">Describe an analysis in plain English — CX·Pro drafts a section using your project data.</div>
            </div>

            <div className="bp-rep-custom-input">
              <textarea
                value={featurePrompt}
                onChange={e=>setFeaturePrompt(e.target.value)}
                placeholder="e.g. Compare AHU performance to design intent and flag deviations greater than 5%…"
                rows={2}
              />
              <button className="bp-rep-custom-submit" onClick={submitPrompt} disabled={!featurePrompt.trim()}><RI.bolt/> DRAFT SECTION</button>
            </div>

            {features.length === 0 && (
              <div className="bp-rep-custom-suggest">
                <div className="bp-mini-label">Or pick a starter:</div>
                <div className="bp-rep-custom-suggest-list">
                  {FEATURE_PRESETS.map((p,i)=>(
                    <button key={i} className="bp-rep-custom-suggest-item" onClick={()=>addFeature(p)}>
                      <RI.bolt/>
                      <div>
                        <div className="bp-rep-custom-suggest-title">{p.title}</div>
                        <div className="bp-rep-custom-suggest-prompt bp-mono bp-dim">"{p.prompt.length>70?p.prompt.slice(0,68)+"…":p.prompt}"</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div className="bp-rep-custom-list">
                {features.map(f => (
                  <CustomFeatureCard key={f.id} feature={f} onRemove={removeFeature} onActivate={activateFeature}/>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="bp-rep-preview-wrap">
          <div className="bp-rep-preview-head">
            <div className="bp-eyebrow">— LIVE PREVIEW · UPDATES AS YOU CONFIGURE</div>
            <div className="bp-rep-preview-meta bp-mono">
              <span>FORMAT · PDF · LETTER</span><span className="bp-dot"/>
              <span>EST · ~{sections.filter(s=>s.enabled).length*2 + features.filter(f=>f.enabled&&f.status==="ready").length} PAGES</span><span className="bp-dot"/>
              <span>v.0.{streamProgress+12}</span>
            </div>
          </div>
          <div className="bp-rep-preview">
            <div className="bp-rep-page">
              {sections.map(s => s.enabled && (
                <SectionRenderer key={s.id} section={s} customFeatures={features}/>
              ))}
              {features.filter(f=>f.status==="ready"&&f.enabled).map((f, i) => (
                <ReportCustomSection key={f.id} feature={f} index={i}/>
              ))}
              <div className="bp-rep-page-foot bp-mono bp-dim">— PREPARED BY CX·PRO · 05·17·26 · CONFIDENTIAL —</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Knob({ label, value, options, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bp-rep-knob">
      <div className="bp-mini-label">{label}</div>
      <button className="bp-rep-knob-btn" onClick={()=>setOpen(o=>!o)}>
        <span>{value}</span>
        <span style={{transform:"rotate(90deg)", display:"inline-flex"}}><RI.chev/></span>
      </button>
      {open && (
        <div className="bp-rep-knob-pop">
          {options.map(o => (
            <button key={o} className={`bp-rep-knob-opt ${o===value?"is-on":""}`} onClick={()=>{onPick(o); setOpen(false);}}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

window.BlueprintReports = ReportsScreen;
})();
