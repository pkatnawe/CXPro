# Functional Test Library — Study Notes (FPT & IST Templates)

> **CXPro knowledge base — for agent grounding.** Our reusable library of functional
> performance test (FPT) and integrated systems test (IST) templates — the patterns the
> Cx Engineer agent drafts from and the Field Technician agent executes on a tablet.
> Written in our own words and framed for CXPro's use case: AI agents that play
> commissioning roles on data-center projects. Structured as *anatomy of a test →
> parameterized templates → sampling & test philosophy*.
>
> **Role agents (shared with notes 01–03):** OCA (Owner's Cx Authority — reviews & signs),
> Cx Engineer (writes/executes tests, triages deviations), Construction Manager (schedule,
> witnesses, coordination), Field Technician (executes on a tablet, captures evidence),
> Design Engineer (BoD, SOO, RFIs), Owner/FM (OPR, inherits the building).
> **Commissioning levels:** L1 factory → L2 delivery/installation → L3 pre-functional/start-up
> → L4 functional performance (single system) → L5 integrated systems testing (failure-mode).
> **Where this sits in the document chain:** OPR → BoD → Cx Plan → Specs/SOO → Checklists →
> **FPT** → Issues Log → Systems Manual → Cx Report. The SOO is the *source*; every test step
> below is the SOO read backwards into a question — "does it actually do this?"

---

## 0. How to read this library

A template is **not** a test. It is a parameterized skeleton with placeholders — `{setpoint}`,
`{tag}`, `{design_value}` — that the Cx Engineer agent resolves against the SOO, the BoD design
values, and the equipment schedule for *this* project. Resolving a template produces an executable
FPT that the Field Technician agent runs step by step, recording a value at each gate. Placeholders
that the agent cannot resolve become **RFIs to the Design Engineer**, not guesses. A template with
unresolved placeholders must never reach the field — an executable test has zero `{}` left in it.

Cross-references: the systems themselves are described in `02-datacenter-systems-for-cx.md`; the
prerequisite gates (L3 sign-off before L4, etc.) come from `01-commissioning-process.md`; handover
trending obligations are in `03-datacenter-operations-handover.md`.

---

## 1. Anatomy of a good test procedure

**Concept.** Every functional test, regardless of system, has the same six-part skeleton. If any
part is missing the test is not defensible.

| Part | What it answers | Failure if omitted |
|---|---|---|
| **Objective** | What single behavior are we proving, and against which OPR/SOO clause? | "We tested the AHU" — but tested *what*? Untraceable result. |
| **Prerequisites / initial state** | What must already be true (L3 done, system in a known mode, safeties live)? | Test runs on an uncommissioned system; result is noise. |
| **Test steps** | The exact, ordered, reproducible actions — including how the stimulus is *applied*. | Two technicians get two answers; not repeatable. |
| **What to record** | The measured quantity, **and** its source — BMS trend vs. independent field instrument. | A trend confirms the BMS *thinks* it's right, proving nothing about reality. |
| **Pass/Fail acceptance criteria** | The numeric gate, with tolerance and units, decided *before* the test. | Criteria invented after the data is in = confirmation bias. |
| **Common failure modes** | What usually goes wrong, so the technician recognizes it and the engineer triages fast. | Real deviations get logged as "anomaly, retest" and lost. |

**Why it matters.** Acceptance criteria written *after* seeing the data are worthless. The Cx
Engineer agent fixes the gate at draft time; the Field Technician records; the OCA agent signs only
if the recorded value clears the pre-set gate. This separation of *who sets the bar* from *who
clears it* is what makes a Cx Report credible.

**The BMS-vs-field rule (load-bearing).** For any value that *matters to acceptance*, record it
from an **independent field instrument**, not only the BMS trend. The BMS reports what its sensors
and logic believe; a miscalibrated sensor or a spoofed point will happily report a passing number
while the real condition fails. Use the BMS trend to prove *the control system saw and reacted*;
use the field instrument to prove *physical reality matched*. Where they disagree, that gap is
itself a finding (sensor calibration / point mapping).

**Active vs. passive testing.** A **passive** test observes the system in its normal mode and checks
the SOO is honored (e.g., trend a stable day). An **active** test *injects a stimulus* — drops a
load, opens a breaker, fails a pump — and watches the response. L4/L5 are dominated by active tests
because resilience is invisible until provoked. See §13.

---

## 2. Air-handling / VAV airside (L4)

**Objective.** Prove the AHU + VAV terminals maintain space/supply conditions and modulate correctly
across the operating range, per SOO `{soo_ref}`.

**Prerequisites / initial state.** L3 start-up signed; TAB (test-and-balance) report accepted; all
dampers/actuators stroked; safeties (freezestat, smoke, high-static) live; system in Occupied mode at
`{supply_air_temp_sp}` °F and `{duct_static_sp}` in. w.c.

**Test steps.**
1. Command supply-air temperature setpoint from `{supply_air_temp_sp}` to ±`{sat_step}` °F; observe
   coil valve and discharge response.
2. Drive duct static setpoint reset; confirm VFD speed and damper tracking.
3. Force two representative VAV boxes to max and min airflow `{vav_max_cfm}` / `{vav_min_cfm}`; confirm
   reheat sequence and minimum-OA position hold.
4. Trigger economizer changeover at `{economizer_oat}` °F OAT; confirm OA/RA/EA damper sequence.
5. Drive one zone to a heating call; confirm no simultaneous heating/cooling fight.

**What to record.** BMS trend: SAT, duct static, VFD %, valve %, damper %, each VAV cfm.
Field instrument: SAT by calibrated thermometer at the coil discharge; airflow at 1–2 boxes by hood;
static by manometer. Record both columns side by side.

**Pass/Fail acceptance criteria.** SAT holds within ±`{sat_tol}` °F of setpoint at steady state;
duct static within ±`{static_tol}` in. w.c.; VAV cfm within ±`{cfm_tol}`% of commanded; economizer
changes over at the design OAT ±`{oat_tol}` °F; **zero simultaneous heating and cooling** in any zone.
Field vs. BMS agreement within sensor tolerance.

**Common failure modes.** Hunting valves/dampers (PID untuned); economizer stuck (linkage, OAT sensor
in sun); VAV min set below ventilation minimum; reheat and cooling fighting; duct-static sensor at the
wrong location making reset meaningless; a trend that "passes" while the field thermometer reads 4 °F off.

---

## 3. Chilled-water plant — load drop & staging (L4)

**Objective.** Prove the plant stages chillers/pumps up and down correctly and rides through a sudden
load drop without tripping or surging, per SOO `{soo_ref}`.

**Prerequisites / initial state.** L3 start-up signed; flow proven; BAS staging logic loaded; plant
running ≥ `{min_load_pct}`% load with `{n_running}` of `{n_total}` chillers on at `{chw_supply_sp}` °F.

**Test steps.**
1. Establish steady load; record baseline.
2. **Active load drop:** shed `{load_drop_pct}`% of load in one step (valve/load-bank). Watch CHWST
   excursion, chiller unloading, and stage-down timing.
3. Confirm stage-down occurs only after the `{stage_down_delay}`-min interstage timer and does not
   short-cycle.
4. Re-apply load; confirm stage-up at `{stage_up_threshold}` and pump speed/ΔP reset tracks.
5. Confirm lead/lag rotation and standby-pump auto-start on a forced lead-pump fail.

**What to record.** BMS trend: CHWST/CHWRT, plant ΔP, each chiller %RLA and status, pump VFD %, kW.
Field instrument: CHWST by calibrated probe in the well; differential pressure by gauge; current by
clamp meter on one chiller.

**Pass/Fail acceptance criteria.** CHWST excursion ≤ `{chwst_excursion_tol}` °F and recovers to
setpoint within `{recovery_min}` min after the load drop; **no chiller trip**; stage-down respects the
interstage timer (no short-cycle inside `{min_runtime}` min); standby pump achieves flow within
`{pump_start_sec}` s of a forced fail.

**Common failure modes.** Chiller low-flow / low-evap-temp trip on the load drop; staging hunts
(thresholds too close); decoupler flow reversing; primary pump and chiller staging not coordinated;
CHWST sensor lag masking the real excursion in the trend.

---

## 4. Heating / hot-water (L4)

**Objective.** Prove the HW plant maintains supply temperature and stages boilers/pumps across load,
per SOO `{soo_ref}`.

**Prerequisites / initial state.** L3 signed; combustion/flue safeties live; HW supply at
`{hws_sp}` °F; `{n_running}` of `{n_total}` boilers on.

**Test steps.**
1. Establish baseline at design `{hws_sp}` °F.
2. Apply a step heating load (open coils / load bank); observe boiler firing and stage-up at
   `{stage_up_threshold}`.
3. Drive HW reset schedule across `{oat_low}`–`{oat_high}` °F OAT; confirm setpoint tracks the reset curve.
4. Remove load; confirm stage-down with interstage timer `{stage_down_delay}` min; no short-cycle.
5. Force lead boiler fail; confirm lag pickup.

**What to record.** BMS trend: HWST/HWRT, each boiler firing rate/status, pump VFD %, reset setpoint.
Field instrument: HWST by calibrated probe; flue/combustion check per vendor where in scope.

**Pass/Fail acceptance criteria.** HWST within ±`{hws_tol}` °F of the (reset-adjusted) setpoint;
stage transitions respect timers; reset curve followed within ±`{oat_tol}` °F; lag boiler online
within `{boiler_start_min}` min of lead fail.

**Common failure modes.** Reset curve overridden by a fixed local setpoint; boiler short-cycling on
light load; minimum-flow bypass missing causing trips; HWRT too cold for condensing boilers (efficiency
miss); pump and boiler staging fighting.

---

## 5. Generator — start time, load acceptance, run (L4)

**Objective.** Prove the generator starts on signal, accepts full design block load within the SOO
window, and runs stable, per SOO `{soo_ref}`. (System detail in `02-datacenter-systems-for-cx.md`.)

**Prerequisites / initial state.** L3 signed; fuel ≥ `{fuel_min_pct}`%; jacket-water heater on; load
bank rigged at `{design_kw}` kW; coolant/oil at temp; EPO and safeties verified.

**Test steps.**
1. Initiate start (engine-start signal / simulated utility loss at the gen controller only — *not* the
   full L5 yet). Record crank-to-ready time.
2. Confirm voltage/frequency stabilize before breaker close.
3. Apply load in steps to `{design_kw}` kW (or per the block-load profile); record frequency/voltage dip
   and recovery at each step.
4. Run at design load for `{run_duration}` min (or load-bank run per spec); monitor temps, pressures, fuel.
5. Unload, cooldown, return to standby/auto.

**What to record.** Genset controller + BMS: crank-to-ready, time-to-rated-voltage/-frequency, kW/kVAR,
freq/volt dip & recovery, jacket-water temp, oil pressure, fuel rate. Field instrument: independent
power analyzer at the gen output for frequency-dip verification; clamp meter cross-check.

**Pass/Fail acceptance criteria.** Engine reaches ready and voltage/frequency stable within
`{start_time_sec}` s; on each block-load step frequency dip ≤ `{freq_dip_hz}` Hz and recovers within
`{freq_recover_sec}` s; voltage dip ≤ `{volt_dip_pct}`%; stable run for the full duration with all
parameters in band; returns to auto/standby cleanly.

**Common failure modes.** Slow start (cold engine, weak batteries, air in fuel); frequency dip exceeds
limit on block load (governor / fuel-system response); cooling can't hold at sustained load; alarms on
load step; fails to return to auto.

---

## 6. UPS — transfer, battery ride-through, return (L4)

**Objective.** Prove the UPS carries the load through a source loss with no output interruption, rides
on battery for the rated time, and returns to normal cleanly, per SOO `{soo_ref}`.
(See `02-datacenter-systems-for-cx.md`.)

**Prerequisites / initial state.** L3 signed; batteries fully charged and post-acceptance; load at
`{load_pct}`% on a resistive bank; downstream a sensitive-load monitor / power-quality recorder placed.

**Test steps.**
1. **Active source loss:** open the UPS input (or fail rectifier source). Confirm seamless transfer to
   battery — **no break** seen by the downstream monitor.
2. Hold on battery; confirm ride-through to `{rated_runtime}` min at `{load_pct}`% (or to low-voltage
   disconnect on a controlled discharge test).
3. Restore input; confirm return to normal/online and battery recharge initiation.
4. Test static-bypass transfer (forced) and re-transfer back.

**What to record.** UPS panel + BMS: input/output V & f, battery V & current, % load, runtime, mode.
Field instrument: power-quality recorder on the **output** to prove zero break and bound any transient;
this is the value that decides the test, not the UPS's own status flag.

**Pass/Fail acceptance criteria.** **Zero output interruption** on transfer (no dropout at the load
monitor); output stays within `{output_v_tol}`% V and `{output_f_tol}` Hz throughout; battery
ride-through ≥ `{rated_runtime}` min at the test load; static bypass and re-transfer break-free;
clean return to online.

**Common failure modes.** Transient on transfer exceeding the IT equipment's tolerance; battery runtime
short of rating (aged/weak cells — the discharge curve is the truth); bypass transfer not actually
break-free; fails to re-transfer; UPS status says "OK" while the output recorder shows a sag.

---

## 7. ATS — transfer timing & re-transfer (L4)

**Objective.** Prove the automatic transfer switch senses source loss, transfers to the alternate
(generator) source within the SOO window, and re-transfers back with the correct time delays, per SOO
`{soo_ref}`.

**Prerequisites / initial state.** L3 signed; both sources available; generator commissioned (§5);
timers set per spec; downstream load known.

**Test steps.**
1. **Active utility loss** at the ATS normal source. Record sense-to-engine-start signal, and
   sense-to-transfer once the alternate is stable.
2. Confirm the ATS waits for generator ready (V/f stable) before transferring — no transfer to a dead bus.
3. Restore normal source; confirm re-transfer occurs only after the `{retransfer_delay}` stabilization
   timer, then the `{cooldown_delay}` engine cooldown/unloaded run.
4. Test in-phase/neutral-overlap timing if applicable `{transition_type}`.

**What to record.** ATS controller + BMS: time-stamped events (sense, start signal, transfer,
re-transfer), source V/f both sides. Field instrument: stopwatch/recorder cross-check on transfer
timing; independent V/f at the load bus.

**Pass/Fail acceptance criteria.** Transfer to alternate within `{transfer_time_sec}` s of a stable
generator; **no transfer onto an unstable/dead source**; re-transfer respects `{retransfer_delay}` and
engine cooldown timers; transition type (open/closed/delayed) behaves per spec with neutral timing in band.

**Common failure modes.** Transfers before the generator is stable (nuisance / damaging); re-transfer
timer too short causing oscillation on flickery utility; engine cooldown skipped; timers field-defaulted,
not set to spec; event log out of sync with reality.

---

## 8. Switchgear — main-tie-main (L4)

**Objective.** Prove the main-tie-main lineup detects loss of one source, closes the tie, and feeds both
buses from the surviving source — with correct interlocks and no parallel-where-prohibited, per SOO
`{soo_ref}`.

**Prerequisites / initial state.** L3 signed; protective relays tested and settings verified; both mains
energized, tie open, each bus at `{bus_load_pct}`% load; interlock scheme verified de-energized first.

**Test steps.**
1. Verify mechanical/electrical interlocks: attempt a prohibited close-three-breakers condition; confirm
   it is blocked.
2. **Active loss of source A:** open Main A. Confirm Main A trips/opens, tie closes per the
   `{tie_close_logic}`, Bus A is picked up from source B.
3. Verify load on the surviving source stays within rating `{source_rating_kw}`.
4. Restore source A; confirm return-to-normal sequence (manual or auto per spec) opens the tie.
5. Repeat for loss of source B.

**What to record.** Relay/PLC event log + BMS: breaker states with timestamps, bus V, per-source current.
Field instrument: independent metering on each bus; relay trip confirmation.

**Pass/Fail acceptance criteria.** Prohibited parallel is mechanically/logically blocked; tie closes and
restores the dead bus within `{tie_close_sec}` s; surviving source not overloaded; return-to-normal opens
the tie correctly; no nuisance trips; event timestamps consistent.

**Common failure modes.** Interlock allows a forbidden parallel (dangerous); tie close logic wrong on a
specific source loss; surviving source overloaded because load-shed didn't fire; relay settings field-set
incorrectly; auto-restore re-energizes before sync conditions met.

---

## 9. L5 IST #1 — Loss of utility power (generator start + UPS ride-through)

**Objective.** Prove the **end-to-end** power-resilience choreography: utility fails → UPS instantly
carries the critical load on battery → generator starts and stabilizes → ATS/switchgear transfers →
generator picks up the full facility (mechanical + critical) → UPS recharges — **all before the UPS
batteries deplete**, with the IT load never seeing an interruption. This is the canonical cross-system
test; it is the reason every L4 above exists. (Scenario logic in `02-datacenter-systems-for-cx.md`.)

**Prerequisites / initial state.** **All** contributing systems L4-complete and signed (generator §5,
UPS §6, ATS §7, switchgear §8, and chilled-water plant §3 since cooling must also ride through).
OCA agent present to witness; Construction Manager has scheduled the window and confirmed it is safe to
fail utility; full design IT load simulated by load banks `{design_it_load_kw}`; output power-quality
recorders on the critical bus; rollback/abort plan signed.

**Test steps.**
1. **Active utility loss:** open the main utility breaker (real, not simulated at a controller).
2. Confirm UPS instantly on battery — **zero break** at the critical-bus recorder.
3. Confirm generator start signal fires; track crank-to-ready.
4. Confirm ATS/switchgear transfer onto stable generator; mechanical loads (chillers, pumps, CRAHs)
   restart per the staged/load-step sequence without tripping the genset (frequency dip in band, §5).
5. Confirm cooling re-establishes before space temperature exceeds `{space_temp_limit}` °F (couples to §10).
6. Confirm UPS transitions to recharge while still supporting load.
7. Restore utility; confirm orderly return-to-normal across all systems.

**What to record.** Synchronized, time-stamped trend across UPS, genset, ATS, switchgear, plant — one
common timeline. Field instruments: critical-bus power-quality recorder (decides pass), independent
generator power analyzer, space-temperature loggers. The single most important recorded fact is the
**margin between UPS battery runtime and generator-online time**.

**Pass/Fail acceptance criteria.** **Zero interruption** to the critical IT load throughout; generator
online and carrying full block load with at least `{battery_margin_min}` min of UPS battery still in
reserve at the moment of stable transfer; no genset trip on mechanical block load; space temperature
stays under `{space_temp_limit}` °F; clean return to normal. Failure of *any* one criterion fails the IST.

**Common failure modes.** Generator-online time creeps past battery runtime (the classic killer — each
system passed alone, the *hand-off* failed); mechanical block load trips the genset on frequency dip;
ATS transfers to an unstable source; cooling recovery too slow and space overheats during the transfer;
UPS recharge inrush overloads the genset.

---

## 10. L5 IST #2 — Loss of cooling

**Objective.** Prove the facility survives a loss of primary cooling: the failure is detected, redundant
cooling capacity (N+1/2N) auto-starts, thermal-ride-through assets (chilled-water buffer / thermal
storage) hold the load during the gap, and space temperature stays within IT-equipment limits — per the
SOO failure logic. The thermal analogue of §9: here the few-minutes-to-failure asset is heat, not power.

**Prerequisites / initial state.** Plant L4-complete (§3); redundancy auto-start logic loaded; buffer
volume / thermal storage charged; full IT heat load simulated `{design_it_load_kw}`; space-temperature
loggers placed at representative racks (inlet); OCA witnessing; abort plan signed (real thermal risk —
Construction Manager owns the safety window).

**Test steps.**
1. Establish steady-state cooling at design load; baseline space inlet temps.
2. **Active failure:** trip the lead chiller (or fail the lead CHW pump / lead CRAH bank per the scenario
   `{failed_component}`).
3. Confirm fault detection and auto-start of the redundant unit within `{redundant_start_sec}` s.
4. Track space-temperature rise during the gap; confirm buffer/thermal-storage carries the load.
5. Confirm flow and CHWST re-establish; space temperature recovers to `{space_temp_sp}` °F.
6. Optionally repeat for a second concurrent failure if the redundancy claim is 2N.

**What to record.** BMS trend: CHWST, flow, each unit status, redundant-start timestamp, space temps.
Field instruments: rack-inlet temperature loggers (decide pass — the BMS space sensor may be elsewhere),
CHWST probe, flow cross-check. Key fact: **peak rack-inlet temperature and time-above-threshold**.

**Pass/Fail acceptance criteria.** Redundant capacity auto-starts within `{redundant_start_sec}` s of the
fault; **rack-inlet temperature never exceeds `{rack_inlet_limit}` °F** during the gap; cooling recovers
to setpoint within `{cooling_recovery_min}` min; for a 2N claim, the second failure is also survived. Any
breach of the inlet-temperature limit fails the IST.

**Common failure modes.** Redundant unit doesn't auto-start (logic, valve lineup, standby pump won't
prime); buffer volume undersized so temperature overshoots before recovery; CHWST sensor lag hides a real
excursion that the rack loggers catch; redundant start trips the plant on inrush; recovery too slow.

---

## 11. Resolving a template into an executable test (worked pattern)

The Cx Engineer agent's loop for each template:

1. Pull the system's SOO clause and BoD design values → resolve every `{placeholder}`.
2. Any placeholder with no source → raise an **RFI** to the Design Engineer; park the test.
3. Set acceptance criteria **now**, from design values + spec tolerances — never later.
4. Confirm prerequisites trace to signed L3 (or, for L5, signed L4) records.
5. Emit the executable FPT to the Field Technician's tablet with the BMS-vs-field record columns.
6. Field Technician executes, records both columns, attaches evidence (photo/screenshot/instrument export).
7. Engineer triages each gate; deviations → **Issues Log**; OCA reviews and signs cleared tests.
8. Passed tests roll into the Systems Manual and the Cx Report.

---

## 12. Sampling strategy

**Concept.** You cannot 100% functionally test every terminal unit on a large facility — hundreds of VAV
boxes, CRAHs, breakers. So FPT uses **sampling**: test a representative subset, and let the result speak
for the population.

**Why it matters.** A sample is only valid if a failure triggers an **escalation rule** decided up front:
e.g., test `{sample_pct}`% (commonly 10–20%) per type; **if a sampled unit fails, expand the sample**
(double it, or go to 100% for that type) and treat the failures as systemic until proven otherwise. A
sample with no escalation rule is just hoping. Critical, non-redundant, and life-safety systems are
**never** sampled — they are 100% tested, every unit, every mode.

**CXPro mapping.** The Cx Engineer agent picks the sample to span the range (different zones, ends of
runs, lead and lag units, worst-case orientation) rather than the convenient ones. The escalation
threshold is written into the test before execution; the OCA agent verifies the sample was
representative, not cherry-picked, before signing.

## 13. Why active vs. passive — choosing the method

**Concept.** Passive observation proves the system behaves in *normal* operation. Active stimulus proves
it behaves at the *moment of failure* — which is the only moment that matters for resilience.

| | Passive | Active |
|---|---|---|
| Method | Observe normal operation, trend, compare to SOO | Inject a fault/load change, watch the response |
| Proves | "It runs right when nothing's wrong" | "It survives when something *is* wrong" |
| Used for | Steady-state setpoint hold, reset schedules, trend review | All L5 ISTs; every transfer/failover/staging test |
| Risk | Low | Real (can disrupt live load) — needs a witnessed window + abort plan |

**Why it matters.** Every test in §§5–10 is active because redundancy, ride-through, and failover are
**invisible until provoked**. A 2N plant looks identical to a single plant on a calm day — only an active
failure tells them apart. The cost of active testing is real risk, which is why the Construction Manager
agent owns the scheduled window and the OCA witnesses, and why an abort/rollback plan is a prerequisite,
not a nicety. The whole reason commissioning exists (note 01) is to provoke these failures **under control,
before the building is live** — so the first real outage is not also the first test.
