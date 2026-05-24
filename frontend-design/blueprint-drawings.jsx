/* CX Pro — Blueprint · Drawings screen
   Markable floor plan · pinned comments · @mentions */

(function(){
const { useState, useRef, useEffect, useMemo } = React;
const D = window.CXP_DATA;

/* ─────────── people for @mentions ─────────── */
const PEOPLE = [
  { id: "mo", name: "M. Okafor", role: "Cx Authority", color: "#1240FF" },
  { id: "jr", name: "J. Reyes", role: "Westgate Mech · Foreman", color: "#C13A2A" },
  { id: "tw", name: "T. Wilkes", role: "Halverson Elec · Lead", color: "#B5731B" },
  { id: "sp", name: "S. Patel", role: "Cx · Senior", color: "#1F6F3E" },
  { id: "kr", name: "K. Roselli", role: "Cx · Lead", color: "#6B4FCF" },
  { id: "dh", name: "D. Hamlin", role: "Owner Rep · Aurora Health", color: "#0E7C7B" },
  { id: "ja", name: "AI · CX·Pro", role: "Project Agent", color: "#1240FF", ai: true },
];

/* ─────────── sheet inventory ─────────── */
const SHEETS = [
  { id: "M-301", title: "MECH · ROOF PLAN", rev: "D", date: "05·14·26", pins: 8, status: "current", active: true },
  { id: "M-302", title: "MECH · LEVEL 3", rev: "C", date: "05·11·26", pins: 3 },
  { id: "M-303", title: "MECH · LEVEL 2", rev: "C", date: "05·11·26", pins: 1 },
  { id: "M-304", title: "MECH · LEVEL 1", rev: "C", date: "05·09·26", pins: 0 },
  { id: "M-501", title: "MECH · DETAILS — AHU", rev: "B", date: "05·02·26", pins: 0 },
  { id: "E-201", title: "ELEC · ROOF POWER", rev: "C", date: "05·09·26", pins: 2 },
  { id: "E-401", title: "ELEC · SINGLE LINE", rev: "B", date: "04·22·26", pins: 0 },
  { id: "FP-101", title: "FIRE PROT · ROOF", rev: "B", date: "05·02·26", pins: 1 },
  { id: "A-101", title: "ARCH · ROOF PLAN", rev: "D", date: "05·14·26", pins: 0 },
];

/* ─────────── pins on the active sheet (M-301) ─────────── */
const initialPins = [
  {
    id: "P-04438", x: 50.5, y: 56,
    type: "issue", priority: "Medium", status: "Open",
    title: "AHU-03 condensate pan holds ¼\" standing water",
    asset: "AHU-03 · drain pan, NE corner",
    issueRef: "Issue #4438", assigned: "Westgate Mechanical",
    selected: true,
    comments: [
      { id: "c1", who: "mo", time: "2d", text: "Standing water at NE corner of drain pan after 30min runtime. Suspect drain slope or trap depth." },
      { id: "c2", who: "jr", time: "1d", text: "@M. Okafor confirmed drain trap depth is 3\" instead of 4\" per submittal — will reset today.", mentions: ["mo"] },
      { id: "c3", who: "mo", time: "12h", text: "@T. Wilkes can you verify cooling coil enable interlock since we're cycling the unit during repair. Don't want condenser-water runaway.", mentions: ["tw"] },
      { id: "c4", who: "tw", time: "6h", text: "✓ Confirmed coil enable interlocked with fan-proven and CW-valve position. Safe to cycle." },
      { id: "c5", who: "ja", time: "4h", ai: true, text: "Drafted a related preventative check for AHU-01 and AHU-02 — same submittal, same potential trap-depth issue. Open the AI panel to review.", mentions: [] },
    ],
  },
  { id: "P-04421", x: 53, y: 41, type: "issue", priority: "High", status: "Open",
    title: "AHU-03 supply fan isolators fully compressed",
    asset: "AHU-03 · supply fan", issueRef: "Issue #4421",
    assigned: "Westgate Mechanical",
    comments: [{ id: "x1", who: "jr", time: "2d", text: "Springs are bottomed — selection issue, not install. Coordinating with Mason Industries on swap." }],
  },
  { id: "P-OB-12", x: 81, y: 41, type: "observation", priority: "Low", status: "Open",
    title: "OA damper actuator bracket interference",
    asset: "AHU-02 · outdoor-air damper", issueRef: "Obs #OB-12",
    assigned: "Cx · Internal",
    comments: [{ id: "y1", who: "sp", time: "3d", text: "Bracket touches the housing — looks tight but not blocking stroke. Flagging for review." }],
  },
  { id: "P-04302", x: 19, y: 41, type: "issue", priority: "Medium", status: "Resolved",
    title: "AHU-01 sensor cable strain relief",
    asset: "AHU-01 · electrical penetration", issueRef: "Issue #4302",
    assigned: "Halverson Electric",
    comments: [{ id: "z1", who: "tw", time: "5d", text: "Added strain relief and gland. Re-tested. Closed." }],
  },
  { id: "P-RFI-118", x: 64, y: 73, type: "rfi", priority: "Medium", status: "Open",
    title: "RFI · ductwork transition above stair tower",
    asset: "Central duct rack", issueRef: "RFI #118",
    assigned: "Architect of Record",
    comments: [{ id: "r1", who: "kr", time: "1d", text: "Routing conflict with smoke-evac duct from stairwell. Need pen-tration coordination." }],
  },
  { id: "P-OB-19", x: 85, y: 76, type: "observation", priority: "Low", status: "Open",
    title: "Roof drain · debris around overflow scupper",
    asset: "West roof drain", issueRef: "Obs #OB-19",
    assigned: "GC · Site",
    comments: [{ id: "o1", who: "mo", time: "10h", text: "Routine — flag for cleanup before substantial completion walk." }],
  },
  { id: "P-RFI-119", x: 47, y: 80, type: "rfi", priority: "Low", status: "Open",
    title: "RFI · stair tower coping detail",
    asset: "Stair tower", issueRef: "RFI #119",
    assigned: "Architect of Record",
    comments: [{ id: "p1", who: "sp", time: "1d", text: "Coping doesn't match A-501 detail 3. Confirm." }],
  },
  { id: "P-04451", x: 36, y: 24, type: "issue", priority: "High", status: "Open",
    title: "Roof curb sealant compromised",
    asset: "East penthouse curb", issueRef: "Issue #4451",
    assigned: "GC · Roofing",
    comments: [{ id: "q1", who: "mo", time: "8h", text: "Sealant pulled away on NE side after recent weather. Needs reseal before substantial completion." }],
  },
];

/* ─────────── ICONS (local subset) ─────────── */
const DI = {
  search: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  pin: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  poly: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12 12 4l8 8-8 8z"/></svg>),
  measure: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>),
  text: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5h14M12 5v14M9 19h6"/></svg>),
  hand: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11V5a2 2 0 0 1 4 0v6M13 9V4a2 2 0 0 1 4 0v8M17 11V6a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-1a8 8 0 0 1-8-8v-4a2 2 0 0 1 4 0v4"/></svg>),
  undo: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7"/></svg>),
  plus: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>),
  minus: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14"/></svg>),
  fit: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>),
  close: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5l14 14M19 5 5 19"/></svg>),
  send: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l18-9-7 18-2-7z"/></svg>),
  paperclip: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L11 18a2 2 0 0 1-3-3l7-7"/></svg>),
  layers: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>),
  more: ()=>(<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>),
  chev: ()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m9 6 6 6-6 6"/></svg>),
};

/* ─────────── FLOOR PLAN SVG (mechanical roof) ─────────── */
function FloorPlanSVG() {
  const ink = "#1A1A1F";
  const blue = "#1240FF";
  const dim = "rgba(26,26,31,0.45)";
  const dim2 = "rgba(26,26,31,0.25)";
  return (
    <svg viewBox="0 0 1600 900" className="bp-dwg-svg" preserveAspectRatio="xMidYMid meet">
      {/* paper texture handled in CSS via background */}
      <defs>
        <pattern id="dwg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={ink} strokeOpacity="0.06" strokeWidth="0.5"/>
        </pattern>
        <marker id="dwg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={ink}/>
        </marker>
        <marker id="dwg-arrow-r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10 0 L0 5 L10 10 Z" fill={ink}/>
        </marker>
      </defs>

      <rect width="1600" height="900" fill="url(#dwg-grid)"/>

      {/* drawing border */}
      <rect x="40" y="40" width="1520" height="820" fill="none" stroke={ink} strokeWidth="2"/>
      <rect x="48" y="48" width="1504" height="804" fill="none" stroke={ink} strokeWidth="0.4" strokeDasharray="2 3"/>

      {/* building outline */}
      <path d="M120 140 L1480 140 L1480 760 L120 760 Z" fill="rgba(18,64,255,0.02)" stroke={ink} strokeWidth="2.2"/>

      {/* roof slab hatching */}
      {[...Array(35)].map((_,i)=><line key={i} x1={120+i*40} y1={140} x2={120+i*40-30} y2={170} stroke={ink} strokeOpacity="0.1" strokeWidth="0.4"/>)}

      {/* East penthouse (AHU-01) */}
      <g>
        <rect x="200" y="240" width="320" height="220" fill="rgba(255,255,255,0.6)" stroke={ink} strokeWidth="1.6"/>
        <rect x="200" y="240" width="320" height="36" fill={ink} fillOpacity="0.08" stroke={ink} strokeWidth="0.8"/>
        <text x="360" y="263" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill={ink}>EAST PENTHOUSE · MECH</text>
        {/* AHU-01 representation */}
        <rect x="240" y="300" width="240" height="80" fill="none" stroke={ink} strokeWidth="1.2"/>
        <line x1="280" y1="300" x2="280" y2="380" stroke={ink} strokeWidth="0.6"/>
        <line x1="320" y1="300" x2="320" y2="380" stroke={ink} strokeWidth="0.6"/>
        <line x1="380" y1="300" x2="380" y2="380" stroke={ink} strokeWidth="0.6"/>
        <line x1="420" y1="300" x2="420" y2="380" stroke={ink} strokeWidth="0.6"/>
        <circle cx="260" cy="340" r="14" fill="none" stroke={ink} strokeWidth="0.8"/>
        <line x1="246" y1="340" x2="274" y2="340" stroke={ink} strokeWidth="0.4"/>
        <line x1="260" y1="326" x2="260" y2="354" stroke={ink} strokeWidth="0.4"/>
        <text x="360" y="346" textAnchor="middle" fontSize="14" fontWeight="700" fill={ink}>AHU-01</text>
        <text x="360" y="362" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>T-CLIMATE-CG-040</text>
        {/* condensate */}
        <line x1="260" y1="380" x2="260" y2="420" stroke={ink} strokeWidth="1" strokeDasharray="3 2"/>
        <circle cx="260" cy="420" r="3" fill="none" stroke={ink} strokeWidth="0.8"/>
        {/* ductwork out */}
        <path d="M480 340 L600 340" stroke={ink} strokeWidth="1.4"/>
        <path d="M480 360 L600 360" stroke={ink} strokeWidth="1.4"/>
        <text x="540" y="332" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>SA · 14,500 CFM</text>
        <text x="540" y="378" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>RA</text>
      </g>

      {/* Central penthouse (AHU-03) — highlighted */}
      <g>
        <rect x="640" y="180" width="320" height="380" fill="rgba(18,64,255,0.06)" stroke={blue} strokeWidth="1.8"/>
        <rect x="640" y="180" width="320" height="36" fill={blue} fillOpacity="0.92" stroke={blue}/>
        <text x="800" y="203" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill="#fff">CENTRAL PENTHOUSE · MECH · AHU-03 (ACTIVE)</text>
        {/* AHU-03 representation */}
        <rect x="680" y="246" width="240" height="120" fill="none" stroke={ink} strokeWidth="1.4"/>
        {[280,320,360,400,440,480,520,560].map((x,i)=>(<line key={i} x1={680+(x-280)*0.6} y1="246" x2={680+(x-280)*0.6} y2="366" stroke={ink} strokeWidth="0.5"/>))}
        <line x1="680" y1="306" x2="920" y2="306" stroke={ink} strokeWidth="0.4"/>
        <circle cx="710" cy="306" r="20" fill="none" stroke={ink} strokeWidth="0.9"/>
        <line x1="690" y1="306" x2="730" y2="306" stroke={ink} strokeWidth="0.5"/>
        <line x1="710" y1="286" x2="710" y2="326" stroke={ink} strokeWidth="0.5"/>
        <line x1="694" y1="290" x2="726" y2="322" stroke={ink} strokeWidth="0.4"/>
        <line x1="694" y1="322" x2="726" y2="290" stroke={ink} strokeWidth="0.4"/>
        <rect x="750" y="270" width="30" height="72" fill={blue} fillOpacity="0.1" stroke={ink} strokeWidth="0.5"/>
        <rect x="790" y="270" width="30" height="72" fill={blue} fillOpacity="0.1" stroke={ink} strokeWidth="0.5"/>
        <rect x="830" y="270" width="30" height="72" fill="none" stroke={ink} strokeWidth="0.5" strokeDasharray="2 2"/>
        <text x="800" y="394" textAnchor="middle" fontSize="18" fontWeight="700" fill={blue}>AHU-03</text>
        <text x="800" y="410" textAnchor="middle" fontSize="10" letterSpacing="0.8" fill={ink}>T-CLIMATE-CG-060 · 24,000 CFM</text>

        {/* drain pan + condensate */}
        <rect x="690" y="370" width="220" height="14" fill={blue} fillOpacity="0.15" stroke={ink} strokeWidth="0.6"/>
        <text x="800" y="380" textAnchor="middle" fontSize="8" letterSpacing="0.6" fill={dim}>DRAIN PAN · SLOPE TO NE</text>
        <line x1="900" y1="384" x2="940" y2="430" stroke={ink} strokeWidth="0.8" strokeDasharray="3 2"/>
        <circle cx="940" cy="430" r="4" fill="none" stroke={ink} strokeWidth="0.8"/>
        <text x="956" y="434" fontSize="9" letterSpacing="0.6" fill={dim}>CD</text>

        {/* electrical pen */}
        <rect x="668" y="420" width="40" height="20" fill="none" stroke={ink} strokeWidth="0.8"/>
        <text x="688" y="453" textAnchor="middle" fontSize="8" letterSpacing="0.4" fill={dim}>DISC · 480/3/60</text>

        {/* ductwork */}
        <path d="M680 290 L600 290 L600 250" stroke={ink} strokeWidth="1.4" fill="none"/>
        <path d="M680 320 L600 320 L600 360" stroke={ink} strokeWidth="1.4" fill="none"/>
        <path d="M920 290 L1000 290 L1000 250" stroke={ink} strokeWidth="1.4" fill="none"/>
        <path d="M920 320 L1000 320 L1000 360" stroke={ink} strokeWidth="1.4" fill="none"/>
        <text x="580" y="240" fontSize="10" fontWeight="600" fill={ink}>SA · 12k</text>
        <text x="1000" y="240" fontSize="10" fontWeight="600" fill={ink}>SA · 12k</text>
        <text x="580" y="380" fontSize="10" fontWeight="600" fill={ink}>RA</text>
        <text x="1000" y="380" fontSize="10" fontWeight="600" fill={ink}>RA</text>

        {/* annotation lines */}
        <path d="M800 540 L800 480" stroke={ink} strokeWidth="0.5"/>
        <text x="800" y="556" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>VFD · WALL MTD · SEE E-201</text>
      </g>

      {/* West penthouse (AHU-02) */}
      <g>
        <rect x="1080" y="240" width="320" height="220" fill="rgba(255,255,255,0.6)" stroke={ink} strokeWidth="1.6"/>
        <rect x="1080" y="240" width="320" height="36" fill={ink} fillOpacity="0.08" stroke={ink} strokeWidth="0.8"/>
        <text x="1240" y="263" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill={ink}>WEST PENTHOUSE · MECH</text>
        <rect x="1120" y="300" width="240" height="80" fill="none" stroke={ink} strokeWidth="1.2"/>
        {[160,200,260,300].map((x,i)=>(<line key={i} x1={1120+x-160} y1="300" x2={1120+x-160} y2="380" stroke={ink} strokeWidth="0.6"/>))}
        <circle cx="1140" cy="340" r="14" fill="none" stroke={ink} strokeWidth="0.8"/>
        <text x="1240" y="346" textAnchor="middle" fontSize="14" fontWeight="700" fill={ink}>AHU-02</text>
        <text x="1240" y="362" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>T-CLIMATE-CG-040</text>
        <line x1="1160" y1="380" x2="1160" y2="420" stroke={ink} strokeWidth="1" strokeDasharray="3 2"/>
        <circle cx="1160" cy="420" r="3" fill="none" stroke={ink} strokeWidth="0.8"/>
        {/* OA damper */}
        <rect x="1360" y="316" width="44" height="48" fill="none" stroke={ink} strokeWidth="1"/>
        <line x1="1360" y1="316" x2="1404" y2="364" stroke={ink} strokeWidth="0.4"/>
        <text x="1382" y="346" textAnchor="middle" fontSize="9" fontWeight="600" fill={ink}>OAD</text>
      </g>

      {/* Stair tower */}
      <g>
        <rect x="700" y="620" width="200" height="120" fill="rgba(255,255,255,0.6)" stroke={ink} strokeWidth="1.4"/>
        <text x="800" y="650" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2" fill={ink}>STAIR · 02</text>
        <path d="M720 660 L880 660 M720 680 L880 680 M720 700 L880 700 M720 720 L880 720" stroke={ink} strokeWidth="0.5"/>
      </g>

      {/* roof drains */}
      <circle cx="220" cy="700" r="6" fill="none" stroke={ink} strokeWidth="1"/><circle cx="220" cy="700" r="2" fill={ink}/>
      <circle cx="1380" cy="700" r="6" fill="none" stroke={ink} strokeWidth="1"/><circle cx="1380" cy="700" r="2" fill={ink}/>
      <text x="220" y="722" textAnchor="middle" fontSize="8" letterSpacing="0.4" fill={dim}>RD-1</text>
      <text x="1380" y="722" textAnchor="middle" fontSize="8" letterSpacing="0.4" fill={dim}>RD-2</text>

      {/* duct rack across roof */}
      <path d="M520 540 L1080 540" stroke={ink} strokeWidth="2"/>
      <path d="M520 560 L1080 560" stroke={ink} strokeWidth="2"/>
      <text x="800" y="534" textAnchor="middle" fontSize="9" letterSpacing="0.6" fill={dim}>MAIN DUCT RACK · 36x24</text>

      {/* dimension lines, top */}
      <g>
        <line x1="120" y1="100" x2="800" y2="100" stroke={ink} strokeWidth="0.5" markerEnd="url(#dwg-arrow)" markerStart="url(#dwg-arrow-r)"/>
        <line x1="800" y1="100" x2="1480" y2="100" stroke={ink} strokeWidth="0.5" markerEnd="url(#dwg-arrow)" markerStart="url(#dwg-arrow-r)"/>
        <text x="460" y="92" textAnchor="middle" fontSize="10" fontWeight="600" fill={ink}>168'-0"</text>
        <text x="1140" y="92" textAnchor="middle" fontSize="10" fontWeight="600" fill={ink}>168'-0"</text>
        <line x1="120" y1="90" x2="120" y2="140" stroke={ink} strokeWidth="0.4"/>
        <line x1="800" y1="90" x2="800" y2="140" stroke={ink} strokeWidth="0.4" strokeDasharray="2 2"/>
        <line x1="1480" y1="90" x2="1480" y2="140" stroke={ink} strokeWidth="0.4"/>
      </g>
      {/* dimension lines, left */}
      <g>
        <line x1="90" y1="140" x2="90" y2="450" stroke={ink} strokeWidth="0.5" markerEnd="url(#dwg-arrow)" markerStart="url(#dwg-arrow-r)"/>
        <line x1="90" y1="450" x2="90" y2="760" stroke={ink} strokeWidth="0.5" markerEnd="url(#dwg-arrow)" markerStart="url(#dwg-arrow-r)"/>
        <text x="80" y="298" textAnchor="middle" fontSize="10" fontWeight="600" fill={ink} transform="rotate(-90 80 298)">76'-0"</text>
        <text x="80" y="608" textAnchor="middle" fontSize="10" fontWeight="600" fill={ink} transform="rotate(-90 80 608)">76'-0"</text>
      </g>

      {/* North arrow */}
      <g transform="translate(1490 90)">
        <circle r="22" fill="none" stroke={ink} strokeWidth="0.8"/>
        <path d="M0 -16 L8 12 L0 6 L-8 12 Z" fill={ink}/>
        <text y="-26" textAnchor="middle" fontSize="11" fontWeight="700" fill={ink}>N</text>
      </g>

      {/* Title block bottom-right */}
      <g>
        <rect x="1180" y="800" width="370" height="55" fill="rgba(255,255,255,0.92)" stroke={ink} strokeWidth="1"/>
        <line x1="1180" y1="818" x2="1550" y2="818" stroke={ink} strokeWidth="0.5"/>
        <line x1="1410" y1="800" x2="1410" y2="855" stroke={ink} strokeWidth="0.5"/>
        <text x="1190" y="813" fontSize="9" fontWeight="700" letterSpacing="2" fill={ink}>SHEET</text>
        <text x="1420" y="813" fontSize="9" fontWeight="700" letterSpacing="2" fill={ink}>PROJECT</text>
        <text x="1190" y="832" fontSize="14" fontWeight="700" letterSpacing="1" fill={ink}>M-301</text>
        <text x="1190" y="848" fontSize="9" letterSpacing="0.6" fill={dim}>MECH · ROOF PLAN · REV D · 05·14·26</text>
        <text x="1420" y="832" fontSize="11" fontWeight="700" letterSpacing="0.6" fill={ink}>24-118</text>
        <text x="1420" y="848" fontSize="8" letterSpacing="0.4" fill={dim}>AURORA MED CTR · PH II</text>
      </g>

      {/* scale + sheet meta bottom-left */}
      <g>
        <text x="60" y="820" fontSize="9" fontWeight="700" letterSpacing="1.5" fill={ink}>SCALE · 1/8" = 1'-0"</text>
        <line x1="60" y1="830" x2="200" y2="830" stroke={ink} strokeWidth="1.4"/>
        <line x1="60" y1="826" x2="60" y2="834" stroke={ink} strokeWidth="0.6"/>
        <line x1="95" y1="826" x2="95" y2="834" stroke={ink} strokeWidth="0.6"/>
        <line x1="130" y1="826" x2="130" y2="834" stroke={ink} strokeWidth="0.6"/>
        <line x1="165" y1="826" x2="165" y2="834" stroke={ink} strokeWidth="0.6"/>
        <line x1="200" y1="826" x2="200" y2="834" stroke={ink} strokeWidth="0.6"/>
        <text x="60" y="846" fontSize="8" letterSpacing="0.4" fill={dim}>0   10   20   30   40 FT</text>
      </g>
    </svg>
  );
}

/* ─────────── PIN ─────────── */
function Pin({ p, selected, onClick }) {
  const cls = `bp-dwg-pin bp-dwg-pin-${p.type} bp-dwg-pin-${p.status.toLowerCase()} ${selected?"is-selected":""}`;
  const label = p.type === "rfi" ? "?" : p.type === "observation" ? "○" : p.priority[0];
  return (
    <button className={cls} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={onClick} title={p.title}>
      <span className="bp-dwg-pin-tail"/>
      <span className="bp-dwg-pin-head">
        <span className="bp-dwg-pin-glyph">{label}</span>
      </span>
    </button>
  );
}

/* ─────────── COMMENT ─────────── */
function Comment({ c }) {
  const person = PEOPLE.find(p => p.id === c.who);
  const text = c.text.split(/(@[A-Z]\. \w+)/g).map((s, i) => {
    if (s.startsWith("@")) return <span key={i} className="bp-mention">{s}</span>;
    return s;
  });
  return (
    <div className={`bp-dwg-comment ${c.ai?"is-ai":""}`}>
      <div className="bp-dwg-comment-av" style={{ background: c.ai ? "var(--bp-ink)" : person.color, color: c.ai ? "var(--bp-blue)" : "#fff" }}>
        {c.ai ? "✦" : person.name.split(" ").map(p => p[0]).join("")}
      </div>
      <div className="bp-dwg-comment-body">
        <div className="bp-dwg-comment-head">
          <b>{person.name}</b>
          <span className="bp-dim">·</span>
          <span className="bp-dwg-comment-role">{person.role}</span>
          <span className="bp-dwg-comment-time bp-mono">{c.time}</span>
        </div>
        <div className="bp-dwg-comment-text">{text}</div>
      </div>
    </div>
  );
}

/* ─────────── PIN PANEL ─────────── */
function PinPanel({ pin, onClose, onPost }) {
  const [draft, setDraft] = useState("");
  const [mentioning, setMentioning] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(""); }, [pin?.id]);

  if (!pin) return null;

  function handleChange(e) {
    const val = e.target.value;
    setDraft(val);
    // detect active @mention
    const at = val.lastIndexOf("@");
    const after = at >= 0 ? val.slice(at + 1) : "";
    if (at >= 0 && !after.match(/\s/)) {
      const q = after.toLowerCase();
      const matches = PEOPLE.filter(p => p.name.toLowerCase().includes(q) || q === "");
      setMentioning({ q, matches, at });
    } else setMentioning(null);
  }
  function pickMention(person) {
    const before = draft.slice(0, mentioning.at);
    const after = draft.slice(mentioning.at).replace(/^@\w*/, "");
    setDraft(before + "@" + person.name + " " + after.trimStart());
    setMentioning(null);
    inputRef.current?.focus();
  }
  function post() {
    if (!draft.trim()) return;
    onPost(draft);
    setDraft("");
  }

  const priColor = { Critical:"var(--bp-warn)", High:"var(--bp-warn)", Medium:"var(--bp-amber)", Low:"var(--bp-graphite)" }[pin.priority] || "var(--bp-graphite)";
  return (
    <aside className="bp-dwg-panel">
      <div className="bp-dwg-panel-head">
        <div className="bp-dwg-panel-tags">
          <span className={`bp-dwg-tag-type bp-dwg-tag-${pin.type}`}>{pin.type.toUpperCase()}</span>
          <span className="bp-dwg-tag-pri" style={{ borderColor: priColor, color: priColor }}>{pin.priority.toUpperCase()}</span>
          <span className={`bp-dwg-tag-status bp-dwg-tag-status-${pin.status.toLowerCase()}`}>{pin.status.toUpperCase()}</span>
        </div>
        <button className="bp-icon-btn" onClick={onClose}><DI.close/></button>
      </div>

      <div className="bp-dwg-panel-body">
        <div className="bp-eyebrow">— {pin.issueRef} · {pin.id}</div>
        <h3 className="bp-dwg-panel-title">{pin.title}</h3>
        <div className="bp-dwg-panel-meta">
          <div><span className="bp-mini-label">asset</span><span className="bp-mono">{pin.asset}</span></div>
          <div><span className="bp-mini-label">assigned</span><span>{pin.assigned}</span></div>
        </div>

        <div className="bp-dwg-panel-acts">
          <button className="bp-btn-ghost">▸ Open record</button>
          <button className="bp-btn-ghost">Reassign</button>
          <button className="bp-btn-primary">[ RESOLVE ]</button>
        </div>

        <div className="bp-dwg-thread">
          <div className="bp-eyebrow">— THREAD · {pin.comments.length} COMMENTS</div>
          <div className="bp-dwg-comments">
            {pin.comments.map(c => <Comment key={c.id} c={c}/>)}
          </div>
        </div>
      </div>

      <div className="bp-dwg-reply">
        {mentioning && mentioning.matches.length > 0 && (
          <div className="bp-dwg-mentions">
            <div className="bp-eyebrow bp-dwg-mentions-head">— MENTION</div>
            {mentioning.matches.slice(0,6).map(p => (
              <button key={p.id} className="bp-dwg-mention-item" onClick={()=>pickMention(p)}>
                <span className="bp-dwg-mention-av" style={{ background: p.color, color: "#fff" }}>{p.name.split(" ").map(s=>s[0]).join("")}</span>
                <span className="bp-dwg-mention-name">{p.name}</span>
                <span className="bp-dwg-mention-role bp-dim">{p.role}</span>
              </button>
            ))}
          </div>
        )}
        <div className="bp-dwg-reply-input">
          <input ref={inputRef} value={draft} onChange={handleChange} placeholder="Reply · use @ to mention someone…" onKeyDown={e => e.key === "Enter" && !mentioning && post()}/>
          <button className="bp-icon-btn"><DI.paperclip/></button>
          <button className="bp-dwg-reply-send" onClick={post} disabled={!draft.trim()}><DI.send/></button>
        </div>
      </div>
    </aside>
  );
}

/* ─────────── SHEETS RAIL ─────────── */
function SheetsRail({ sheets, activeId, onSelect, filter, setFilter }) {
  const filters = ["all", "issues", "rfis", "observations", "resolved"];
  return (
    <aside className="bp-dwg-rail">
      <div className="bp-dwg-rail-head">
        <div className="bp-eyebrow">— SHEETS · 9</div>
        <div className="bp-dwg-search">
          <DI.search/>
          <input placeholder="Search sheets…" readOnly/>
        </div>
      </div>
      <div className="bp-dwg-rail-filters">
        {filters.map(f => (
          <button key={f} className={`bp-dwg-filter ${filter===f?"is-on":""}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="bp-dwg-sheets">
        {sheets.map(s => (
          <button key={s.id} className={`bp-dwg-sheet ${s.id===activeId?"is-on":""}`} onClick={()=>onSelect(s.id)}>
            <div className="bp-dwg-sheet-thumb">
              <SheetThumb id={s.id}/>
              {s.pins > 0 && <div className="bp-dwg-sheet-thumb-dot">{s.pins}</div>}
            </div>
            <div className="bp-dwg-sheet-meta">
              <div className="bp-dwg-sheet-id bp-mono">{s.id}</div>
              <div className="bp-dwg-sheet-title">{s.title}</div>
              <div className="bp-dwg-sheet-rev bp-mono bp-dim">REV {s.rev} · {s.date}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function SheetThumb({ id }) {
  // tiny abstract — different sheets get different patterns
  const ink = "var(--bp-ink)";
  const tints = {
    "M-301": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><rect x="6" y="14" width="22" height="22" fill="none" stroke={ink} strokeWidth="0.8"/><rect x="38" y="10" width="24" height="34" fill="rgba(18,64,255,0.18)" stroke="var(--bp-blue)" strokeWidth="0.8"/><rect x="72" y="14" width="22" height="22" fill="none" stroke={ink} strokeWidth="0.8"/><line x1="6" y1="56" x2="94" y2="56" stroke={ink} strokeWidth="0.6"/></svg>),
    "M-302": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/>{[...Array(8)].map((_,i)=><rect key={i} x={6+i*11} y={14} width="9" height={20+i*2} fill="none" stroke={ink} strokeWidth="0.6"/>)}<line x1="6" y1="56" x2="94" y2="56" stroke={ink} strokeWidth="0.6"/></svg>),
    "M-303": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/>{[...Array(8)].map((_,i)=><rect key={i} x={6+i*11} y={20} width="9" height="22" fill="none" stroke={ink} strokeWidth="0.6"/>)}</svg>),
    "M-304": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><rect x="6" y="14" width="88" height="42" fill="none" stroke={ink} strokeWidth="0.8"/><line x1="6" y1="34" x2="94" y2="34" stroke={ink} strokeWidth="0.4"/><line x1="50" y1="14" x2="50" y2="56" stroke={ink} strokeWidth="0.4"/></svg>),
    "M-501": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><circle cx="30" cy="35" r="14" fill="none" stroke={ink} strokeWidth="0.8"/><rect x="55" y="20" width="35" height="30" fill="none" stroke={ink} strokeWidth="0.8"/><line x1="6" y1="56" x2="94" y2="56" stroke={ink} strokeWidth="0.6"/></svg>),
    "E-201": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><path d="M10 35 L40 35 L40 20 L70 20 M40 35 L40 50 L70 50" fill="none" stroke={ink} strokeWidth="0.8"/><circle cx="70" cy="20" r="3" fill={ink}/><circle cx="70" cy="50" r="3" fill={ink}/></svg>),
    "E-401": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><line x1="20" y1="14" x2="20" y2="56" stroke={ink} strokeWidth="1"/><line x1="20" y1="20" x2="40" y2="20" stroke={ink} strokeWidth="0.6"/><line x1="20" y1="35" x2="40" y2="35" stroke={ink} strokeWidth="0.6"/><line x1="20" y1="50" x2="40" y2="50" stroke={ink} strokeWidth="0.6"/><circle cx="50" cy="20" r="3" fill="none" stroke={ink} strokeWidth="0.6"/><circle cx="50" cy="35" r="3" fill="none" stroke={ink} strokeWidth="0.6"/><circle cx="50" cy="50" r="3" fill="none" stroke={ink} strokeWidth="0.6"/></svg>),
    "FP-101": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/>{[...Array(6)].map((_,i)=><circle key={i} cx={15+i*14} cy="35" r="3" fill="none" stroke={ink} strokeWidth="0.6"/>)}<line x1="15" y1="35" x2="85" y2="35" stroke={ink} strokeWidth="0.6" strokeDasharray="2 2"/></svg>),
    "A-101": (<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="var(--bp-paper)"/><rect x="6" y="10" width="88" height="50" fill="none" stroke={ink} strokeWidth="0.8"/><line x1="30" y1="10" x2="30" y2="60" stroke={ink} strokeWidth="0.4"/><line x1="70" y1="10" x2="70" y2="60" stroke={ink} strokeWidth="0.4"/></svg>),
  };
  return tints[id] || tints["M-301"];
}

/* ─────────── DRAWINGS SCREEN ─────────── */
function DrawingsScreen({ setRoute, setAiOpen }) {
  const [sheets] = useState(SHEETS);
  const [activeSheet, setActiveSheet] = useState("M-301");
  const [filter, setFilter] = useState("all");
  const [pins, setPins] = useState(initialPins);
  const [selectedPinId, setSelectedPinId] = useState(initialPins.find(p => p.selected)?.id || null);
  const [tool, setTool] = useState("hand");
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState({ issues: true, observations: true, rfis: true, resolved: false });
  const [layersOpen, setLayersOpen] = useState(false);

  const selectedPin = pins.find(p => p.id === selectedPinId);
  const visiblePins = pins.filter(p => {
    if (p.status === "Resolved" && !layers.resolved) return false;
    if (p.type === "issue" && !layers.issues) return false;
    if (p.type === "observation" && !layers.observations) return false;
    if (p.type === "rfi" && !layers.rfis) return false;
    return true;
  });

  function postComment(text) {
    setPins(ps => ps.map(p => p.id === selectedPinId ? {
      ...p,
      comments: [...p.comments, { id: "n" + Date.now(), who: "mo", time: "now", text }]
    } : p));
  }

  return (
    <div className="bp-dwg">
      <SheetsRail sheets={sheets} activeId={activeSheet} onSelect={setActiveSheet} filter={filter} setFilter={setFilter}/>

      <div className="bp-dwg-viewer">
        <div className="bp-dwg-viewer-head">
          <div>
            <div className="bp-eyebrow">— DRAWING · M-301 · REV D</div>
            <h2 className="bp-dwg-viewer-title">Mechanical · Roof Plan <span className="bp-mono bp-dim">[ 24-118 ]</span></h2>
          </div>
          <div className="bp-dwg-viewer-tools">
            <div className="bp-dwg-pin-counts">
              <span className="bp-dwg-pin-count bp-dwg-pc-issue"><i/>{visiblePins.filter(p=>p.type==="issue"&&p.status!=="Resolved").length} ISSUES</span>
              <span className="bp-dwg-pin-count bp-dwg-pc-rfi"><i/>{visiblePins.filter(p=>p.type==="rfi").length} RFIs</span>
              <span className="bp-dwg-pin-count bp-dwg-pc-obs"><i/>{visiblePins.filter(p=>p.type==="observation").length} OBS</span>
            </div>
            <button className="bp-btn-ghost" onClick={()=>setAiOpen(true)}><DI.layers/> Ask AI</button>
          </div>
        </div>

        <div className="bp-dwg-stage">
          {/* floating toolbar */}
          <div className="bp-dwg-toolbar">
            {[
              ["hand", DI.hand, "Pan"],
              ["pin", DI.pin, "Pin · Add"],
              ["poly", DI.poly, "Polygon"],
              ["measure", DI.measure, "Measure"],
              ["text", DI.text, "Text"],
              ["divider"],
              ["undo", DI.undo, "Undo"],
            ].map(([id, Ic, label]) => id === "divider"
              ? <div key="d" className="bp-dwg-toolbar-div"/>
              : <button key={id} className={`bp-dwg-tool ${tool===id?"is-on":""}`} onClick={()=>setTool(id)} title={label}><Ic/></button>
            )}
          </div>

          {/* layers control */}
          <div className="bp-dwg-layers">
            <button className="bp-dwg-layers-btn" onClick={()=>setLayersOpen(o=>!o)}>
              <DI.layers/> LAYERS <DI.chev/>
            </button>
            {layersOpen && (
              <div className="bp-dwg-layers-pop">
                {[
                  ["issues", "Issues", "#C13A2A"],
                  ["observations", "Observations", "#B5731B"],
                  ["rfis", "RFIs", "#1240FF"],
                  ["resolved", "Resolved", "#1F6F3E"],
                ].map(([k, label, color]) => (
                  <label key={k}>
                    <input type="checkbox" checked={layers[k]} onChange={e=>setLayers(l=>({...l,[k]:e.target.checked}))}/>
                    <span className="bp-dwg-layer-dot" style={{background: color}}/>
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* zoom controls */}
          <div className="bp-dwg-zoom">
            <button onClick={()=>setZoom(z=>Math.max(0.5, z-0.1))}><DI.minus/></button>
            <div className="bp-dwg-zoom-val bp-mono">{Math.round(zoom*100)}%</div>
            <button onClick={()=>setZoom(z=>Math.min(2, z+0.1))}><DI.plus/></button>
            <button onClick={()=>setZoom(1)}><DI.fit/></button>
          </div>

          {/* canvas */}
          <div className="bp-dwg-canvas">
            <div className="bp-dwg-canvas-inner" style={{ transform: `scale(${zoom})` }}>
              <FloorPlanSVG/>
              {visiblePins.map(p => (
                <Pin key={p.id} p={p} selected={p.id===selectedPinId} onClick={()=>setSelectedPinId(p.id)}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PinPanel pin={selectedPin} onClose={()=>setSelectedPinId(null)} onPost={postComment}/>
    </div>
  );
}

window.BlueprintDrawings = DrawingsScreen;
})();
