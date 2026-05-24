/* CX Pro — Blueprint · Integrations screen */

(function(){
const { useState, useMemo, useRef, useEffect } = React;
const { MARKS, CATEGORIES, INTEGRATIONS } = window.CXP_INTEGRATIONS;

const II = {
  search: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  plus: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14"/></svg>),
  ext: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3h7v7M21 3l-9 9M19 13v8H3V5h8"/></svg>),
  check: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12l4 4L19 6"/></svg>),
  star: ()=>(<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.5 5 5.5.8-4 4 1 5.5L12 14.8 7 17.3l1-5.5-4-4 5.5-.8z"/></svg>),
  close: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5l14 14M19 5 5 19"/></svg>),
  bolt: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>),
  arrowR: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 5l7 7-7 7"/></svg>),
  arrowL: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>),
  arrowD: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 13l7 7 7-7"/></svg>),
  arrowU: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 19V5M5 11l7-7 7 7"/></svg>),
  swap: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 8h13M12 4l4 4-4 4M21 16H8M12 12l-4 4 4 4"/></svg>),
  refresh: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>),
  spinner: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" strokeDasharray="14 14"/></svg>),
};

/* ─────────── Brand mark renderer ─────────── */
function BrandMark({ id, size = 40 }) {
  const m = MARKS[id];
  if (!m) return null;
  return (
    <div className="bp-int-mark" style={{ background: m.bg, width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>{m.mark}</svg>
    </div>
  );
}

/* ─────────── INTEGRATION CARD ─────────── */
function IntegrationCard({ int, onOpen }) {
  return (
    <button className={`bp-int-card bp-int-card-${int.status}`} onClick={() => onOpen(int)}>
      {int.status === "connected" && <div className="bp-int-badge-connected"><span className="bp-int-badge-dot"/>CONNECTED</div>}
      {int.status === "beta" && <div className="bp-int-badge-beta">BETA</div>}
      {int.new && <div className="bp-int-badge-new">NEW</div>}
      {int.popular && int.status !== "connected" && !int.new && <div className="bp-int-badge-pop"><II.star/></div>}
      <div className="bp-int-card-head">
        <BrandMark id={int.mark}/>
        <div className="bp-int-card-titles">
          <div className="bp-int-card-name">{int.name}</div>
          <div className="bp-int-card-vendor">{int.vendor}</div>
        </div>
      </div>
      <div className="bp-int-card-desc">{int.desc}</div>
      {int.status === "connected" && (
        <div className="bp-int-card-stats">
          <div className="bp-mono"><span className="bp-mini-label">SYNCED</span>{int.records.toLocaleString()}</div>
          <div className="bp-mono"><span className="bp-mini-label">LAST</span>{int.lastSync}</div>
          <div className="bp-mono bp-int-card-health"><span className="bp-int-card-health-dot"/>HEALTHY</div>
        </div>
      )}
      <div className="bp-int-card-foot">
        <span className="bp-mono bp-dim">{CATEGORIES.find(c=>c.id===int.cat)?.label.toUpperCase()}</span>
        {int.status === "connected" ? <span className="bp-int-card-cta">Manage <II.arrowR/></span>
          : <span className="bp-int-card-cta">Connect <II.arrowR/></span>}
      </div>
    </button>
  );
}

/* ─────────── DETAIL PANEL ─────────── */
function DetailPanel({ int, onClose, onConnect }) {
  const [tab, setTab] = useState("overview");
  const [connectStep, setConnectStep] = useState(int.status === "connected" ? "done" : "idle");
  const [mapping, setMapping] = useState(null);

  if (!int) return null;
  const isConnected = connectStep === "done";
  const m = MARKS[int.mark];

  function runConnect() {
    setConnectStep("auth");
    setTimeout(() => setConnectStep("scope"), 1100);
    setTimeout(() => {
      setConnectStep("mapping");
      setMapping(generateMapping(int));
    }, 2200);
  }
  function finishConnect() {
    setConnectStep("done");
    onConnect && onConnect(int.id);
  }

  return (
    <>
      <div className={`bp-int-scrim is-on`} onClick={onClose}/>
      <aside className="bp-int-panel is-on">
        <div className="bp-int-panel-head" style={{ borderTop: `4px solid ${m.color}` }}>
          <div className="bp-int-panel-head-l">
            <BrandMark id={int.mark} size={56}/>
            <div>
              <div className="bp-int-panel-titles">
                <h2>{int.name}</h2>
                {isConnected && <span className="bp-int-status-pill bp-int-status-pill-connected"><span className="bp-int-badge-dot"/>CONNECTED</span>}
                {!isConnected && int.status === "beta" && <span className="bp-int-status-pill bp-int-status-pill-beta">BETA</span>}
              </div>
              <div className="bp-int-panel-vendor">
                by {int.vendor} <span className="bp-dot"/> {CATEGORIES.find(c=>c.id===int.cat)?.label}
                {isConnected && int.since && <> <span className="bp-dot"/> <span className="bp-mono bp-dim">CONNECTED · {int.since.toUpperCase()}</span></>}
              </div>
            </div>
          </div>
          <button className="bp-icon-btn" onClick={onClose}><II.close/></button>
        </div>

        {/* Connection flow (overlays content when running) */}
        {(connectStep !== "idle" && connectStep !== "done") && (
          <ConnectFlow step={connectStep} integration={int} mapping={mapping} setMapping={setMapping} onFinish={finishConnect} onCancel={()=>setConnectStep("idle")}/>
        )}

        {(connectStep === "idle" || connectStep === "done") && (
          <>
            <div className="bp-int-tabs">
              {[["overview","Overview"], ["mapping","Field Mapping"], ["history","Sync History"], ["settings","Settings"]].map(([k,l])=>(
                <button key={k} className={`bp-int-tab ${tab===k?"is-on":""}`} onClick={()=>setTab(k)}>{l}</button>
              ))}
            </div>

            <div className="bp-int-panel-body">
              {tab === "overview" && <OverviewTab int={int} isConnected={isConnected} mark={m} onConnect={runConnect}/>}
              {tab === "mapping" && <MappingTab int={int} isConnected={isConnected} mark={m}/>}
              {tab === "history" && <HistoryTab int={int} isConnected={isConnected}/>}
              {tab === "settings" && <SettingsTab int={int} isConnected={isConnected}/>}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ─────────── OVERVIEW TAB ─────────── */
function OverviewTab({ int, isConnected, mark, onConnect }) {
  return (
    <div className="bp-int-tab-body">
      <p className="bp-int-overview-desc">{int.desc}</p>

      {/* Data flow diagram */}
      <div className="bp-int-flow">
        <div className="bp-int-flow-head">
          <div className="bp-eyebrow">— DATA FLOW</div>
        </div>
        <div className="bp-int-flow-graph">
          <div className="bp-int-flow-node bp-int-flow-node-l">
            <div className="bp-int-flow-mark"><BrandMark id="api" size={32}/></div>
            <div className="bp-int-flow-name">CX·PRO</div>
            <div className="bp-int-flow-sub bp-mono">project data</div>
          </div>
          <div className="bp-int-flow-mid">
            {(int.flow || [["Records", "two-way"]]).map(([label, dir], i) => (
              <div key={i} className={`bp-int-flow-edge bp-int-flow-edge-${dir.replace(/ /g,"-")}`}>
                <span className="bp-int-flow-edge-label bp-mono">{label}</span>
                <div className="bp-int-flow-edge-line">
                  <span className="bp-int-flow-edge-arrow">{dir === "two-way" ? "↔" : dir === "in" ? "←" : dir === "out" ? "→" : "→"}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bp-int-flow-node bp-int-flow-node-r" style={{ borderColor: mark.color }}>
            <div className="bp-int-flow-mark"><BrandMark id={int.mark} size={32}/></div>
            <div className="bp-int-flow-name">{int.name.toUpperCase()}</div>
            <div className="bp-int-flow-sub bp-mono">{int.vendor.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {isConnected && (
        <div className="bp-int-stats">
          <div><div className="bp-mini-label">CONNECTED SINCE</div><div className="bp-int-stat-val bp-mono">{int.since}</div></div>
          <div><div className="bp-mini-label">RECORDS SYNCED</div><div className="bp-int-stat-val bp-mono">{int.records.toLocaleString()}</div></div>
          <div><div className="bp-mini-label">LAST SYNC</div><div className="bp-int-stat-val bp-mono">{int.lastSync}</div></div>
          <div><div className="bp-mini-label">HEALTH</div><div className="bp-int-stat-val bp-int-stat-ok"><span className="bp-int-card-health-dot"/>HEALTHY</div></div>
        </div>
      )}

      {/* Recent sync (when connected) */}
      {isConnected && (
        <div className="bp-int-recent">
          <div className="bp-eyebrow">— RECENT SYNC EVENTS</div>
          <div className="bp-int-recent-list">
            {[
              { dir: "in", title: `Pulled 14 issues from ${int.name}`, time: "4m ago", n: 14 },
              { dir: "out", title: `Pushed 6 status updates to ${int.name}`, time: "12m ago", n: 6 },
              { dir: "in", title: `Pulled 2 RFI replies from ${int.name}`, time: "32m ago", n: 2 },
              { dir: "out", title: `Pushed 1 milestone shift to ${int.name}`, time: "1h ago", n: 1 },
            ].map((r, i) => (
              <div key={i} className="bp-int-recent-row">
                <div className={`bp-int-recent-dir bp-int-recent-dir-${r.dir}`}>{r.dir === "in" ? <II.arrowL/> : <II.arrowR/>}</div>
                <div className="bp-int-recent-title">{r.title}</div>
                <div className="bp-mono bp-dim">{r.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bp-int-cta-row">
        {isConnected ? (
          <>
            <button className="bp-btn-ghost"><II.refresh/> Sync now</button>
            <button className="bp-btn-ghost">Configure</button>
            <button className="bp-btn-ghost bp-int-disconnect">Disconnect</button>
          </>
        ) : (
          <button className="bp-btn-primary bp-int-connect-btn" onClick={onConnect}>[ CONNECT {int.name.toUpperCase()} ]</button>
        )}
      </div>
    </div>
  );
}

/* ─────────── MAPPING TAB ─────────── */
function MappingTab({ int, isConnected, mark }) {
  const mapping = generateMapping(int);
  return (
    <div className="bp-int-tab-body">
      <div className="bp-int-mapping-head">
        <div className="bp-eyebrow">— FIELD MAPPING · AI-MATCHED</div>
        <div className="bp-int-mapping-conf"><II.bolt/> 94% confidence · 4 fields need review</div>
      </div>
      <p className="bp-int-mapping-desc">CX·Pro analyzed {int.name}'s schema and proposed how each field maps to your project records. Override any row.</p>

      <div className="bp-int-mapping-table">
        <div className="bp-int-mapping-row bp-int-mapping-head-row">
          <div>{int.name} →</div>
          <div></div>
          <div>← CX·Pro</div>
          <div>Confidence</div>
        </div>
        {mapping.map((m, i) => (
          <div key={i} className={`bp-int-mapping-row ${m.review?"is-review":""}`}>
            <div className="bp-int-mapping-from">
              <span className="bp-mono">{m.from}</span>
              <span className="bp-int-mapping-type">{m.type}</span>
            </div>
            <div className="bp-int-mapping-arrow">{m.transform ? <span className="bp-int-mapping-transform bp-mono">{m.transform}</span> : <II.swap/>}</div>
            <div className="bp-int-mapping-to">
              <span className="bp-mono">{m.to}</span>
              <span className="bp-int-mapping-type">{m.type}</span>
            </div>
            <div className="bp-int-mapping-conf">
              {m.review ? (
                <span className="bp-int-mapping-review">▲ REVIEW</span>
              ) : (
                <span className={`bp-int-mapping-pct bp-mono ${m.conf>=0.9?"is-high":"is-mid"}`}>{Math.round(m.conf*100)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── HISTORY TAB ─────────── */
function HistoryTab({ int, isConnected }) {
  if (!isConnected) return <div className="bp-int-tab-body"><div className="bp-int-empty">Sync history appears once {int.name} is connected.</div></div>;
  return (
    <div className="bp-int-tab-body">
      <div className="bp-eyebrow">— LAST 24 HOURS · {Math.round((int.records||100)/12)} EVENTS</div>
      <div className="bp-int-history">
        {[
          ...Array.from({length:8}).map((_,i)=>({ t: `${i*2+0}h`, type: i%3===0?"pull":i%3===1?"push":"sync", n: 12+(i*3) }))
        ].map((e, i) => (
          <div key={i} className="bp-int-history-row">
            <div className="bp-int-history-time bp-mono">{e.t} ago</div>
            <div className="bp-int-history-bar">
              <div className="bp-int-history-bar-fill" style={{width: `${Math.min(100, e.n*2)}%`}}/>
              <div className="bp-int-history-bar-n bp-mono">{e.n} records · {e.type}</div>
            </div>
            <div className="bp-int-history-status bp-int-history-status-ok">✓</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── SETTINGS TAB ─────────── */
function SettingsTab({ int, isConnected }) {
  return (
    <div className="bp-int-tab-body">
      <div className="bp-int-setting">
        <div className="bp-int-setting-label">
          <div>Sync frequency</div>
          <div className="bp-int-setting-desc">How often CX·Pro pulls and pushes changes.</div>
        </div>
        <div className="bp-int-setting-options">
          {["Real-time", "Every 5 min", "Hourly", "Daily"].map(o => (
            <button key={o} className={`bp-int-setting-opt ${o==="Every 5 min"?"is-on":""}`}>{o}</button>
          ))}
        </div>
      </div>
      <div className="bp-int-setting">
        <div className="bp-int-setting-label">
          <div>Conflict resolution</div>
          <div className="bp-int-setting-desc">When both systems edit the same record.</div>
        </div>
        <div className="bp-int-setting-options">
          {["CX·Pro wins", `${int.name} wins`, "Newest wins", "Ask me"].map(o => (
            <button key={o} className={`bp-int-setting-opt ${o==="Newest wins"?"is-on":""}`}>{o}</button>
          ))}
        </div>
      </div>
      <div className="bp-int-setting">
        <div className="bp-int-setting-label">
          <div>Notify on errors</div>
          <div className="bp-int-setting-desc">Send a Teams alert when a sync fails.</div>
        </div>
        <div className="bp-int-setting-options">
          <label className="bp-int-toggle">
            <input type="checkbox" defaultChecked/>
            <span/>
          </label>
        </div>
      </div>
      <div className="bp-int-setting">
        <div className="bp-int-setting-label">
          <div>Scope</div>
          <div className="bp-int-setting-desc">Which CX·Pro projects participate.</div>
        </div>
        <div className="bp-int-setting-options">
          {["All projects", "Active only", "Pick projects…"].map(o => (
            <button key={o} className={`bp-int-setting-opt ${o==="Active only"?"is-on":""}`}>{o}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── CONNECT FLOW ─────────── */
function ConnectFlow({ step, integration, mapping, setMapping, onFinish, onCancel }) {
  return (
    <div className="bp-int-connect">
      <div className="bp-int-connect-head">
        <div className="bp-eyebrow">— CONNECT · {integration.name.toUpperCase()}</div>
        <div className="bp-int-connect-steps">
          {["AUTH", "SCOPE", "MAPPING"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`bp-int-connect-step ${i <= ["auth","scope","mapping"].indexOf(step)?"is-on":""}`}>
                <span className="bp-mono">{i+1}</span>{s}
              </div>
              {i < 2 && <div className={`bp-int-connect-line ${i < ["auth","scope","mapping"].indexOf(step)?"is-on":""}`}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bp-int-connect-body">
        {step === "auth" && (
          <div className="bp-int-connect-pane">
            <div className="bp-int-spinner"/>
            <h3>Redirecting to {integration.name} authentication…</h3>
            <p className="bp-dim">CX·Pro uses OAuth 2.0. Your credentials never touch our servers.</p>
          </div>
        )}
        {step === "scope" && (
          <div className="bp-int-connect-pane">
            <h3>Pick what to share with {integration.name}</h3>
            <p className="bp-dim">You can change these later. CX·Pro never accesses anything you don't allow.</p>
            <div className="bp-int-scope-list">
              {(integration.flow || [["Issues", "two-way"], ["Equipment", "out"]]).map(([label, dir], i) => (
                <label key={i} className="bp-int-scope-row">
                  <input type="checkbox" defaultChecked/>
                  <span className="bp-int-scope-label">{label}</span>
                  <span className="bp-mono bp-dim">{dir.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {step === "mapping" && (
          <div className="bp-int-connect-pane bp-int-connect-mapping">
            <div className="bp-int-mapping-banner">
              <II.bolt/>
              <div>
                <b>AI-matched fields ready for review</b>
                <div className="bp-dim">CX·Pro analyzed {integration.name}'s schema and proposed how each field maps. 4 fields flagged for human review.</div>
              </div>
            </div>
            <div className="bp-int-mapping-table">
              <div className="bp-int-mapping-row bp-int-mapping-head-row">
                <div>{integration.name} →</div>
                <div></div>
                <div>← CX·Pro</div>
                <div>Conf.</div>
              </div>
              {mapping && mapping.slice(0,6).map((m, i) => (
                <div key={i} className={`bp-int-mapping-row ${m.review?"is-review":""}`}>
                  <div className="bp-int-mapping-from"><span className="bp-mono">{m.from}</span></div>
                  <div className="bp-int-mapping-arrow"><II.swap/></div>
                  <div className="bp-int-mapping-to"><span className="bp-mono">{m.to}</span></div>
                  <div className="bp-int-mapping-conf">
                    {m.review ? <span className="bp-int-mapping-review">▲</span> : <span className={`bp-int-mapping-pct bp-mono ${m.conf>=0.9?"is-high":"is-mid"}`}>{Math.round(m.conf*100)}%</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="bp-int-connect-cta">
              <button className="bp-btn-ghost" onClick={onCancel}>Cancel</button>
              <button className="bp-btn-primary" onClick={onFinish}>[ FINISH · CONNECT ]</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── MAPPING GENERATOR (by integration type) ─────────── */
function generateMapping(int) {
  const procoreLike = [
    { from: "observations.title", to: "issues.title", type: "string", conf: 0.98 },
    { from: "observations.description", to: "issues.description", type: "text", conf: 0.98 },
    { from: "observations.priority", to: "issues.priority", type: "enum", conf: 0.95, transform: "MAP(URGENT→CRITICAL)" },
    { from: "observations.status", to: "issues.status", type: "enum", conf: 0.92 },
    { from: "observations.created_by", to: "issues.reporter", type: "user", conf: 0.88 },
    { from: "observations.due_date", to: "issues.target_close", type: "date", conf: 0.96 },
    { from: "observations.location_id", to: "issues.asset_id", type: "ref", conf: 0.72, review: true },
    { from: "observations.trade", to: "issues.discipline", type: "enum", conf: 0.84 },
    { from: "observations.assignee", to: "issues.assigned_company", type: "ref", conf: 0.78, review: true },
    { from: "observations.cost_code", to: "(unmapped)", type: "string", conf: 0.0, review: true },
    { from: "observations.attachments[]", to: "issues.files[]", type: "array<file>", conf: 0.99 },
    { from: "observations.comments[]", to: "issues.comments[]", type: "array<text>", conf: 0.95 },
  ];
  const basLike = [
    { from: "objects.point_name", to: "equipment.point_id", type: "string", conf: 0.94 },
    { from: "objects.parent_equipment", to: "equipment.id", type: "ref", conf: 0.88, review: true },
    { from: "objects.point_kind", to: "equipment.point_kind", type: "enum", conf: 0.96, transform: "MAP(AI→ANALOG_IN)" },
    { from: "objects.units", to: "equipment.point_units", type: "enum", conf: 0.92 },
    { from: "trends.timestamp", to: "trends.ts", type: "datetime", conf: 1.0 },
    { from: "trends.value", to: "trends.value", type: "number", conf: 1.0 },
    { from: "alarms.priority", to: "issues.priority", type: "enum", conf: 0.71, review: true },
    { from: "graphics.url", to: "(unmapped)", type: "url", conf: 0.0, review: true },
  ];
  const scheduleLike = [
    { from: "activities.id", to: "milestones.ext_id", type: "string", conf: 0.99 },
    { from: "activities.name", to: "milestones.name", type: "string", conf: 0.98 },
    { from: "activities.start_date", to: "milestones.target_start", type: "date", conf: 0.97 },
    { from: "activities.finish_date", to: "milestones.target_close", type: "date", conf: 0.97 },
    { from: "activities.percent_complete", to: "milestones.progress", type: "number", conf: 0.99 },
    { from: "activities.predecessors", to: "milestones.depends_on", type: "ref[]", conf: 0.81, review: true },
    { from: "activities.wbs_code", to: "milestones.group", type: "ref", conf: 0.74, review: true },
  ];
  if (int.cat === "bas") return basLike;
  if (int.cat === "schedule") return scheduleLike;
  return procoreLike;
}

/* ─────────── MAIN SCREEN ─────────── */
function IntegrationsScreen({ setRoute, setAiOpen }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [connectedSet, setConnectedSet] = useState(() => new Set(INTEGRATIONS.filter(i => i.status === "connected").map(i => i.id)));

  const filtered = useMemo(() => INTEGRATIONS.filter(i => {
    if (category !== "all" && i.cat !== category) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.vendor.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q);
    }
    return true;
  }), [category, query]);

  const connected = filtered.filter(i => connectedSet.has(i.id));
  const available = filtered.filter(i => !connectedSet.has(i.id));

  function open(int) { setSelected(int); }
  function close() { setSelected(null); }
  function connect(id) { setConnectedSet(s => { const n = new Set(s); n.add(id); return n; }); }

  const totals = {
    connected: INTEGRATIONS.filter(i => connectedSet.has(i.id)).length,
    available: INTEGRATIONS.filter(i => !connectedSet.has(i.id)).length,
    events: 2814,
    errors: 0,
  };

  return (
    <div className="bp-int">
      <div className="bp-int-screen-head">
        <div>
          <div className="bp-eyebrow">— PROJECT · 24-118 · INTEGRATIONS</div>
          <h1 className="bp-h1">Integrations</h1>
          <div className="bp-subtle">Connect CX·Pro to the rest of your stack. AI auto-maps fields when you connect.</div>
        </div>
        <div className="bp-page-tools">
          <button className="bp-btn-ghost">▸ Request integration</button>
          <button className="bp-btn-primary"><II.plus/> [ BROWSE MARKETPLACE ]</button>
        </div>
      </div>

      <div className="bp-int-stats-row">
        {[
          { label: "Connected", v: totals.connected, sub: `of ${INTEGRATIONS.length} total`, bar: totals.connected/INTEGRATIONS.length, bold: true },
          { label: "Available", v: totals.available, sub: "ready to connect" },
          { label: "Sync events · 24h", v: totals.events.toLocaleString(), sub: "across all connections" },
          { label: "Errors · 24h", v: totals.errors, sub: "all systems healthy", ok: true },
        ].map((s, i) => (
          <div key={i} className="bp-int-stat">
            <div className="bp-mini-label">{s.label}</div>
            <div className="bp-int-stat-v"><span className="bp-mono">{s.v}</span></div>
            {s.bar !== undefined && <div className="bp-bar"><i style={{width:`${s.bar*100}%`}}/></div>}
            <div className={`bp-int-stat-sub ${s.ok?"is-ok":""}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bp-int-controls">
        <div className="bp-int-search">
          <II.search/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search 42 integrations — vendor, name, capability…"/>
        </div>
        <div className="bp-int-cats">
          {CATEGORIES.map(c => (
            <button key={c.id} className={`bp-int-cat ${category===c.id?"is-on":""}`} onClick={()=>setCategory(c.id)}>
              {c.label}
              {category===c.id && <span className="bp-mono">·{filtered.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {connected.length > 0 && (
        <div className="bp-int-section">
          <div className="bp-int-section-head">
            <div className="bp-eyebrow">— CONNECTED · {connected.length}</div>
            <div className="bp-int-section-sub">Live syncs · everything below is keeping CX·Pro and the vendor in step.</div>
          </div>
          <div className="bp-int-grid">
            {connected.map(int => <IntegrationCard key={int.id} int={{...int, status:"connected"}} onOpen={open}/>)}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div className="bp-int-section">
          <div className="bp-int-section-head">
            <div className="bp-eyebrow">— AVAILABLE · {available.length}</div>
            <div className="bp-int-section-sub">One-click setup · AI maps fields on connect.</div>
          </div>
          <div className="bp-int-grid">
            {available.map(int => <IntegrationCard key={int.id} int={int} onOpen={open}/>)}
          </div>
        </div>
      )}

      {selected && <DetailPanel int={{...selected, status: connectedSet.has(selected.id)?"connected":selected.status}} onClose={close} onConnect={connect}/>}
    </div>
  );
}

window.BlueprintIntegrations = IntegrationsScreen;
})();
