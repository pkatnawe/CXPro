# Sequences of Operation — Study Notes

> **CXPro knowledge base — for agent grounding.** Our working notes on the sequence of
> operations (SOO) — the written control logic the BAS/BMS executes, and the artifact every
> functional test is written *against*. Written in our own words and framed for CXPro's use
> case: AI agents that play commissioning roles on data-center projects. Structured as reusable
> knowledge — *concept → why it matters → how it maps to CXPro*.
>
> **Role agents (shared with notes 01–03):** OCA (Owner's Cx Authority), Cx Engineer,
> Construction Manager, Field Technician, Design Engineer, Owner/FM.
> **Commissioning levels:** L1 factory/component → L2 delivery/installation →
> L3 pre-functional/start-up → L4 functional performance (single system) →
> L5 integrated systems testing (cross-system, failure-mode).
> **Where the SOO lives in the document chain:** OPR → BoD → Cx Plan → **Specs/SOO** →
> Checklists → FPT → Issues Log → Systems Manual → Cx Report.
>
> Sibling notes: airflow/power systems in `02-datacenter-systems-for-cx.md`; the catalog of
> reusable test patterns this note feeds into is `04-functional-test-library.md`.

---

## 0. What an SOO is — the bridge between intent and testable behavior

**Concept.** A sequence of operations is the plain-language (often pseudo-code) description of
*how a system is supposed to behave under every condition*: what it senses, what it controls,
the set-points it holds, the modes it moves through, the safeties that override it, and the
alarms it raises. It is the specification the controls contractor turns into BAS/BMS program
code, and it is the specification the Cx Engineer turns into a test script. The same document
feeds both the *builder* of the logic and the *verifier* of it.

**Why it matters.** Design intent (in the OPR/BoD) is goal-shaped — "hold the cold aisle in the
ASHRAE envelope," "ride through a utility loss with no load drop." That intent is not directly
testable; you cannot put a meter on "intent." The SOO is the translation layer that converts a
goal into **discrete, observable cause-and-effect statements** — *if return-air temperature
rises above set-point plus deadband, the chilled-water valve opens.* Each such statement has an
input you can force and an output you can measure. The SOO is therefore the hinge on which the
whole verification arc turns: a vague SOO produces an untestable building; a crisp one produces a
building where every claim has a corresponding pass/fail check.

**CXPro mapping.** The **Design Engineer** agent *authors* the SOO (Specs/SOO in the chain). The
**Cx Engineer** agent *verifies* it via the FPT. The OCA reviews the SOO during design review for
one thing above all — **testability**: can each line be exercised and observed? If not, it gets
flagged before it is ever programmed.

---

## 1. The anatomy of an SOO

A complete SOO for any system contains the same building blocks. An agent reading one should
expect — and look for — each of these.

| Element | What it specifies | Why a tester cares |
|---|---|---|
| **Points list** | Every signal in and out of the controller: DI/AI inputs, DO/AO outputs. | Defines exactly what can be *forced* (inputs) and what can be *observed* (outputs). The test's measurement plan comes straight from here. |
| **Set-points** | Target values the loop drives toward (supply-air temp, duct static pressure, CHW differential pressure). | The "expected value" half of every acceptance criterion. |
| **Deadbands / hysteresis** | The band around a set-point inside which no action is taken (stops hunting/short-cycling). | Tells the tester how much deviation is *allowed* before output should change — avoids false fails. |
| **Reset schedules** | Rules that move a set-point based on another variable (e.g. supply-air temp reset by zone demand; CHW set-point reset by valve position). | A reset is itself a sequence to test — force the driver, confirm the set-point moves correctly. |
| **Operating modes** | Occupied, unoccupied, startup, shutdown, and failure modes — each with its own logic. | Each mode is a separate test case; most missed defects hide in mode *transitions*. |
| **Interlocks & safeties** | Hard overrides that ignore normal control (freezestat, high static cutout, smoke trip, high-temp shutdown). | Non-negotiable pass/fail items; a safety that doesn't trip is a finding regardless of energy performance. |
| **Alarms** | Conditions that notify operators (filter ΔP high, fan failure, low CHW flow, leak detected). | Each alarm must be *provoked and seen* during the FPT — an unproven alarm is an invisible failure mode in operation. |
| **Trend points & frequency** | Which points are logged and how often (e.g. every 1–5 min for control loops, faster around transfers). | Trends are the *evidence record*; if a point isn't trended at adequate resolution, a fast event (a transfer) can't be proven. |

### How to read a points list

The points list is the SOO's spine. Four signal types:

- **DI (Digital Input)** — a binary status the controller reads: fan proof (running/stopped),
  freezestat tripped, smoke detector, door switch, generator-running contact.
- **AI (Analog Input)** — a measured value: temperature, humidity, pressure, flow, valve/damper
  position feedback, current.
- **DO (Digital Output)** — a binary command the controller writes: start/stop a fan or pump,
  open/close an isolation valve, enable a stage.
- **AO (Analog Output)** — a modulating command: valve 0–100%, damper position, VFD speed.

The discipline for a tester: **inputs are what you force; outputs are what you confirm.** Read the
list and you immediately know your two columns — what you'll induce, and what should respond.
Prefer forcing a *real* physical condition over overwriting the AI in the BAS (see note 01): an
overwrite tests only the logic downstream of the point, not the sensor and the field response.

---

## 2. Representative sequences in plain language — and exactly what an FPT checks

Below, each sequence is described as the SOO would state it, then immediately followed by the
**line-by-line FPT** the Cx Engineer would derive from it. The pattern is always the same:
*establish a known state → force an input → observe the output against the set-point.*

### 2.1 AHU — supply-air-temperature and static-pressure control with economizer

**SOO, in words.** The supply fan modulates its VFD to hold **duct static pressure** at set-point
(commonly with a reset that lowers the set-point as VAV boxes close — a duct-static reset). The
**cooling coil valve** and **economizer dampers** sequence to hold **supply-air temperature** at
set-point: as cooling demand rises, first the outside-air dampers modulate open (free cooling)
while return dampers close; only when the dampers are fully favoring outside air (or outside air is
unsuitable) does the chilled-water valve open. A **mixed-air low-limit** and a **freezestat** override
to protect the coil. On loss of fan proof (DI), the unit shuts down and alarms.

**What the FPT checks, line by line:**
- Fan starts on command (DO) and **fan proof (DI)** is seen; if proof never appears, unit alarms — verify.
- Duct **static pressure (AI)** is driven to set-point; close zone boxes and confirm the **reset schedule**
  lowers the static set-point and the **VFD (AO)** slows — fan power should drop, not just hold.
- Raise the cooling demand: confirm **economizer dampers (AO)** open toward outside air *before* the
  **CHW valve (AO)** — sequence order is a discrete pass/fail.
- Sweep **outside-air temperature** across the changeover point; confirm economizer enable/disable matches
  the SOO's high-limit (dry-bulb or enthalpy) logic.
- Drive **supply-air temperature (AI)** below the **low-limit**; confirm the limit and **freezestat (DI)**
  override and the unit responds per the safety, regardless of the temperature loop.
- Drop **fan proof**; confirm shutdown and **alarm** are raised and trended at the stated frequency.

### 2.2 VAV terminal box

**SOO, in words.** The box modulates its **damper** to hold **zone temperature** at set-point within a
deadband. In cooling, airflow rises between minimum and maximum CFM as the zone warms; below the cooling
range it falls to **minimum airflow** (a ventilation floor); in reheat-equipped boxes, the reheat valve
or stage energizes below set-point. The box reports airflow and damper position back to the AHU's
duct-static reset.

**What the FPT checks, line by line:**
- Raise **zone temperature (AI)**: confirm the **damper (AO)** opens and measured **airflow (AI)** rises
  toward design maximum CFM.
- Lower it through the deadband: confirm the box throttles to **minimum CFM** and holds it (ventilation
  floor never violated).
- For reheat boxes: drive below set-point and confirm reheat energizes only after the box is at minimum air.
- Confirm the box's airflow/demand feeds the **AHU duct-static reset** — i.e. closing several boxes
  actually lowers the AHU static set-point (the cross-system link to §2.1).

### 2.3 Chilled-water plant — staging and differential-pressure reset

**SOO, in words.** Chillers and their associated pumps **stage on** as plant load (measured by flow ×
ΔT, or by lead-chiller loading) rises past staging thresholds, and **stage off** with hysteresis to
prevent short-cycling. Secondary pumps modulate VFDs to hold **differential pressure (DP)** at set-point
at a remote index point; a **DP reset** lowers that set-point as control valves close (so the plant
doesn't push more head than the loads need). Minimum-flow bypass protects the chillers.

**What the FPT checks, line by line:**
- Build load until the first **staging threshold** is crossed; confirm the next chiller and its pump
  **stage on (DO)** at the stated set-point, and that **anti-short-cycle** timers prevent immediate
  re-staging.
- Shed load and confirm **stage-down** occurs only after the hysteresis/deadband — not the instant load
  dips.
- Drive secondary **DP (AI)** off set-point; confirm pump **VFD (AO)** restores it at the index point.
- Close coil valves across the plant; confirm the **DP reset** lowers the set-point and pump speed falls.
- Verify **minimum-flow bypass** opens to protect a chiller at low load, and **low-flow/low-DP alarms**
  provoke and trend.

### 2.4 Pump control — lead/lag (and standby)

**SOO, in words.** A **lead** pump runs; a **lag** pump starts on demand (DP not met, or lead failure) and
the controller **alternates** lead/lag on a runtime schedule to equalize wear. On **lead-pump failure**
(loss of proof/flow DI), the **standby** pump auto-starts. Each pump proves flow before the system
considers it running.

**What the FPT checks, line by line:**
- Confirm lead pump runs and proves flow (**DI**); lag is idle.
- Increase demand past the lag-start point; confirm **lag starts (DO)** and proves flow.
- Force **loss of proof** on the lead; confirm **standby auto-starts** and DP/flow is restored within the
  SOO's stated time — *the timing is the pass/fail number*.
- Advance the **alternation schedule**; confirm lead/lag roles swap (runtime equalization).
- Provoke a **pump-failure alarm** and confirm it is raised and trended.

### 2.5 Data-center power sequences (the integrated set)

These are the highest-stakes sequences in the building and the reason power systems are tested *together*
(see note 02 §1.2). The SOO describes the orchestration; the FPT proves the timing.

**(a) Generator start on utility loss.** *SOO:* on **loss of utility (DI)**, the controller signals the
generator to **crank and start**; the genset stabilizes **voltage and frequency** within a stated window;
on reaching ready, it signals the transfer logic.
*FPT, line by line:* open the utility (or simulate the signal); confirm the **start command (DO)** fires
within the stated delay; confirm the genset reaches stable voltage/frequency (**AI**) inside the rated
start time; confirm a **fail-to-start alarm** path exists and provokes correctly; trend the whole event at
high resolution (sub-second), since the *number* — start time — is the acceptance criterion.

**(b) ATS transfer logic & timing.** *SOO:* the ATS senses source availability, waits a **transfer time
delay** (debounce), transfers the load to the generator once it's stable, and **re-transfers** to utility
after a stabilization delay on its return, with a generator **cooldown** before shutdown. Neutral-switching
or in-phase logic may apply.
*FPT, line by line:* confirm **transfer** occurs only after the genset is ready and the transfer delay
elapses (not before — premature transfer is a fail); measure **transfer time** and confirm it is shorter
than the UPS ride-through window; restore utility and confirm **re-transfer** after the stated delay, then
**generator cooldown** and stop; confirm any **neutral/in-phase** behavior matches the SOO; trend all
transfer events on the EPMS.

**(c) UPS operating modes — normal / battery / bypass.** *SOO:* in **normal (online double-conversion)**,
the load rides on the inverter fed from the rectifier. On **input loss**, the UPS transfers seamlessly to
**battery**, holding the inverter output while batteries discharge. On overload or internal fault, the
**static bypass** transfers the load to raw mains within milliseconds. **Maintenance bypass** isolates the
UPS for service without dropping the load.
*FPT, line by line:* confirm load is clean on the **inverter** in normal mode; remove input and confirm
**seamless transfer to battery** with no output interruption (the EPMS should show no dropout); run a
**battery discharge** and confirm runtime **exceeds the generator start-and-accept time** (the single most
important integrated number — see note 02 §1.2); provoke an overload/fault and confirm **static-bypass
transfer** is glitch-free within tolerance; operate the **maintenance bypass** and confirm the UPS isolates
with the load fully maintained; confirm every mode change raises the correct **alarm/status** and is
trended.

---

## 3. The principle — every line of an SOO must be individually verifiable

The governing idea: **an SOO line that cannot be tested should not exist.** If the Design Engineer agent
writes "the unit shall optimize energy use," there is no input to force and no output to confirm against a
set-point — it is intent, not sequence, and it cannot pass or fail. Every legitimate SOO line resolves to
the same testable shape:

> *given [precondition/mode], when [input crosses a set-point ± deadband], then [output changes] within
> [time], and [alarm/safety] behaves accordingly — observable on [trend point at frequency].*

This is why the SOO and the FPT are two faces of one artifact. A well-formed SOO is *already* a test plan in
disguise; the Cx Engineer's job is to make the disguise explicit.

### How the Cx Engineer agent turns an SOO into a test script

The mechanical procedure the agent follows:

1. **Parse the points list** into two columns — **inputs to force** (DI/AI) and **outputs to confirm**
   (DO/AO) — plus the alarms and trend points.
2. **Enumerate the modes** (occupied/unoccupied/startup/shutdown/failure) — each becomes one or more test
   cases; pay special attention to the *transitions* between them.
3. **For each SOO statement**, write a step in the canonical shape: known initial state → force the input →
   record baseline (BAS + field instrument) → observe the output and the time → **compare against the
   set-point and deadband** = pass/fail.
4. **Lift every set-point, deadband, reset rule, and timing value** out of the SOO to become the explicit
   **acceptance criteria** — no number invented, all traceable to the SOO (and through it to the BoD/OPR).
5. **Schedule each safety, interlock, and alarm** as its own non-negotiable test step — these pass/fail on
   behavior, independent of efficiency.
6. **Set trend resolution** to match the fastest event the script must prove (sub-second around transfers;
   minutes for slow control loops) — an unrecorded event cannot be a pass.
7. **Tie the result back up the chain** — each test references the SOO line, which references the BoD/OPR
   intent, so a pass means *intent verified*, not merely "the box moved." Deficiencies go to the Issues Log
   and stay open until field-verified.

The reusable, system-by-system test patterns this procedure produces — the catalog the Cx Engineer pulls
from rather than re-deriving each time — live in `04-functional-test-library.md`; the systems those tests
exercise are described in `02-datacenter-systems-for-cx.md`.

---

### One-line takeaways for agent grounding

1. The SOO is the **bridge**: it turns goal-shaped design intent into discrete, observable cause-and-effect
   lines that a test can pass or fail.
2. The **points list** tells you your two columns — **inputs to force (DI/AI)**, **outputs to confirm
   (DO/AO)** — plus alarms and trend points.
3. Most defects hide in **modes and mode transitions** (startup/shutdown/failure), and in **sequence order**
   (economizer before CHW valve, lag before standby).
4. For data-center power, the SOO describes the orchestration but the **FPT proves the timing** — generator
   start time, ATS transfer time, UPS battery runtime are one linked acceptance set.
5. **Safeties, interlocks, and alarms** pass/fail on behavior alone — they must be provoked and seen,
   independent of energy performance.
6. **Every line must be individually verifiable**; the Design Engineer agent authors the SOO, the Cx
   Engineer agent reads it as a test plan and writes the FPT — two faces of one artifact.
