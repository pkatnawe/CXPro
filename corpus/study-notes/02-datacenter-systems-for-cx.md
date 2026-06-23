# Data Center Physical Systems — Study Notes (for Commissioning)

> **CXPro knowledge base — for agent grounding.** Our working notes on the data-center power
> and cooling systems a commissioning agent must understand — what each system does, how it's
> tested across L1–L5, and how it fails (the scenarios that drive integrated testing). Written
> in our own words and framed for CXPro's use case: AI agents that play commissioning roles on
> data-center projects. Each entry follows *system → what it does → how it's commissioned →
> failure mode (L5 scenario) → CXPro mapping*.
>
> **Role agents (shared with note 01):** OCA (Owner's Cx Authority), Cx Engineer,
> Construction Manager, Field Technician, Design Engineer, Owner/FM.
> **Commissioning levels:** L1 factory/component → L2 delivery/installation →
> L3 pre-functional/start-up → L4 functional performance (single system) →
> L5 integrated systems testing (cross-system, failure-mode).
>
> **How to read each topic:** *system → what it does → how it's commissioned / what's tested →
> failure mode (L5 scenario) → CXPro mapping.* The whole point of this note is the **commissioning
> angle**: not how to design these systems, but what an agent must know to *verify* them and to
> author the failure scripts that drive integrated systems testing.

---

## 0. Why physical systems matter to a Cx agent

A data center is two coupled machines stacked on top of each other: a **power chain** that delivers
clean, continuous electricity to the IT load, and a **cooling chain** that removes the heat that
power produces. Both must hold through utility loss, equipment failure, and maintenance without the
IT load ever seeing an interruption. Commissioning exists to *prove* that resilience under controlled,
witnessed conditions before the facility goes live — because the only alternative is discovering the
gap during a real outage. Modern racks dissipate enormous heat (server rack heat flux climbed past
~4000 W/ft² by the mid-2000s and 30+ kW racks are now common), so the cooling system is not a comfort
amenity — it is a few-minutes-to-failure safety system every bit as critical as power.

The defining commissioning move (from note 01) carries straight over: **test the integrated system,
not the lone component.** A generator that starts perfectly on its own factory test still fails the
mission if it can't pick up the full load before the UPS batteries deplete. That hand-off *between*
systems is exactly what L5 integrated testing exists to catch.

---

## 1. Electrical power chain

### 1.1 The chain end-to-end

The canonical power path, from the street to the server:

**Utility feed → step-down transformer → main switchboard (MSB) / switchgear → (on failure: standby
generator via ATS) → UPS → static/automatic transfer switch → PDU → rack → dual/single-corded server.**

| Stage | What it does | How it's commissioned (L1→L5) | L5 failure scenario it participates in |
|---|---|---|---|
| **Utility feed** | Primary medium/high-voltage supply from the grid. | L2: verify correct feed, metering, protection coordination. | The trigger event — *loss of utility* is the canonical L5 test. |
| **Transformer** | Steps utility voltage down to distribution level (e.g. 480/277 VAC, or 415/400 V for higher-efficiency designs). | L1 factory test (turns ratio, insulation, no-load/load loss); L4 verify output voltage/regulation under load. | Verified to hold voltage as load transfers between sources. |
| **Switchgear / MSB** | Distributes and protects: breakers isolate faults and enable maintenance. | L1 factory acceptance; L3 point-to-point wiring & breaker checks; L4 protective-relay coordination, breaker trip/close. | Breaker sequencing during source transfer; fault isolation without dropping load. |
| **Standby generator** | Diesel (or gas) genset that supplies the facility when utility fails. | L1 factory load-bank test; L3 start/stop, fuel, cooling, exhaust; L4 **load-bank test** at rated kW + step-load acceptance; verify start time. | Must *start, stabilize, and accept full load* before UPS batteries deplete. |
| **ATS** (automatic transfer switch) | Senses utility loss and transfers the load to the generator (and back when utility returns), typically with timed re-transfer. | L3 manual transfer; L4 automatic transfer on simulated utility loss, verify transfer/re-transfer timing and any neutral-switching logic. | The orchestration point of the whole utility→generator sequence. |
| **UPS** (uninterruptible power supply) | Bridges the gap with stored energy so the IT load never sees the dead time while the generator starts and the ATS transfers. | See §1.3 — the most testing-intensive element. | **Ride-through:** must carry full load for the entire start-and-transfer window. |
| **ASTS / static switch** | Fast (SCR-based, ~4–10 ms) switch that moves the load between UPS sources or to bypass without interruption. | L4 verify static-bypass transfer is glitch-free within tolerance (±~10% mains); verify maintenance-bypass isolates the UPS without dropping load. | Source-loss transfer faster than mechanical contactors can manage. |
| **PDU** (power distribution unit) | Steps/distributes UPS power to racks; may transform to rack voltage (e.g. 208/120 V). | L3 circuit verification, branch breaker mapping; L4 metering accuracy, branch-circuit monitoring. | Branch-level redundancy for dual-corded racks (A/B feeds). |
| **Rack / server power supply** | Single-corded (one feed) or dual-corded (A+B feeds) consumes the conditioned power. | L4 verify dual-corded racks survive loss of one feed. | A-side feed failure must not drop a dual-corded server. |

### 1.2 The canonical failure test — *loss of utility → generator start → UPS ride-through*

This is the single most important L5 script in the building, and the reason UPS, generator, and ATS
must be tested *together* rather than separately:

1. **Utility fails** (or is deliberately opened to simulate failure).
2. The **UPS instantly carries the load** from stored energy (battery or flywheel) — the IT load
   sees zero interruption. This is the "ride-through."
3. The **ATS senses the loss** and signals the **generator to start**. A diesel genset typically needs
   several seconds to crank, start, and stabilize voltage/frequency.
4. The **ATS transfers** the facility load to the generator once it's stable; the generator must
   **accept the full step-load** without stalling or unacceptable voltage/frequency dip.
5. The **UPS rectifier** now draws from the generator, recharging the batteries while continuing to
   feed the inverter.
6. On **utility return**, the ATS re-transfers (after a timed delay), and the generator cools down
   and shuts off.

The test *passes* only if the load never dropped, the generator picked up in time, and every transfer
stayed within tolerance. The classic *failure* is a battery runtime shorter than the generator's
real-world start-and-accept time — fine on paper, fatal in practice. Hence the UPS battery runtime and
the generator start time are not independent specs; they are a single integrated requirement that only
L5 can validate.

### 1.3 UPS — the deep-dive system

UPS designs split into two families:

- **Static UPS** (dominant in IT): converts stored DC (battery) to clean AC. A **double-conversion**
  static UPS runs power through **rectifier (AC→DC) → DC link → inverter (DC→AC)** continuously, so the
  IT load always rides on the inverter's clean sine wave and never sees raw mains. Subsystems an agent
  should recognize: rectifier (often IGBT-based, near-unity input power factor), DC-to-DC converter,
  inverter (IGBT + PWM filtered to a sine wave), **static bypass switch** (SCR, fast transfer to raw
  mains on overload/internal fault), **maintenance bypass** (lets the whole UPS be taken offline for
  service without dropping the load), and the battery string.
- **Rotary UPS / DRUPS** (diesel rotary): stores energy in a spinning **flywheel** that carries the
  load for a short window (seconds) — long enough for a coupled diesel generator to start. Common in
  very large installations that want to avoid lead-acid batteries.

**Batteries:** most static UPS still use **lead-acid (VRLA or flooded)**. VRLA is sealed/low-maintenance
(~10-year design life) but sensitive to high ambient temperature and overcharge; flooded cells last
longer but need a ventilated, acid-contained battery room. Battery health is a recurring ongoing-Cx
concern, not a one-time check.

| What's commissioned on a UPS | Level | Note |
|---|---|---|
| Factory acceptance (efficiency, waveform, protection) | L1 | Witnessed factory test where the contract requires it. |
| Installation, wiring, battery string integrity | L2/L3 | Per manufacturer; battery connections torqued and logged. |
| Battery **runtime / discharge test** at load | L4 | The number that must exceed real generator start time. |
| **Static-bypass** and **maintenance-bypass** transfers | L4 | Must be glitch-free; maintenance bypass must isolate the UPS without dropping load. A **load-bank breaker** on the maintenance bypass lets the UPS be proven at load before real IT is connected. |
| Ride-through inside the full utility-loss sequence | **L5** | Tested with generator + ATS, never alone. |

### 1.4 Redundancy topologies (N / N+1 / 2N) and what they imply for testing

Redundancy is what makes the power chain survive a failure *or* a maintenance event without dropping
the IT load — and each topology implies a different set of L5 failure scripts.

| Topology | Meaning | Implication for L5 testing |
|---|---|---|
| **N** | Exactly the capacity needed, no spare. | Any single failure drops load — there is no "survive a failure" test to pass, only "confirm it carries design load." |
| **N+1** | One extra module beyond need (parallel UPS, block/"catcher", or distributed redundant). | Test: fail one module, confirm the surviving N carry full load. In **distributed redundant** with 3 systems at ~66% each, a single failure shifts ~33% to each survivor — verify they absorb it. |
| **2N** | Two fully independent systems (true A/B). | Test: kill an entire side (A or B), confirm dual-corded load rides entirely on the surviving side. This is the strongest integrated test and the basis of **concurrent maintainability** and **fault tolerance** (§3). |

Key wiring concepts the agent must read off a one-line diagram: **single-corded** servers (one feed —
vulnerable, fed via an ASTS that picks a live source) versus **dual-corded** servers (A+B feeds — survive
loss of either). The MSB, transformer, and generator symbols on the one-line tell the agent which
failures the design *claims* to survive — and therefore which L5 scripts must be written to prove it.

**CXPro mapping (electrical):** The **Design Engineer** agent reads the one-line and the redundancy
target from the OPR/BoD to enumerate the failure scripts the design promises to survive. The **Cx
Engineer** agent authors the L4 functional tests (each transfer, each transformer/generator) and the
L5 integrated script (loss-of-utility sequence; single-side/single-module failure). The **Field
Technician** agent executes start-ups, transfer pulls, and load-bank runs; the **Construction Manager**
coordinates the MEP contractors and the generator/UPS vendors during witnessed tests. The **OCA**
witnesses the L5 sequence and signs it against the OPR uptime/redundancy requirement.

---

## 2. Cooling / mechanical chain

### 2.1 What it does and the airflow story

Cooling removes IT heat and holds the room within ASHRAE temperature/humidity envelopes. The dominant
air pattern is **hot-aisle / cold-aisle**: racks face each other so cold supply air is drawn in the
front and hot exhaust is dumped into a shared hot aisle, *without the two streams mixing*.
**Containment** (hot-aisle or cold-aisle) physically isolates the streams to stop recirculation and
bypass — the two biggest airflow-efficiency killers. Supply can be **underfloor** (raised floor as a
pressurized plenum, air up through perforated tiles) or **overhead**; studies generally favor underfloor
supply with ceiling return for high-density loads, but plenum depth, perforated-tile open area, ceiling
height, and CRAC placement all materially change the result (this is what CFD modeling is for).

### 2.2 The equipment chain

| System | What it does | How it's commissioned | L5 failure scenario it participates in |
|---|---|---|---|
| **CRAC / CRAH units** | Computer Room Air Conditioner (self-contained DX) / Air Handler (chilled-water coil + fan) push conditioned air into the room. | L3 start-up; L4 verify airflow, supply temp, fan/valve control, set-points, alarms. | Loss of one unit → survivors must hold room temp (N+1 air). |
| **Chillers** | Produce chilled water by rejecting heat from the water loop. | L1 factory; L4 verify COP, capacity, staging/sequencing, control-valve behavior. | Chiller trip → standby chiller must stage on before room over-temps. |
| **Pumps (primary/secondary)** | Circulate chilled & condenser water. | L3 rotation/flow; L4 differential-pressure control, staging, standby-pump start. | Pump failure → standby pump auto-start, flow maintained. |
| **Cooling towers** | Reject heat to atmosphere via evaporation. | L4 fan staging, water quality/approach, basin/makeup. | Tower/cell loss → remaining cells carry the heat rejection. |
| **Economizers (air-side / water-side)** | "Free cooling" — use cool outside air (air-side) or evaporative cooling (water-side) when ambient allows, cutting chiller energy. | L4 verify changeover logic across the operating envelope (multiple outside-air regions: full economization, partial mixing, mechanical cooling). | Verify failover from economizer to mechanical cooling when ambient rises. |
| **Liquid cooling (rear-door HX, cold plate, direct-to-chip)** | Brings water/coolant to or into the rack for AI/high-density loads that air alone can't cool (rear-door HX can reject ~55% of rack heat). | L2 leak/pressure test loops *before* energizing IT; L4 verify coolant flow, temp, leak detection, CDU control. | **Leak detection + auto-isolation** must trip without dropping the rack inappropriately; loss of coolant flow scenario. |
| **Humidification / makeup water (e.g. evaporative + RO)** | Holds humidity in band; treats water (reverse osmosis) to protect misting nozzles; sized for multi-day operation during extreme weather. | L4 verify humidity control, RO water quality, makeup storage runtime. | Loss of makeup water during peak ambient — verify stored-water ride-through. |

### 2.3 The loss-of-cooling failure scenario (the cooling L5)

The mechanical mirror of the power L5: **simulate loss of cooling** (kill a CRAH, trip a chiller, or
fail a pump) and verify the redundant unit stages on **before the room exceeds its temperature limit**.
High-density rooms have very little thermal ride-through — minutes, sometimes less — so the timing of
standby-equipment start is the pass/fail criterion, exactly as generator start-time was for power. The
deeper L5 question is **cross-coupling**: cooling depends on power, so a complete integrated script
combines both — e.g. *on utility loss, does cooling stay alive on the generator/UPS-backed circuits and
recover its set-point as the load transfers?* That power-and-cooling-together script is the highest-value
integrated test in the building.

**CXPro mapping (cooling):** **Design Engineer** agent extracts the cooling redundancy and ASHRAE
envelope from BoD and the sequence-of-operations; **Cx Engineer** authors the loss-of-cooling and
economizer-changeover scripts; **Field Technician** runs unit start-ups and induces the failures; **OCA**
witnesses the combined power+cooling L5 and signs against the OPR thermal/uptime targets. Liquid-cooling
loops add an L2 emphasis: pressure-test and leak-test the loop *before* IT is energized (you cannot
safely test a leak path with live servers downstream).

---

## 3. Reliability concepts — Uptime Tiers and what they imply for L5

The **Uptime Institute Tier** classification (I–IV) grades a facility by its power, cooling, fault, and
maintenance capabilities. An agent needs these because the **Tier sets the redundancy target, and the
redundancy target dictates which L5 failure scripts the building must pass.**

| Tier | Character | Redundancy | Approx. availability | What it implies for integrated testing |
|---|---|---|---|---|
| **I** | Basic capacity | Single path, no backup components | ~99.671% (~28.8 h/yr down) | Confirm it carries design load; no failure-survival script to pass. |
| **II** | Redundant capacity components | Single path, redundant components (N+1 equipment) | ~99.741% (~22 h/yr) | Test component failover (e.g. fail one UPS module), but a path outage still drops load. |
| **III** | **Concurrently maintainable** | Multiple paths (one active), redundant systems | ~99.982% (~1.6 h/yr) | **Maintenance script:** take any component/path out of service for maintenance with *zero* load impact. L5 must prove every element can be isolated live. |
| **IV** | **Fault tolerant** | Redundancy for *every* component; physically isolated | ~99.995% (~26 min/yr) | **Single-fault script:** any single failure (and any single maintenance activity) survives with no load impact — the strongest 2N-style L5 scripts. |

Three concepts to keep distinct:

- **Concurrent maintainability (Tier III):** you can plan a component out of service for maintenance and
  the load doesn't notice. The L5 proof is a *deliberate, scheduled* isolation.
- **Fault tolerance (Tier IV):** an *unplanned* single fault is survived with no impact. The L5 proof is
  an *induced, unannounced-style* failure.
- **N / N+1 / 2N** (from §1.4) is the *mechanism*; concurrent maintainability and fault tolerance are the
  *outcomes* the Tier demands. The OPR states the Tier; the Cx agent derives the scripts.

> **Note on "Tier 5":** some operators (e.g. the colocation provider Switch) market a "Tier 5" standard
> above the Uptime Institute scale. It is a vendor designation, not part of the Uptime I–IV classification,
> and an agent should treat it as a marketing tier, not a standards body tier.

**CXPro mapping (reliability):** **Owner/FM** agent fixes the Tier in the OPR (it's an uptime/business
decision). **Cx Engineer** agent translates Tier → required L5 scripts: Tier III adds concurrent-maintenance
isolation tests; Tier IV adds single-fault survival tests on *every* component. **OCA** signs the Cx Report
only when the witnessed L5 results match the claimed Tier.

---

## 4. Monitoring layers — BMS / DCIM / EPMS

Commissioning verification leans heavily on the monitoring layer: trends and alarms are how an agent
*records* a test, and faulty monitoring quietly invalidates results.

| System | What it monitors / does | Relevance to commissioning |
|---|---|---|
| **BMS** (Building Management System) | Mechanical/environmental controls — CRAH/AHU, chillers, pumps, dampers, temps, humidity, set-points, alarms. Executes the **sequence of operations**. | The primary source of trend data for L4/L5 cooling tests. Every SOO point must be exercised and every alarm proven during functional testing. Caution from note 01: prefer inducing a *real* condition over overwriting a BMS value, and **calibrate sensors before testing**. |
| **EPMS** (Electrical Power Monitoring System) | Power-chain metering and quality — voltages, currents, power factor, breaker states, transfer events, UPS/generator status. | Captures the millisecond-scale behavior of the utility-loss sequence (transfer timing, voltage dip, UPS discharge). The witness record for the power L5. |
| **DCIM** (Data Center Infrastructure Management) | Aggregates power, cooling, space, and IT-load data into one view — capacity, utilization, **PUE**, asset/airflow management. | The integration/dashboard layer: confirms power-and-cooling are seen together, supports PUE verification (PUE is verified *during commissioning*, e.g. a well-designed facility reporting ~1.07 at full load), and feeds ongoing-Cx. |

**PUE (Power Usage Effectiveness)** = total facility energy ÷ IT-equipment energy. It is both a design
target in the OPR and a value confirmed at commissioning under load — a headline KPI the Cx Report ties
back to.

**CXPro mapping (monitoring):** **Cx Engineer** agent uses BMS/EPMS trends as the evidence substrate for
every L4/L5 result and verifies the monitoring itself (point mapping, alarm set-points, sensor calibration)
*before* relying on it. **Field Technician** confirms field instruments agree with the BMS/EPMS reading
(manometer vs BMS, clamp meter vs EPMS) so the trend record is trustworthy. **Owner/FM** inherits DCIM as
the ongoing-Cx and capacity-planning tool after handover.

---

## 5. The commissioning process, mapped to these systems

Pulling note 01's process onto data-center hardware, the testing strategy for a DC project runs:
**installation verification → start-up → functional test (L4) → integrated systems test (L5)**, with a
documentation spine of **OPR → BoD → Sequence of Operations → pre-functional checklist (PFC) →
functional performance test (FPT) → deficiency / issues log → systems manual → Cx Report.**

- **Installation verification (L2):** review construction checklists, observe install, confirm equipment
  matches submittals — before anything is energized. Liquid loops and pipework are pressure-tested here.
- **Start-up (L3):** review documentation, verify performance vs. spec, demonstrate operation of each
  component (generator, UPS, chiller, CRAH) safely and ready for automatic mode.
- **Functional test (L4):** exercise each *system* in automatic mode — verify redundancy/failure modes,
  sequence of operations, alarms and set-points. One system at a time.
- **Integrated systems test (L5 / IST):** the heart of DC commissioning — verify **failure and maintenance
  modes, transient operation, and mechanical↔electrical interaction together.** This is where the
  loss-of-utility sequence, the loss-of-cooling sequence, and the combined power+cooling script live.

Test procedures must be **project-specific**, not generic templates pulled off the internet, and each
must state purpose, prerequisites, required tools/support, roles, test steps, data collected, **expected
results, and acceptance criteria**, plus an issue-reporting path. Tests must verify against the **Owner's
Project Requirements (OPR)** and the engineer's construction documents — never "passes its own spec." Every
deficiency goes into a tracked **issues log** (tracking number, date, equipment ID, source of deviation,
description, response, open/closed status) and stays open until field-verified corrected. The agent that
owns this arc is the **OCA**; the **Cx Engineer** writes and runs the scripts; **Construction Manager** and
**Field Technician** coordinate and execute; **Design Engineer** authors the SOO the tests verify against;
**Owner/FM** sets the OPR/Tier the whole exercise is measured by.

---

### One-line takeaways for agent grounding

1. The power chain is **utility → transformer → switchgear → (generator via ATS) → UPS → ASTS/PDU → rack**;
   the cooling chain is **chiller/economizer → pumps → CRAH → hot/cold aisle → (liquid loop for AI density)**.
2. The two canonical L5 scripts are **loss-of-utility (generator start + UPS ride-through)** and
   **loss-of-cooling (standby unit stages on before over-temp)** — and the best script runs them together.
3. UPS battery runtime and generator start time are **one integrated requirement**, not two independent specs.
4. **N / N+1 / 2N** is the mechanism; **concurrent maintainability (Tier III)** and **fault tolerance (Tier IV)**
   are the outcomes the OPR's Tier demands — and they dictate which failure scripts L5 must pass.
5. **Liquid cooling** changes the L2 emphasis: pressure-test and leak-test loops *before* energizing IT.
6. **BMS/EPMS/DCIM** are the evidence layer — verify and calibrate the monitoring before you trust the test
   it records; confirm field instruments agree with the trend.
7. Everything traces to the **OPR** and the claimed **Tier**; "passes its own factory test" is never sufficient
   — the L5 question is always *correctly integrated, and does the failure survive?*
