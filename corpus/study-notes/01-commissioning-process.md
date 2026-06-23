# Commissioning Process — Study Notes

> **CXPro knowledge base — for agent grounding.** Our working notes on the commissioning
> process, written in our own words and framed for CXPro's use case: AI agents that play
> commissioning roles on data-center projects. Structured as reusable knowledge —
> *concept → why it matters → how it maps to CXPro*.
>
> **Role agents referenced:** OCA (Owner's Cx Authority), Cx Engineer, Construction Manager,
> Field Technician, Design Engineer, Owner/FM.
> **Commissioning levels:** L1 factory/component → L2 site-receipt/installation →
> L3 pre-functional/start-up → L4 functional performance → L5 integrated systems.
> **Document chain:** OPR → BoD → Cx Plan → Specs/SOO → Checklists → FPT → Issues Log →
> Systems Manual → Cx Report.

---

## 1. What commissioning is (and is not)

**Concept.** Commissioning (Cx) is a structured quality-assurance process that verifies a
building's systems are *designed, installed, started up, tested, and maintained* to meet the
owner's documented operational intent. It is a **support process** running alongside design,
construction, and operations — not a phase of its own, not a substitute for normal QA/QC, and
not a one-off test of a single device. Its defining move is to evaluate the **whole system
operating together**, not whether one component is individually "good." A chiller that passes
its own test can still be wrong: oversized, poorly sequenced, or fighting another system.

**Why it matters.** Modern buildings — especially data centers — are highly automated and
tightly coupled (cooling, airflow, controls, power, fire/smoke all interlock). Manufacturer
benefits only materialize if the *integrated* system runs correctly. Poorly commissioned HVAC
is the single biggest reason "green"/high-spec buildings under-deliver on energy and comfort.

**CXPro mapping.** This is the OCA agent's worldview. The OCA owns the verification arc end to
end and stays independent of design/construction/vendors so its Cx Report is credible. Every
finding must trace to the OPR; "passes its own spec" is never sufficient — the L4/L5 question
is always *correctly integrated?*

## 2. Why commissioning pays (the business case)

**Concept.** Cx typically costs ~0.5–1.5% of construction cost (more for complex/specialty
facilities — labs, data centers — which can exceed 1%), and returns it through reduced energy
(often 10–15%), fewer post-occupancy callbacks, shorter handover, longer equipment life, and
higher asset value. For owners it lowers life-cycle cost and de-risks the investment.

**Why it matters.** It reframes Cx from a cost line to a value lever — the argument that wins
budget and scope. For data centers, the multiplier is uptime and PUE, not just rent.

**CXPro mapping.** Owner/FM agent uses this to justify Cx scope and ongoing-Cx budgeting. Cx
Engineer ties each test back to a KPI that has a dollar (or PUE/uptime) consequence.

## 3. The document chain (the spine of the process)

The deliverables form an unbroken traceability chain — each document is derived from and
verifiable against the one before it.

| Doc | Owner | What it captures | CXPro role |
|---|---|---|---|
| **OPR** (Owner's Project Requirements) | Owner/FM (OCA assists) | *Functional* intent + measurable KPIs/targets — purpose, occupancy/load profiles, redundancy expectations, IEQ/thermal targets, energy (PUE/EPI), water, uptime, training needs. A **living document**, updated through the project. | Owner/FM authors; OCA reviews for testability |
| **BoD** (Basis of Design) | Design Engineer | The engineer's design assumptions and technical criteria that *satisfy* the OPR — climatic conditions, zoning, diversity, redundancy, efficiency targets, codes. | Design Engineer authors; Cx Engineer checks BoD↔OPR consistency |
| **Cx Plan** | OCA / Cx Engineer | The framework: scope, team directory, communication/meeting structure, schedule, systems list, roles, and the deliverables each party owes. | OCA owns |
| **Specs / SOO** (Sequence of Operations) | Design Engineer | Per-system control logic: every input/output point, set-points, safety limits, modes. Built in 4 steps — flow diagrams → purpose of each unit → code/OPR requirements → point list (DI/AI/DO/AO + alarms + trend frequency). Final set-points get tuned during start-up/seasonal Cx. | Design Engineer authors; drives BMS programming + FPT |
| **Checklists** | Construction Mgr / Field Tech (OCA reviews) | Delivery, installation/pre-functional, start-up, and operational checklists — one set per component, plus ductwork/pipework/BMS. | Field Tech executes; OCA reviews |
| **FPT** (Functional Performance Test) | OCA / Cx Engineer | Dynamic, whole-system tests in automated mode with pass/fail acceptance criteria. | Cx Engineer authors; team executes |
| **Issues Log** (Cx Log-book) | OCA | Official running record of every deficiency, owner, and resolution, from design through year-1. | OCA maintains continuously |
| **Systems Manual** | Construction Mgr + Design + OCA | Operations-focused composite: OPR, BoD, SOO, as-builts, set-points, balancing tables, Cx data, maintenance/retest schedules, training records. Distinct from (and broader than) the equipment O&M Manual. | OCA assembles; handed to Owner/FM |
| **Cx Report** | OCA | The independent sign-off: confirms the building meets OPR/BoD, with open items and resolution plan. | OCA signs |

> **Key idea:** the OPR is the contract against which *everything* is measured. If a target
> isn't concrete and verifiable in the OPR, it can't be tested later — so the OCA's first job
> is to make the OPR measurable.

## 4. The commissioning team and roles

| Role | Independence | Core responsibility | CXPro agent |
|---|---|---|---|
| Commissioning Authority/Agent | **Independent** of design, construction, vendors | Plans Cx, reviews design/submittals/installation, directs & witnesses FPT, owns Issues Log, signs Cx Report | **OCA** |
| Cx Engineer | Works under OCA | Writes/executes test procedures, analyzes data, runs balancing-adjacent verification | **Cx Engineer** |
| Owner / Facility Manager | Client | Authors OPR & KPIs, nominates OCA early, owns the building post-handover | **Owner/FM** |
| Design team (architect/MEP) | — | Authors BoD & SOO, responds to Cx review comments | **Design Engineer** |
| Contractors (MEP) | — | Purchase/install per spec, run delivery/pre-functional/start-up checks, operate equipment during tests, build O&M manuals, train staff | **Construction Manager** + **Field Technician** |

**Why it matters.** Independence is the value of the OCA — it can be an objective advocate for
the owner only if it has no stake in the work it's auditing. **CXPro mapping:** keep agent
"hats" clean. The OCA agent reviews; it does not also design or install. Nominate the OCA in
pre-design/early-design so Cx requirements land in the contracts before they cost change-orders.

## 5. The four project phases

Cx is a thread woven through the whole project. Workload ramps up toward start-up and FPT.

| Phase | Cx activities | Key docs | Lead agent |
|---|---|---|---|
| **Pre-design** | Set targets (OPR + KPIs); nominate OCA; whole-building performance simulations (energy, daylight, CFD comfort/airflow) | OPR | Owner/FM, OCA |
| **Design** | Author BoD & SOO; Cx **design review** (distinct from peer review — checks OPR compliance, testability, access/test ports, maintainability); plan FPT; plan data metering; embed Cx requirements into contract docs | BoD, SOO, Cx Plan | Design Engineer, Cx Engineer |
| **Construction** | Submittal review (do selected products meet OPR?); delivery checks; installation reviews on regular site visits; pre-functional checks; component start-up | Checklists, Issues Log | Construction Mgr, Field Tech, OCA |
| **Occupancy (year 1+)** | FPT; seasonal Cx; O&M training; 10-month operational review; transition to ongoing Cx | FPT, Systems Manual, Cx Report | OCA, Cx Engineer, Owner/FM |

**Design review ≠ peer review.** Peer review checks design *quality* in isolation; Cx design
review checks the design *against the OPR and Cx Plan* — cross-system coordination, test
access, control sequences, maintainability. CXPro keeps these as distinct agent tasks.

## 6. Testing levels: pre-functional vs functional vs integrated

This is the heart of execution. Each level gates the next — you don't run L4 until L3 passes.

- **L1 — Factory / component.** Manufacturer performance data, ideally third-party validated
  (Eurovent/AHRI/AMCA). Caution: only compare products tested to the *same* standard (ISO/
  ASHRAE/CEN); inconsistent product data quietly pushes the whole system off its operating point.
- **L2 — Delivery / installation.** Right component received, undamaged, per submittal; correctly
  installed, connected (air/water/electrical), clean. Pipework **pressure-tested** and ductwork
  **leakage-tested** *before* insulation goes on (you can't test it once it's wrapped).
- **L3 — Pre-functional / start-up.** Each component/sub-system started safely and validated
  ready for *automatic* operation per manufacturer requirements. Operational measurements taken
  in **design conditions**, recorded on data-collection sheets. Field Tech runs it; OCA assists
  the *first* start-up of each equipment type to confirm correct method and instruments.
- **L4 — Functional Performance Testing (FPT).** Dynamic testing of *entire systems* in fully
  **automated mode**, under varied modes — high/low load, component failure, unoccupied, fire
  alarm, power failure, varying outdoor air/moisture. Tests whether the system behaves per SOO.
- **L5 — Integrated systems testing (IST).** Cross-system interactions that must work together to
  meet OPR/BoD — e.g. fire alarm interlocking dampers + fans, or cooling + airflow + controls
  responding as one. (Practice often treats FPT and IST as one core activity; CXPro separates
  L4 single-system vs L5 multi-system for clarity.)

**Active vs passive FPT.** *Active* tests force a change in conditions and observe the response
(used during initial Cx). *Passive* tests analyze data from normal operation (preferred once
occupied, to protect comfort/health). **CXPro mapping:** Cx Engineer agent schedules active
tests pre-occupancy, passive monitoring after.

## 7. How HVAC functional tests are written and executed

**Concept.** A test procedure specifies: the system under test, prerequisites/initial state,
the induced change, what to record (and where — BMS trend vs standalone data logger vs field
instrument), and **pass/fail acceptance criteria** tied to the SOO/design values. The general
loop: *establish a known initial state → record baseline (BMS + field) → induce a change →
record max/min and steady-state response → compare measured vs designed → log deficiencies.*

**Caution — don't fake the sensor.** Prefer creating a *real* physical condition (e.g. warm an
outdoor-air sensor with a heat source) over overwriting the BMS value. Overwriting tests only a
slice of the loop and misses how other systems would actually respond. Always calibrate sensors
and instruments *before* testing — an uncalibrated reference makes the whole test meaningless.

**Sampling.** For many identical *non-critical* units, test a sample; after three failures in
the sample, test all of them. (For data centers, treat cooling-critical units as non-sampled.)

**Worked HVAC test patterns:**

- **Airside / VAV — change in room temperature.** Drive room 1 cold (its VAV damper to minimum),
  measure airflow at the VAV boxes in rooms 1 and 2, record baseline in BMS (room temps, damper
  positions, main-duct static pressure, fan speed). Induce a real temperature rise at room 1's
  sensor, then record the response — damper positions, duct static pressure, and fan speed at
  max/min and steady state — and re-measure airflow. Compare against design: did the box modulate,
  did static-pressure reset and fan speed track correctly?
- **Chilled water — decrease in cooling load.** Get all chillers running near max (AHU cooling-coil
  valves 100% open, return-water temp high). Baseline all BMS readings (coil valve positions,
  inlet/return water temps, pump positions/flows, all CHW valve positions, pipework differential
  pressure, cooling-tower fan speed); confirm manometers agree with BMS. Induce a load drop by
  closing ~50% of AHU coil valves, then record how the plant responds (valve positions, water
  temps, pump staging/flows, differential pressure, tower fan speed) and check against the SOO.
- **Fire / smoke — motorized fire damper on alarm.** With damper open and supply/exhaust fans
  running, trigger the zone fire alarm; record damper, supply-fan, and exhaust-fan response in BMS,
  verify each in the field, and compare to the SOO. This is the canonical **L5 integrated** test.

**System-by-system FPT focus areas:**
- **Air handling (AHU/DOAS/TFA):** face velocity, specific fan power, filtration, cooling/dehumid
  process, energy-recovery effectiveness, VCD/VAV control logic, economizer operation, return/
  exhaust airflow, duct leakage; confirm dehumidification by measuring air temp/humidity *after*
  the cooling coil; track mixed-air CO₂ to verify adequate outdoor air in all modes.
- **Chilled/condenser water:** chiller COP, control-valve behavior, primary/secondary pumping,
  differential-pressure control, cooling-tower water quality and approach, isolation/bypass.
- **Hot water:** boiler/heat-exchanger temps and flows, pipework balancing, terminal-unit control.
- **Controls/BMS:** every SOO point exercised (DI/AI/DO/AO), alarms (e.g. filter ΔP, return-air CO₂),
  trend frequency, set-point/limit values finalized during start-up and seasonal Cx.

## 8. Data metering — the substrate for monitoring-based Cx

**Concept.** A metering layer (sub-metering + EMS, beyond basic BMS control/alarms) lets Cx
detect faults *before* occupants or utility bills do. Sub-meter any end-use ≥10% of total
consumption (AHUs, chillers, water heaters, and — critically for us — data-center IT load). LEED
v4 advanced metering: permanent meters, ≤1-hour intervals, ≥18 months storage, remote access.

**CXPro mapping.** Cx Engineer agent uses trended data for passive FPT and ongoing Cx; the
metering plan is a *design-phase* deliverable (you can't add test ports/meters cheaply later).

## 9. Common deficiencies (what FPT is hunting for)

A malfunction in the integrated system usually traces to one of:
- **Design fault** — wrong concept or sequence in the SOO.
- **Selection/sizing mistake** — oversized equipment short-cycling, wasting energy.
- **Manufacturing fault / early deterioration.**
- **Installation fault** — uninsulated runs, leaking ducts, miswiring, dirty coils/ducts.
- **Wrong tuning / control failure** — bad set-points, mis-sequenced staging, alarms not set.
- **Abnormal building use** — actual occupancy/load diverging from design assumptions.

Field walk-throughs surface the soft signals: stuffy air or unstable airflow (poor balancing),
odours or visible moisture/mould (failed dehumidification or pressurization), hot/cold complaints.

## 10. Handover, training, and the year-1 tail

- **O&M training.** Transfer the knowledge to operate the building — purpose of each system, use
  of O&M/Systems Manuals, SOO, start-up/shutdown/seasonal-changeover, troubleshooting, alarms,
  energy-optimization methods, emergencies. **Record all training** for future staff. OCA reviews
  training content and confirms it landed.
- **Seasonal commissioning.** Initial Cx happens in one weather window; you can't simulate every
  season, so re-tune ventilation/cooling/heating across summer/winter/monsoon and real occupancy.
  Update the O&M/Systems Manual with seasonal data. Full-load tests often can't run pre-occupancy
  (loads/heat gains absent) — defer them into year 1.
- **10-month operational review.** Before the warranty expires, re-verify performance: O&M and
  user-satisfaction surveys, IEQ measurements, energy benchmarked against design, alarm/work-order
  history, trend logs. Outstanding items get assigned to contractor (warranty) or O&M. This review
  *launches* the ongoing-Cx program. Update the Cx Report.

## 11. Retro- and ongoing commissioning

- **Ongoing Cx (OCx).** A continuation of initial Cx into operation: annual KPI review, walk-through
  audits, periodic re-running of FPT (or continuous automated diagnostics), maintenance/retrofit
  planning, O&M strategy. Plan it *during* initial Cx so the metering and retest forms exist.
- **Retro-Cx (RCx).** Cx applied to an existing, never-commissioned building. Triggered by
  unjustified energy increase, rising IEQ complaints, or high night-time base load. Five phases:
  plan → investigate existing documentation & site data → design repairs/retrofits/adjustments →
  execute → validate. The hard part is usually *finding and rebuilding* current documentation
  (drawings, BoD, balancing records, original start-up reports) — often missing or stale.
- **Re-Cx (RCx, re-commissioning).** Re-applying the Cx process to a building that *was* previously
  commissioned, to confirm performance hasn't drifted.

**CXPro mapping.** Owner/FM + Cx Engineer agents run OCx as a recurring loop; RCx is a distinct
intake workflow that starts with a documentation-discovery phase before any testing.

---

### One-line takeaways for agent grounding
1. Everything traces to the OPR; if it's not measurable there, it can't be tested later.
2. Test the *integrated system*, not the lone component — a part can pass and the system still fail.
3. The OCA stays independent: it reviews and signs; it doesn't design or install.
4. Levels gate: L1→L2→L3→L4→L5; never run a functional test on an unstarted/uncalibrated system.
5. Force real conditions over overwriting BMS sensors; calibrate before you test.
6. Cx doesn't end at handover — seasonal Cx, the 10-month review, and ongoing Cx carry it for life.
