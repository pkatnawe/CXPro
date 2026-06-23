# External Data Catalog — for Commissioning Agent Evaluation

A catalog of **legitimately public** real-project commissioning documents and open datasets we can use to build and run evaluations for the role agents. Nothing here is proprietary, confidential, or leaked — only intentionally-published / public-record / open-licensed material.

**Usage column key:**
- `reference` — read/structure-learn from it; safe to use as a labelling schema or gold structure.
- `eval-only` — may run evals against it, but the license forbids redistributing/modifying (e.g. CC BY-NC-ND). Keep it out of any shipped artifact.
- `ingest-ok` — open license (public domain / CC BY / CC0 / Apache / BSD); safe to ingest and redistribute with attribution.
- `verify` — license inferred, confirm the record before relying on it.

> ⚠️ License discipline: confirm each `verify`/`eval-only` item before it touches a shipped dataset. US-government works are public domain; CC BY needs attribution; CC BY-NC-ND is eval-only; ASHRAE/association docs are reference-only unless licensed. We never reproduce copyrighted standard text — we cite the clause and point to the licensed copy.

---

## Part 1 — Real-project commissioning documents (public procurement / capital projects)

Use these as **gold structure** for OPR/BoD/Cx-plan/FPT-form generation and traceability evals, and as realistic scenario seeds.

### Government / public-sector (US-gov works = public domain)
| Source | What it gives us | Usage | URL |
|---|---|---|---|
| GSA Building Commissioning Guide (2020) | Canonical process + example checklists, FPTs, issue-tracking forms | ingest-ok (PD) | https://www.wbdg.org/FFC/GSA/gsa_commissioning_guide_2020.pdf |
| EPA Federal Green — 01 91 00 Cx spec | Real MasterFormat 01 91 00 spec (scope, roles, pre-functional/functional reqs) | ingest-ok (PD) | https://www.wbdg.org/FFC/EPA/FEDGREEN/fgs_019100.pdf |
| EPA — 01 91 00 (standalone) | Second federal 01 91 00 example | ingest-ok (PD) | https://www.epa.gov/sites/default/files/2014-03/documents/019100.pdf |
| VA — 01 91 00 | Healthcare/hospital Cx scope | ingest-ok (PD) | https://www.wbdg.org/FFC/VA/VAASC/VA%2001%2091%2000.pdf |
| ENERGY STAR — Multifamily HVAC Functional Testing Checklist | Clean pass/fail FPT form | ingest-ok (PD) | https://www.energystar.gov/sites/default/files/asset/document/DRAFT%20MF%20Functional%20Testing%20Checklist_18.06.04.pdf |
| DOE FEMP — Commissioning Existing Buildings (O&M Guide Ch. 7) | EBCx methodology, deficiency tracking | ingest-ok (PD) | https://www1.eere.energy.gov/femp/pdfs/om_7.pdf |
| NY OGS — 019113 (MasterSpec .doc) | State spec w/ pre-functional + FPT references | reference (verify) | https://online2.ogs.ny.gov/dnc/masterspec04/docs/Division01GeneralRequirements/019113GeneralCommissioningRequirements.doc |

### University design standards (© institution, openly posted for vendors — `reference`)
| Source | What it gives us | URL |
|---|---|---|
| Harvard Medical School — OPR Template | Blank structured OPR (sign-off, performance criteria) | https://campusplanning.hms.harvard.edu/sites/default/files/HMS_OPR%20Template_160923_0.pdf |
| U-Michigan — Sample Cx Plan (Master) | Richest single doc: Cx plan + responsibility matrix + check sheets + duct-leak forms | https://umaec.umich.edu/wp-content/uploads/2013/08/Sample-Cx-Plan-Master.pdf |
| Yale — 01 91 00 (2024) | Modern Cx requirements; roles, OPR, enclosure & monitoring-based Cx | https://facilities.yale.edu/sites/default/files/files/Design%20Standards/01%2091%2000%20-%20General%20Commissioning%20Requirements_20241103_FINAL%20V1.pdf |
| Univ. of Houston — 01 91 13 | Full master spec; OPR/BoD/Cx-plan, construction checklists, FPT flow | https://www.uh.edu/facilities-planning-construction/vendor-resources/owners-design-criteria/master-specs/pdf/01-91-13-fl-general-commissioning-reqmts.pdf |
| UT Dallas / UT Arlington — 01 91 00 | Cx-plan contents; a named "Functional Test Checklist" artifact | https://facilities.utdallas.edu/download/UTD_DGCS_01-91-00_General_Commissioning_Requirements.pdf |
| CU Anschutz — 23 08 00 / Northwestern — 22 08 00 | Discipline-specific HVAC & plumbing Cx (pre-functional vs functional) | https://www.cuanschutz.edu/docs/librariesprovider260/design-and-construction/guidelines-and-standards/division-23/230800---commissioning-hvac.pdf |

### Public procurement RFPs / SOWs (public-record; real, current scope)
| Source | What it gives us | URL |
|---|---|---|
| Ohio FCC — RFQ for Cx Agent (SFC-200444) | Real state RFQ: design-review→warranty scope, FPT, seasonal testing, Cx logs | https://dam.assets.ohio.gov/image/upload/ofcc.ohio.gov/Portals/0/Documents/Opportunities/ConsultList/RFQ-SFC-200444-CxA.pdf |
| Tulalip Tribes — Health Clinic HVAC Upgrade Cx RFP (2026) | Current retrofit/EBCx RFP: AHU/boiler/chiller/controls/TAB Cx plan | https://www.tulaliptribes-nsn.gov/rfp/documents/RFP-Tulalip-Health-Clinic-HVAC-Upgrade-20260311.pdf |
| Milwaukee County — worked OPR (RFP appendix) | A *filled-in* real municipal OPR (vs. blank template) | https://county.milwaukee.gov/ (Appendix B OPR; browser-access) |

### Sample-form sets (license-flagged — `reference`, confirm before reuse)
| Source | What it gives us | Flag | URL |
|---|---|---|---|
| ACG — Appendix D Sample FPT Checklists (.doc) | Editable FPT checklists for 5 HVAC systems w/ pass/fail + sign-off | © ACG, reuse uncertain | https://www.commissioning.org/wp-content/uploads/2023/03/Appendix-D.doc |
| Facility Commissioning Group — Sample Cx Documents | Broad SVC+FPT set, resolution-tracking (issue log), 019113 specs | © firm, redistribution unclear | https://facomgrp.com/documents-and-specifications/ |
| DOE/PECI Functional Testing Guide (FTGuide.org) | ~95 prefunctional checklists + FPTs (AHU/chiller/boiler/pump) | aging host, verify per-doc | https://www.ftguide.org/ftct/testdir.htm |

---

## Part 2 — Open datasets & benchmarks

### A. HVAC fault-detection (labeled faults) — for deviation/FDD evals
| Dataset | Contents | License → Usage | URL |
|---|---|---|---|
| LBNL FDD Datasets (OEDI) | Labeled faulted/fault-free for 7 HVAC system types + Brick .ttl | DOE/OEDI open → ingest-ok (verify) | https://data.openei.org/submissions/5763 |
| Drexel/FLEXLAB AHU faults (2025) | Real+sim, 7 fault classes incl. cyber, RBC vs G36 | CC BY-NC-ND → eval-only | https://doi.org/10.6084/m9.figshare.29297999 |
| ORNL VAV terminal-unit faults (2025) | 10 VAV boxes; stuck damper, biased airflow, severities | CC BY-NC-ND → eval-only | https://doi.org/10.6084/m9.figshare.27948192.v2 |
| CSIRO AHU fault dataset | 2 real AHUs, 8 fault classes, injected+labeled | CC BY-SA → ingest-ok (ShareAlike) | https://github.com/csiro-energy-systems/ahu-fault-detection-dataset |
| Semi-labelled AHU, S. Korea (2024) | 20 AHUs, 6 classes, imbalanced | CC BY → ingest-ok | https://doi.org/10.6084/m9.figshare.25909813.v1 |
| Field RTU operating data (Mendeley) | Real RTU refrigerant-cycle faults, 5 classes | CC BY (verify) | https://data.mendeley.com/datasets/9h6gpbhj5k/1 |
| NIST building fault data (2020) | HVACSIM+ simulated faults for diagnostics | US-gov (verify) → ingest-ok | https://www.nature.com/articles/s41597-020-0398-6 |

> Negative finding: **ASHRAE RP-1043 chiller fault data is NOT open** (purchase/request only). Open fault data skews AHU/VAV/RTU; chiller-plant labeled faults are a gap.

### B. BAS / operational data & metadata schemas — for point-semantics & SOO evals
| Dataset | Contents | License → Usage | URL |
|---|---|---|---|
| Mortar (mortardata.org) | ~107 buildings, >10B points, full Brick models | free acct, terms unposted → verify | https://mortardata.org/ |
| BTS / DIEF (NeurIPS 2024) | 3 bldgs, >10k points, Brick; ships point-classification + forecast tasks | CC BY → ingest-ok | https://github.com/cruiseresearchgroup/DIEF_BTS |
| Google Smart Buildings + sbsim | 6 yrs, 3 offices; setpoint/action/observation schema + RL sim | CC BY (data)/Apache (code) → ingest-ok | https://github.com/google/sbsim |
| LBNL 3-yr Berkeley office | >300 sensors; energy+HVAC+IEQ+occupancy, Brick-modeled | Nature SciData (verify) | https://www.nature.com/articles/s41597-022-01257-x |
| Project Haystack reference sites | Tagged central-plant/VAV/hospital models (Zinc/JSON/TTL/CSV) | open → ingest-ok | https://project-haystack.org/example |
| LEAD1.0 | ~1,413 annotated meters, per-point anomaly labels | CC BY → ingest-ok | https://github.com/samy101/lead-dataset |
| PNNL Benchmark Datasets for Buildings (aggregator) | Index of more building datasets | varies | https://bbd.labworks.org/ |

### C. Thermal comfort / IEQ / occupancy — for OPR/IEQ-verification evals
| Dataset | Contents | License → Usage | URL |
|---|---|---|---|
| ASHRAE Global Thermal Comfort DB II | ~81k+ measurements + occupant votes; PMV/PPD/SET | ODbL → ingest-ok (attribution+SA) | https://doi.org/10.6078/D1F671 |
| UCI Occupancy Detection | 20,560 rows; temp/RH/light/CO₂ → occupancy | CC BY → ingest-ok | https://archive.ics.uci.edu/dataset/357 |
| Langevin US offices HBI (2019) | 24 occupants, 1 yr; 2,503 surveys + IEQ + control states | CC BY (verify) | https://www.nature.com/articles/s41597-019-0273-5 |
| CBE Thermal Comfort Tool (oracle) | Standard-55 / EN-16798 calculator — ground-truth checker | tool | https://comfort.cbe.berkeley.edu/ |

### D. Data-center telemetry (power/cooling/PUE) — scarce; HPC + simulators are best
| Dataset | Contents | License → Usage | URL |
|---|---|---|---|
| Frontier supercomputer energy/facility (ORNL) | 1 yr, 10-min; power, coolant loops, waste heat, PUE; liquid-cooled | Figshare (verify) | https://doi.org/10.6084/m9.figshare.24391240 |
| NREL ESIF HPC PUE | Time-series PUE, warm-water-cooled HPC | US-gov (verify) | data.openei.org (search "ESIF PUE") |
| SustainDC / SustainCluster (HPE) | Physics-informed DC sim (CRAC, chillers, towers, pumps, wet-bulb) | MIT → ingest-ok | https://github.com/HewlettPackard/sustain-cluster |
| Sinergym 2ZoneDataCenterHVAC | EnergyPlus DC model (economizer, DX, CHW, VAV) | MIT (verify) | https://github.com/ugr-sail/sinergym |

> Real *commercial* DC facility telemetry is essentially unavailable publicly. Use HPC data + simulators for the data-center angle; use news trackers (Data Center Frontier/DCD) only for synthetic-scenario context (names/MW/locations), never as engineering data.

### E. LLM / QA benchmarks (building/engineering) — adjacent only
| Benchmark | Contents | License → Usage | URL |
|---|---|---|---|
| UTQA | 50 undergrad thermodynamics QA | open → ingest-ok | https://huggingface.co/datasets/herteltm/UTQA |
| SciBench | 869 college physics/chem/math free-response | open → ingest-ok | https://scibench-ucla.github.io/ |
| BuildingsBench (NREL/PNNL) | Numeric load-forecasting (not QA) | BSD-3 code / OEDI data | https://github.com/NREL/BuildingsBench |
| ASHRAE Certified HVAC Designer eval (paper) | 12 LLMs on a cert exam — **blueprint only, no released bank** | n/a | https://www.sciencedirect.com/science/article/pii/S2666123324000448 |

> **The gap that defines our build:** no public benchmark covers commissioning reasoning — functional performance testing, sequence-of-operations verification, point-to-point checkout, TAB, OPR/BoD traceability, deviation triage. The adjacent sets cover only thermo/physics fundamentals. **We build the commissioning QA/reasoning benchmark ourselves** (see `README.md`).

---

## Part 3 — Document-intelligence data (drawings, schematics, schedules, BIM)

For the document-intelligence track (`cxbench/document-intelligence.md`). Same usage keys; `eval-only`
here also flags non-commercial licenses that may be run against but never shipped.

### Drawings / CAD / floor plans
| Source | Contents | License → Usage | URL |
|---|---|---|---|
| FloorPlanCAD | ~15.7k real CAD floor plans, line-grained symbol labels, ~30 classes | CC BY-NC → eval-only | https://floorplancad.github.io/ |
| CubiCasa5K | 5k real floor plans, SVG + raster, 80+ categories | CC BY-NC-SA → eval-only | https://github.com/CubiCasa/CubiCasa5k |
| ResPlan | 17k residential plans, vector + room graphs | MIT → ingest-ok | https://github.com/m-agour/ResPlan |
| ArchCAD-400K | 413k chunks from 5.5k CAD drawings (largest) | license unconfirmed → verify | https://archiai-lab.github.io/ArchCAD.github.io/ |
| VA Standard Details / USACE A/E/C CAD / DoD UFGS graphics | real federal MEP detail drawings + symbology/layer taxonomy | public domain → ingest-ok | https://www.cfm.va.gov/til/ · https://www.wbdg.org/FFC/AECCAD/ERDCITL_TR12-6_r6.pdf |
| Public-record bid drawing sets (state/municipal/university) | real full MEP sheet sets (one-lines, schedules, control diagrams) | public-record, A/E © → reference-only (annotate, don't redistribute) | university/municipal e-permit & capital-projects portals |

### Schematics / one-lines / P&IDs (symbol + connectivity)
| Source | Contents | License → Usage | URL |
|---|---|---|---|
| PID2Graph | real P&IDs with full connection **graphs** (nodes+edges, GraphML) | CC BY-SA → ingest-ok | https://zenodo.org/records/14803338 |
| CGHD | hand-drawn circuits: 2.4k imgs, 201k boxes, 59 classes, symbols+connections+text | CC0 → ingest-ok | https://github.com/DFKI/cghd |
| Digitize-PID | 500 synthetic P&IDs, 32 symbol classes | CC BY-NC-ND → eval-only | https://arxiv.org/abs/2109.03794 |
| SESYD / GREC | synthetic arch + electrical symbol spotting (dated) | research-use | https://paperswithcode.com/dataset/sesyd-dataset |
| SLED | real single-line electrical drawings (only named SLD benchmark) | IEEE, access uncertain → verify | https://ieeexplore.ieee.org/document/10295140 |
| Wikimedia electrical + P&ID symbol banks | redistributable labeled symbol dictionary | CC0 / CC BY-SA → ingest-ok | https://commons.wikimedia.org/wiki/Category:P%26ID_symbols |

### Tables / schedules (equipment & panel schedules)
| Source | Contents | License → Usage | URL |
|---|---|---|---|
| PubTables-1M | ~1M tables, full structure (rows/cols/spanning) | CDLA-Permissive → ingest-ok | https://huggingface.co/datasets/bsmock/pubtables-1m |
| FinTabNet | dense irregular multi-span tables (closest to messy real schedules) | CDLA-Permissive → ingest-ok | https://developer.ibm.com/data/fintabnet/ |
| PubTabNet | 568k table images → HTML structure (TEDS origin) | CDLA-Permissive → ingest-ok | https://github.com/ibm-aur-nlp/PubTabNet |

### BIM / IFC (structured ground truth, renderable to drawings)
| Source | Contents | License → Usage | URL |
|---|---|---|---|
| NIST Common BIM Files | IFC + **COBie** equipment/space schedules + PDF (apartment/office/clinic) | public domain → ingest-ok | https://wrw.is/free-common-building-information-mode/ (NIST page 404; mirror) |
| buildingSMART Sample-Test-Files | schema-valid IFC4 / IFC4X3 samples | CC BY 4.0 → ingest-ok | https://github.com/buildingSMART/Sample-Test-Files |
| Open IFC Model Repository (Auckland) | ~130 multi-discipline IFC models incl. MEP | mostly CC, verify per-model | https://openifcmodel.cs.auckland.ac.nz/ |

### Benchmark templates to model the methodology on (not data to ingest)
DUDE (multi-page, non-answerable, calibration) · InfographicVQA (dense numeric) · PubTables-1M/PubTabNet (TEDS) ·
FloorPlanCAD (panoptic symbol PQ) · CGHD (symbol+graph) · PID2Graph (graph-level) · MMMU (only MLLM bench with
real circuit/blueprint content) · CharXiv (descriptive-vs-reasoning split + validated LLM-judge). Metrics: **ANLS/ANLS\***,
relaxed accuracy, **TEDS**, detection **mAP**, **edge/connection accuracy**, box-grounded **Acc@IoU**, validated LLM-judge.

> **Gap:** no public benchmark exists for engineering/construction drawing understanding, and none for
> commissioning document intelligence. One-lines have none; P&IDs have only synthetic + one new graph set;
> schedules borrow from finance/science tables. The real, labeled, commissioning-specific drawing corpus is
> ours to build — see `cxbench/document-intelligence.md`.
