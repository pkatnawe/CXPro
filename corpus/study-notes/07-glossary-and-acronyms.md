# Glossary & Acronyms — Study Notes

> **CXPro knowledge base — for agent grounding.** The shared vocabulary the agents must speak fluently.
> The certified commissioning community uses these terms precisely; an agent that misuses them reads as
> an outsider and loses trust on site. Definitions are in our own words, framed for CXPro's role agents.
>
> **Keep this consistent with the site Glossary page** (`docs/business-overview/glossary.html`). Where the
> public page and these notes both define a term, they must not contradict. This note goes deeper and
> covers the field acronyms the public page leaves out; the public page covers the AEC/AI/market terms.
>
> **Role agents referenced:** OCA (Owner's Cx Agent), CxA (Commissioning Authority/Agent), Cx Engineer,
> Construction/Cx Manager, Field Technician, Design Engineer, Owner/FM.
> **Commissioning levels:** L1 factory/component → L2 install/receipt → L3 start-up → L4 functional → L5 integrated.

---

## 1. Acronyms

These are the abbreviations an agent will encounter in specs, scripts, drawings, and field chatter.
Expand them silently and read them in context; never ask a technician what "AHU" means.

### Commissioning process & documents

| Acronym | Expansion | One-line meaning |
|---|---|---|
| Cx | Commissioning | The QA process that verifies systems perform to the owner's intent. |
| CxA | Commissioning Authority / Agent | The firm or person leading Cx — usually an independent third party. |
| OCA | Owner's Commissioning Agent | The owner's program-level Cx representative; approves turnover, owns the gates. |
| OPR | Owner's Project Requirements | The owner's written statement of what the facility must achieve. |
| BoD / BOD | Basis of Design | The design team's documented approach to meeting the OPR. |
| SOO | Sequence of Operation | The written logic for how a system is supposed to behave under each condition. |
| Cx Plan | Commissioning Plan | The master document defining scope, roles, schedule, and process for Cx. |
| PFC | Pre-Functional Checklist | Static checklist proving a system is correctly installed and ready to start (L2/L3). |
| FPT | Functional Performance Test | The L4 test proving one system performs to spec across its operating range. |
| IST | Integrated Systems Test | The L5 whole-facility test proving systems respond together, including under failure. |
| TAB | Testing, Adjusting & Balancing | Measuring and tuning air/water flows to design values; feeds and precedes FPT. |
| RCx | Retro-Commissioning | First-time Cx of an existing building that was never properly commissioned. |
| RTCx / MBCx | (Retro-) / Monitoring-Based Commissioning | Ongoing Cx using live trend data to keep performance from drifting. |
| FDD | Fault Detection & Diagnostics | Automated analytics that flag and diagnose faults from BMS data. |
| RFI | Request for Information | A formal field question to the design team; turnaround drives schedule. |
| O&M | Operations & Maintenance | The manuals and activities for running/maintaining equipment after handover. |
| L1–L5 | Commissioning Levels 1–5 | Factory → install → start-up → functional → integrated. |

### Mechanical / cooling

| Acronym | Expansion | One-line meaning |
|---|---|---|
| IEQ | Indoor Environmental Quality | Air quality, thermal comfort, lighting — the human-occupancy outcomes Cx protects. |
| AHU | Air Handling Unit | A unit that conditions and moves air (fan, coils, filters, dampers). |
| DOAS | Dedicated Outdoor Air System | An AHU that conditions only outside air for ventilation, decoupled from cooling. |
| RTU | Rooftop Unit | A packaged AHU + cooling source mounted on the roof. |
| VAV | Variable Air Volume | A box/system that varies airflow to a zone while holding supply temperature. |
| CAV | Constant Air Volume | A system that holds airflow constant and varies temperature instead. |
| CRAC | Computer Room Air Conditioner | A DX (refrigerant) cooling unit serving a data hall. |
| CRAH | Computer Room Air Handler | A chilled-water cooling unit serving a data hall (no onboard compressor). |
| CHW | Chilled Water | The cold water loop that carries heat from the halls to the chillers. |
| CW | Condenser Water | The loop that rejects chiller heat to cooling towers / dry coolers. |
| HW | Hot Water | The heating loop (reheat, perimeter, freeze protection). |
| COP | Coefficient of Performance | Cooling delivered per unit of energy in; higher is more efficient. |

### Electrical / power

| Acronym | Expansion | One-line meaning |
|---|---|---|
| kW / MW | Kilowatt / Megawatt | Units of electrical power; data-center capacity is quoted in MW (IT load). |
| PUE | Power Usage Effectiveness | Total facility power ÷ IT power; 1.0 is ideal, real sites run ~1.1–1.6. |
| UPS | Uninterruptible Power Supply | Battery/flywheel system that rides through outages until generators take over. |
| ATS | Automatic Transfer Switch | Switches load between two sources (utility ↔ generator) on loss of power. |
| STS | Static Transfer Switch | Solid-state, sub-cycle transfer between two live sources feeding the load. |
| ASTS | Automatic Static Transfer Switch | An STS with automatic source-selection logic. |
| PDU | Power Distribution Unit | Steps down and distributes power to racks; often includes a transformer. |
| RPP | Remote Power Panel | A downstream panel extending PDU circuits closer to the racks. |
| Genset | Generator Set | Engine + alternator providing standby power during a utility outage. |
| MTBF | Mean Time Between Failures | Average uptime between failures; a reliability measure. |
| MTTR | Mean Time To Repair | Average time to restore a failed component to service. |
| RTO / RPO | Recovery Time / Point Objective | Max tolerable downtime / max tolerable data loss after an incident. |

### Controls, monitoring & redundancy

| Acronym | Expansion | One-line meaning |
|---|---|---|
| BMS / BAS | Building Management / Automation System | The control system running and monitoring mechanical/electrical plant. |
| DDC | Direct Digital Control | Microprocessor-based controllers executing the SOO logic. |
| DCIM | Data Center Infrastructure Management | Software tracking space, power, cooling, and asset inventory in a DC. |
| EPMS | Electrical Power Monitoring System | The system that meters and monitors the electrical distribution in real time. |
| SCADA | Supervisory Control & Data Acquisition | Higher-level supervisory monitoring/control over distributed plant. |
| N | Base capacity | Exactly enough capacity to carry the load, no spare. |
| N+1 | Redundant capacity | Base load plus one spare unit; survives a single failure. |
| 2N | Fully redundant | Two independent systems each able to carry the full load. |
| LOTO | Lock-Out / Tag-Out | Safety procedure to de-energize and secure equipment before work. |
| AHJ | Authority Having Jurisdiction | The inspector/regulator whose sign-off is legally required. |

---

## 2. Key terms

Definitions in our own words, with the role/level an agent should associate each term with.

**Commissioning (Cx).** The structured quality process that verifies a facility's systems are designed,
installed, started up, and tested to meet the owner's documented intent — and stays that way into
operations. Its signature is testing the *integrated* system, not one good component. *(OCA's worldview;
spans L1–L5.)*

**Owner's Project Requirements (OPR).** The owner's plain-language statement of what the facility must
achieve — uptime, capacity, redundancy, efficiency, environmental targets, future flexibility. It is the
yardstick every Cx finding traces back to. *(Authored with the Owner/FM; the OCA defends it.)*

**Basis of Design (BoD).** The design team's documented account of *how* they intend to meet the OPR —
the assumptions, codes, selected approaches, and calculations behind the drawings. Cx checks the BoD
satisfies the OPR, and that the built work satisfies the BoD. *(Design Engineer authors; Cx reviews.)*

**Sequence of Operation (SOO).** The written control logic describing exactly how a system should behave
in every mode and transition — normal, part-load, failure, and recovery. The SOO is what an FPT script is
built from; if the SOO is vague, the test is too. *(Cx Engineer turns SOO into test steps; L4/L5.)*

**Pre-Functional Checklist (PFC).** A static, line-by-line verification that a system is correctly
installed, connected, labeled, and safe to start — before any dynamic testing. Passing the PFC is the gate
into start-up; a system fails the PFC long before it would fail an FPT. *(Field Technician executes; L2–L3.)*

**Functional Performance Test (FPT).** The L4 dynamic test that drives one system through its operating
range and proves it meets spec — flows, temperatures, response times, alarms, and its SOO modes. *(Cx
Engineer scripts and marks; Field Technician executes; OCA may witness.)*

**Integrated Systems Test (IST).** The L5 "final exam": whole-facility failure scenarios — simulated
utility loss, generator start, cooling failover — proving every system responds together within its
ride-through window and recovers cleanly. The point of the whole exercise. *(OCA owns; everyone witnesses.)*

**Deviation / Issue.** A formal record that something doesn't match design intent — a failed test step, a
wrong install, an unexpected behavior — tracked from discovery through root cause to verified resolution.
The deviation log is the spine of the Cx record. *(Anyone raises; Cx Engineer/OCA dispositions.)*

**Systems Manual.** The operations-facing handover deliverable: the SOOs, setpoints, as-built control
narratives, O&M references, and Cx results an operator needs to actually run the building. Broader than a
binder of cut sheets. *(Assembled for the Owner/FM at handover.)*

**Cx Report.** The OCA's summary record of the whole commissioning effort — scope, what was tested,
outstanding deviations, and a credible statement that the facility meets (or doesn't yet meet) the OPR.
Its credibility rests on the OCA's independence. *(OCA authors; closes the process.)*

**Concurrent maintainability.** A design property: any single component can be taken out for planned
maintenance without dropping the protected load. A higher bar than just surviving failures, because it
covers *deliberate* downtime. *(Proven in L5 scenarios; tied to higher availability tiers.)*

**Fault tolerance.** A design property: the facility absorbs an *unplanned* single failure with no impact
to the IT load. Distinct from concurrent maintainability — one is about surprises, the other about planned
work — and a top-tier facility is expected to do both. *(Verified by IST failure scenarios.)*

**Redundancy (N / N+1 / 2N).** How much spare capacity is built in. **N** is just-enough with no spare;
**N+1** adds one spare so a single unit can fail or be serviced; **2N** is two fully independent systems
each able to carry everything alone. The OPR sets the level; L5 tests prove it's real. *(Electrical/mechanical
plant; OCA verifies against OPR.)*

**Ride-through.** The brief window a system bridges a power disturbance on its own — the UPS carrying the
load for the seconds it takes generators to start and accept it. If ride-through is shorter than the
transfer time, the load drops. *(Core IST timing check; UPS/genset/ATS.)*

**Transfer.** Moving the load from one power source to another — utility to generator, or between two live
feeds via an STS. A "make-before-break" transfer keeps power continuous; a "break-before-make" one creates
a momentary gap the UPS must cover. *(ATS/STS behavior; tested in IST.)*

**Economizer.** A control mode that uses favorable outside conditions to reduce mechanical cooling — pulling
in cool outside air (air-side) or rejecting heat directly to a cool loop (water-side), a.k.a. "free
cooling." Big PUE lever; the changeover logic is a frequent FPT finding. *(SOO mode; Cx Engineer tests.)*

**Hot aisle / Cold aisle.** The airflow discipline of a data hall: racks face each other so cold supply air
enters the "cold aisle" intakes and hot exhaust collects in the "hot aisle," kept apart by containment so
the two never mix. Leakage between them wrecks cooling efficiency. *(TAB + airflow FPT.)*

**Setpoint / Deadband.** The setpoint is the target a control loop holds (e.g., 22 °C supply); the deadband
is the tolerance band around it within which equipment won't cycle, preventing constant hunting. Wrong
deadbands cause short-cycling and energy waste. *(Controls FPT; Cx Engineer.)*

**Witness / Hold point.** A witness point is a test step the owner's rep formally observes and signs; a hold
point is a step work *cannot proceed past* until that sign-off happens. Hold points are the hard gates in
the Cx schedule. *(OCA/owner's rep witnesses; Cx/Construction Manager schedules.)*

**Energization.** The first application of live power to equipment or a system — a controlled, high-risk
milestone gated by completed PFCs, LOTO, and safety checks. Marks the boundary between install and start-up.
*(L3; gated by Field Technician PFCs, AHJ where required.)*

**Handover / Turnover.** The formal transfer of a completed, tested system from the construction/Cx team to
the owner's operations team — accompanied by the turnover package (test results, signatures, deviations,
warranties, training, Systems Manual). Substantial completion and the warranty clock hang off it. *(OCA
approves; Owner/FM receives.)*
