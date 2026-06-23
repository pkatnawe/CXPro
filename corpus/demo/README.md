# Demo Data Plan — one coherent, license-clean project

To demo CXPro convincingly we need **one believable end-to-end data-center commissioning project** that
drives every role agent and the system — generated entirely from license-clean sources so it can ship in a
sales demo. This is distinct from the eval corpus (`../eval/`): demo data shows the product working; eval
data measures it. They share the same domain and the same **hard, multimodal** emphasis (see `../eval/README.md`).

## The scenario (fictional, plausible)

A **~150 MW Phase-1 hyperscale AI data center**: closed-loop liquid + air-economizer cooling, ~130 kW GB-class
racks, CDU-based direct-to-chip cooling, gas-genset standby power, US Midwest/Texas locale. The scenario is a
*blend* of public reporting (closed-loop liquid, direct-to-chip, chiller-plant gigawatt campuses) with a
**fictional name and owner** — nothing proprietary is copied. Public projects used only as inspiration for
plausibility (vendor palette: NVIDIA GB200 NVL72, Vertiv CDUs, Schneider modular cooling, Caterpillar/Cummins
gensets, Tesla Megapack BESS; densities 120–250 kW/rack).

## The generation pipeline (every step license-clean)

| Artifact | Source | License | Tooling |
|---|---|---|---|
| **BAS/telemetry + a known fault log** | EnergyPlus `2ZoneDataCenterHVAC_wEconomizer.idf` (ITE + economizer + DX + CHW) | BSD-3 (commercial OK) | run it; inject deterministic faults (economizer stuck, coil fouling, sensor drift) via EnergyPlus EMS / Python API; optionally mass-produce episodes with **Sinergym** (MIT) |
| **Asset registry + equipment schedules + 2D drawings** | NIST Common BIM Files (Office / Clinic) — IFC + **COBie** + PDF | US public domain | extract COBie/schedules to CSV with **IfcOpenShell `ifccsv`/`ifcfm`** (LGPL — safe to link); render plans/sections with `IfcConvert -yv → SVG`; polish sheets in **Bonsai** (GPL — *standalone tool only*) |
| **P&IDs (mechanical/cooling)** | **SynthPID** (synthetic, GraphML ground truth) → fallback **PID2Graph** | CC BY 4.0 / CC BY-SA 4.0 | use as-is; both carry graph-level labels |
| **Electrical one-lines** | *procedurally generated* with our own symbol library (no clean public dataset exists) | ours | build a small one-line generator (utility→gen/ATS→UPS→PDU) |
| **Cx project structure** | model as Systems → Equipment → PFC → FPT → Issue Log → Documents/Turnover → Milestones | — | format references: Bluerithm template catalog + Procore inspection schema (shape only, copy nothing) |

## Real sample documents to load (demo-ready, legitimately public)

License key: 🟢 public domain/record · 🟡 openly posted, association/firm © (display, don't rebrand) · 🔴 reference-by-name only.

- 🟡 **BCxA OPR Template + Sample** — a filled OPR (owner/FM, OCA kickoff).
- 🟢 **U-Michigan Sample Cx Plan (Master)** — drop-in Cx plan + training-plan structure.
- 🟡 **ACG Appendix D Sample FPT Checklists** — multi-system functional test forms (Cx Engineer, Field Tech).
- 🟢 **Two UIUC Final Cx Reports** (Wounded Veterans, Conference Center) — *complete real reports with filled issues logs*.
- 🟢 **UC Anschutz SOO (23 09 93)** + **U-Toronto BAS Standard** — real control narratives (Design Engineer).
- 🟢 **VA Cx Process Manual + VA 01 91 00 spec** — Cx plan, FPT templates, spec text.
- 🟡 **Manufacturer cut sheets** (display-only): Trane CenTraVac, Vertiv PPC/CRV, Schneider Galaxy VS, Eaton 93PM, Caterpillar/Cummins gensets — for the submittal/asset demo. Pull from OEM-own portals (ABB `library.e.abb.com`, Vertiv globalassets, Trane eLibrary, Carrier shareddocs).
- 🟢 **Complete project anchor**: UC Berkeley *Current Bids* (Dwinelle HVAC Refurbishment / Clean Energy Campus) — specs + drawings + addenda.
- 🔴 **ASHRAE Guideline 0 / 36 / Standard 202** — reference by name only; author synthetic sequences/process text.

Full source list with URLs and licenses is in `../eval/dataset-catalog.md`.

## What drives each persona's demo

| Role agent | Demo moment | Data behind it |
|---|---|---|
| **Cx Engineer** | upload a spec + SOO → AI drafts cited L2–L4 FPTs; a failed step auto-raises a deviation | VA/UFGS spec + UC-Anschutz SOO + ACG FPT forms; EnergyPlus fault log |
| **Field Technician** | tablet: today's test steps, one-tap pass/fail, in-line "what does this mean", capture a photo | ACG/City-of-LA prefunctional checklists + manufacturer cut sheets + IFC-derived asset list |
| **Construction Manager** | look-ahead of witness sessions; a slip re-plans the schedule | Cx Plan + milestones; the project schedule |
| **Design Engineer** | an RFI arrives with the basis-of-design section already cited; a spec↔drawing discrepancy flagged | SOO/control narratives + BoD structure + one-lines/schedules |
| **OCA** | live program-health & compliance posture; the handover dossier assembles itself | UIUC Cx report structure + issues log + COBie systems |
| **Owner / FM** | searchable Q&A over the complete handover record | Systems Manual (ASHRAE G1.4 structure) + COBie + O&M cut sheets |
| **System (monitoring)** | dashboards + trends; an anomaly becomes a routed deviation | EnergyPlus/LBNL-FDD/Korea-AHU labeled fault telemetry |

The **hardest, most differentiating** demo beats are multimodal: tracing the **power chain on a one-line**,
extracting an **equipment schedule off a drawing**, and detecting a **spec-vs-drawing discrepancy** — the same
hard multimodal problems CxBench is built to measure.

## Governance & flags
- Vendor cut sheets are **display-only**, never redistributed as a dataset.
- Non-commercial datasets (CubiCasa5K, FloorPlanCAD, Drexel/ORNL faults, Digitize-PID) are **internal/eval-only** — keep out of a shipped demo build.
- AGPL (pyDEXPI) and GPL (Bonsai code) stay out of product code — Bonsai used as a standalone authoring tool only; its output artifacts are ours.
- BDG2 is ShareAlike; SustainDC has CC-BY-NC parts — isolate or avoid for shipped features.
- **Name check:** the earlier "CxPro = Facility Grid" assumption did **not** hold up; live Cx-prefix incumbents are CxAlloy and CxPlanner. Worth a USPTO trademark search on "CxPro" before committing the product name.
