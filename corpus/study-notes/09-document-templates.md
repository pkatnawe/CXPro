# Commissioning Document Templates — Study Notes

> **CXPro knowledge base — for agent grounding.** Our working notes on the structure and
> contents of every commissioning deliverable, so the role agents can *assemble or draft*
> them. Written in our own words and framed for CXPro's use case: AI agents that play
> commissioning roles on data-center projects. For each document we give *Purpose → Author
> (which agent) → When in the lifecycle → Key sections/fields → what "good" looks like
> (acceptance criteria)*.
>
> **Role agents (shared with notes 01–03):** OCA (Owner's Cx Authority), Cx Engineer,
> Construction Manager, Field Technician, Design Engineer, Owner/FM.
> **Commissioning levels:** L1 factory/component → L2 delivery/installation →
> L3 pre-functional/start-up → L4 functional performance → L5 integrated systems.
> **Document chain (the spine):** OPR → BoD → Cx Plan → Specs/SOO → Checklists → FPT →
> Issues Log → Systems Manual → Cx Report.
>
> **How to read each entry:** these are *templates*, not finished documents. The agent's job
> is to instantiate the template against a real project, preserving the traceability links
> described in the closing section. See `01-commissioning-process.md` for the process these
> documents move through, and `02-datacenter-systems-for-cx.md` for the system content that
> fills the test forms.

---

## 1. OPR — Owner's Project Requirements

**Purpose.** The anchor of the entire chain. Captures, in the owner's language, *what the
facility must do and how well* — the measurable functional intent against which everything
downstream is verified. It is a requirements document, not a design.

**Author.** **Owner/FM** authors it; **OCA** facilitates and reviews every requirement for
testability (a requirement the OCA can't later test is a defect in the OPR).

**When.** Pre-design, before BoD or any contract. It is a **living document** — revisited at
each phase gate and updated when scope changes.

**Key sections/fields.** Project purpose and success criteria; occupancy/load profiles
(for data centers: IT load ramp, density per rack/row); redundancy and availability targets
(N, N+1, 2N; uptime/availability %); thermal and environmental envelopes (supply-air temp/RH
ranges, ASHRAE class); energy and efficiency targets (PUE, EPI, WUE); resilience and
ride-through expectations (UPS autonomy, generator start time); maintainability and
concurrent-maintainability requirements; training and documentation expectations; project
benchmarks and constraints (budget, schedule, code/standard set).

**What "good" looks like.** Every target is **concrete, measurable, and verifiable** — a
number, a range, or a pass/fail condition, not an adjective. "Reliable cooling" is a defect;
"supply air 18–27 °C at the rack inlet under N+1 with any one CRAH offline" is good. Each
requirement is traceable to a stakeholder and carries an acceptance method.

---

## 2. BoD — Basis of Design

**Purpose.** The engineer's account of *how the design satisfies the OPR* — the assumptions,
criteria, and engineering decisions that turn intent into a designable system.

**Author.** **Design Engineer** authors it; **Cx Engineer** checks BoD↔OPR consistency
(does each design assumption actually serve an OPR requirement, and is anything in the OPR
left unaddressed?).

**When.** Design phase, immediately after the OPR is stable enough to design against.

**Key sections/fields.** Design weather/site conditions; system narratives per discipline
(cooling, power, controls, fire/life-safety); diversity and load assumptions; redundancy
topology and how it meets the OPR availability target; equipment selection criteria and
efficiency basis; applicable codes/standards; calculations basis and design margins;
deliberate exclusions and deferred decisions.

**What "good" looks like.** Each major assumption **cites the OPR requirement it serves**.
The redundancy and capacity claims are arithmetically consistent with the OPR. Where the
design deviates from or interprets the OPR, the deviation is stated explicitly, not buried.

---

## 3. Cx Plan

**Purpose.** The framework that governs the whole commissioning effort — scope, team,
schedule, and who owes what deliverable.

**Author.** **OCA** owns it (**Cx Engineer** assists with the systems list and test schedule).

**When.** Design phase; updated continuously through construction and into occupancy.

**Key sections/fields.** Cx scope and objectives; systems-to-be-commissioned list with the
level (L1–L5) each receives; team directory and roles/responsibility matrix; communication and
meeting cadence; document/deliverable schedule and ownership; Cx milestones tied to the
construction schedule; issues-management process; sampling strategy; acceptance and sign-off
process; templates index (checklists, FPT, IST that this plan governs).

**What "good" looks like.** Every system in scope has an assigned level and owner; the
schedule's Cx milestones are tied to real construction gates (not floating dates); the
roles matrix has no orphan responsibilities. The plan is current with the latest OPR/BoD.

---

## 4. Cx Specification (Division 01 91 00)

**Purpose.** The **contractual** commissioning requirements — the section of the project
specification that obligates contractors to participate in Cx, run checks, and support
testing. This is what makes Cx enforceable rather than advisory.

**Author.** **Cx Engineer** drafts it (with **Design Engineer**); it is embedded into the
bid/contract documents.

**When.** Late design, before tender — it *must* land in the contract before award, or the
work becomes a paid change order.

**Key sections/fields.** Cx scope and the contractor's role; submittal requirements feeding
Cx; pre-functional and start-up obligations; contractor responsibilities for test support
(labor, instruments, access, manipulation of equipment during FPT); the OCA's authority to
witness and direct tests; training and O&M-documentation deliverables; the Systems Manual
contribution; acceptance and payment-hold provisions tied to Cx completion.

**What "good" looks like.** Obligations are unambiguous and tied to payment milestones;
test-support duties are explicit (who provides ladders, loggers, and bodies on test day); it
references the Cx Plan and OPR rather than restating them. No gap where a contractor can claim
"that wasn't in our scope."

---

## 5. Submittal Review Record

**Purpose.** Documents the Cx review of contractor product submittals — confirming selected
equipment meets the OPR/BoD *before* it is purchased and installed (cheapest place to catch a
wrong selection).

**Author.** **OCA / Cx Engineer** reviews; record references the **Construction Manager**'s
submittal.

**When.** Construction phase, as submittals arrive (L1-adjacent).

**Key sections/fields.** Submittal ID and system; the OPR/BoD requirements the product must
satisfy; review findings (compliant / compliant-with-comment / rejected); third-party
certification basis (AHRI/Eurovent/AMCA — and confirmation that compared products use the
*same* test standard); impact on downstream test ports/metering; disposition and date.

**What "good" looks like.** Each review explicitly maps the product to the OPR/BoD criterion
it must meet, not just "approved." Certification standards are consistent across compared
products. Findings that affect testability (missing test ports, no trend points) are flagged
to the design team while change is still cheap.

---

## 6. Pre-functional / Installation Checklist

**Purpose.** Verifies a component was *received, installed, connected, and is ready for safe
start-up* — the L2 gate. One set per component plus ductwork/pipework/BMS.

**Author.** **Field Technician** executes; **OCA** reviews. (Templates come from the Cx Plan.)

**When.** Construction, as installation completes — before start-up (L3) and well before FPT.

**Key sections/fields.** Equipment tag and location; delivery/damage/quantity check against
submittal; mounting/clearance/access; mechanical, electrical, control connections verified;
cleanliness; pressure test (pipework) and leakage test (ductwork) **recorded before
insulation**; labeling; safeties in place; sign-off with name/date; deficiencies noted.

**What "good" looks like.** Every line is checked with a real observation, not pre-ticked.
Pressure/leakage tests are recorded *before* anything is wrapped (you can't retest it later).
Deficiencies route to the Issues Log rather than being silently fixed. The component is
genuinely ready for automatic operation before it is signed.

---

## 7. Start-up Report

**Purpose.** Records the manufacturer/contractor start-up of a component and its first
operational measurements — the L3 evidence that the unit runs correctly in design conditions.

**Author.** **Field Technician** / vendor performs; **OCA** assists the *first* start-up of
each equipment type to confirm method and instruments.

**When.** Construction → start-up phase, after the pre-functional checklist passes.

**Key sections/fields.** Equipment tag; start-up procedure followed and date; measured
operating parameters at design conditions (flows, temperatures, pressures, currents, speeds);
instrument list and **calibration status**; manufacturer start-up checklist attached;
anomalies and corrective actions; readiness-for-FPT statement.

**What "good" looks like.** Measurements are real field readings taken with **calibrated**
instruments and recorded on the data sheet, sat against design values. The unit is confirmed
ready for *automatic* operation. The first-of-type start-up shows OCA witness confirmation.

---

## 8. Functional Performance Test (FPT) Form

**Purpose.** The L4 procedure-and-record: dynamic, whole-system testing in automated mode with
explicit pass/fail acceptance criteria tied to the SOO.

**Author.** **Cx Engineer** authors the procedure; the team executes under **OCA** direction.

**When.** Occupancy/start-up phase, after L3 passes for all components in the system.

**Key sections/fields.** System under test and SOO reference; prerequisites and required
initial state; instruments (and calibration); step-by-step induced change; what to record and
*where* (BMS trend vs standalone logger vs field instrument); baseline values; max/min and
steady-state response; **acceptance criteria** (measured vs designed); pass/fail; deficiencies
routed to the Issues Log; witness signatures.

**What "good" looks like.** Acceptance criteria are numeric and tied to SOO/design values, set
*before* the test. The test forces a **real physical condition** rather than overwriting a BMS
sensor. Each step has a recorded result; a failed step generates an Issues Log entry, not a
quiet retest. The form is reproducible by a different technician.

---

## 9. Integrated Systems Test (IST) Script/Record

**Purpose.** The L5 procedure: verifies cross-system interactions that must work *together* to
meet the OPR — the failure-mode and interlock scenarios (utility loss, cooling-on-generator,
fire-alarm interlocks). This is where a data center's resilience claims are actually proven.

**Author.** **OCA** owns the script (**Cx Engineer** writes detail); whole team executes under
strict choreography.

**When.** Occupancy phase, after the relevant single-system FPTs (L4) pass.

**Key sections/fields.** Scenario name and OPR/BoD requirement under test; participating
systems and their expected coordinated response; precise step sequence and timing; trigger
(real, e.g. open the utility breaker, drop a CRAH); roles and who does what at each second;
data captured across systems (BMS + loggers); pass/fail per coordinated outcome; abort/safety
criteria and rollback; witness sign-off.

**What "good" looks like.** The script tests a *real* failure (pull the breaker), not a
simulated flag, and choreographs multiple systems with timing. Each scenario maps to a specific
OPR resilience target (e.g. "IT load rides through utility loss with supply air staying in
band"). It has explicit abort conditions to protect live load. Results are cross-referenced
across every system that participated.

---

## 10. Issues Log Entry

**Purpose.** The official running record of a single deficiency — its discovery, owner, and
resolution. The Issues Log is the project's continuous memory from design through year 1.

**Author.** **OCA** maintains the log; any agent can raise an entry.

**When.** Continuously, from design review through the 10-month review.

**Key sections/fields.** Issue ID; date raised and by whom; system/equipment tag; the source
document/test that surfaced it (design review, submittal, checklist, FPT, IST); description and
observed-vs-expected; severity/priority; **the OPR/SOO requirement it violates**; assigned
owner; corrective action; retest reference; status and closure date.

**What "good" looks like.** Each entry names the requirement it violates (traceable to OPR/SOO)
and the test that found it. Severity drives priority. Closure requires a *retest reference*, not
just "fixed." No entry is closed without verification. Open items at handover carry into the Cx
Report with a resolution plan.

---

## 11. Training Plan & Record

**Purpose.** Plans and then evidences the transfer of operating knowledge to the owner's staff —
purpose of each system, start-up/shutdown/seasonal changeover, alarms, troubleshooting,
emergencies.

**Author.** **Construction Manager** / vendors deliver; **OCA** reviews content and confirms it
landed; **Owner/FM** receives.

**When.** Handover phase; the *plan* is set earlier (it's a contract deliverable in 01 91 00).

**Key sections/fields.** Plan: systems and topics, audience, depth, schedule, materials,
competency check method. Record: session date, trainer, attendees, topics covered, materials
issued, assessment outcome, **recording/recording-link for future staff**, OCA confirmation.

**What "good" looks like.** Training maps to the Systems Manual and SOO. Every session is
**recorded and archived** so future staff can re-learn it. The OCA confirms comprehension, not
just attendance. Coverage matches the OPR's documentation/training expectations.

---

## 12. Systems Manual

**Purpose.** The **operations-focused composite** the owner runs the building from — broader
than any single equipment manual. It binds intent, design, control logic, as-built reality, and
commissioning evidence into one operating reference.

**Author.** **OCA** assembles (with **Construction Manager** + **Design Engineer**); handed to
**Owner/FM**.

**When.** Handover phase; updated through seasonal Cx and the 10-month review.

**Key sections/fields.** OPR and BoD (so operators know the *intent*); SOO/sequences; as-built
drawings; final set-points and balancing tables; Cx data and test results summary;
maintenance and **retest schedules**; training records; emergency/seasonal-changeover
procedures; references to the equipment O&M manuals.

**How it differs from the equipment O&M manual.** The **O&M manual** is *per-equipment* —
vendor cut-sheets, parts lists, and maintenance instructions for one device, authored by the
manufacturer/contractor. The **Systems Manual** is *system- and operations-level* — it explains
how the building is *meant to behave* and how to keep it there, and it *contains/references* the
O&M manuals as a subset. O&M tells you how to service the chiller; the Systems Manual tells you
why the plant is sequenced this way and what "in spec" means.

**What "good" looks like.** An operator can run, troubleshoot, and re-tune the building from it
without the original design team. It carries the OPR/BoD intent forward, includes retest
schedules (enabling ongoing Cx), and stays current with seasonal data.

---

## 13. Commissioning Report

**Purpose.** The OCA's independent sign-off: confirms (with evidence) that the building meets
the OPR/BoD, lists open items, and sets the resolution plan. The capstone of the chain.

**Author.** **OCA** signs (independent of design/construction/vendors — that independence is
what makes the report credible).

**When.** End of initial Cx; updated after seasonal Cx and the 10-month operational review.

**Key sections/fields.** Executive summary and overall conformance statement; scope and methods;
systems-by-system results referencing FPT/IST records; **OPR/BoD compliance matrix**
(requirement → evidence → met/not-met); open Issues Log items with owners and dates; deferred
seasonal/full-load tests; recommendations and the ongoing-Cx launch; appendices (checklists,
test forms, trend data).

**What "good" looks like.** Every OPR requirement appears in the compliance matrix with linked
evidence — nothing asserted without a test reference. Open items carry owners and dates. The
report is signed by an authority with no stake in the work it audits.

---

## 14. Traceability — why the chain must hold

The documents are not independent forms; they are **one continuous argument** that the building
does what the owner asked, each link verifiable against the one before it:

> **OPR** (anchor) → **BoD** satisfies it → **Cx Plan** schedules its verification → **Cx Spec
> (01 91 00)** makes that verification contractual → **SOO** encodes the control intent →
> **checklists/start-up** prove installation → **FPT/IST** prove integrated behavior against the
> SOO and OPR → **Issues Log** tracks every gap to closure → **Systems Manual** carries the
> intent into operations → **Cx Report** signs off the whole loop back to the OPR.

Every downstream document **cites upward**: a BoD assumption cites the OPR requirement it serves;
a submittal review cites the OPR/BoD criterion; an FPT acceptance criterion cites the SOO; an
Issues Log entry cites the requirement it violates; the Cx Report's compliance matrix cites the
OPR row by row. Cut any link and the chain stops proving anything — a passing test with no
requirement behind it proves only that *something* happened, not that the *right* thing did.

**Why the agents must preserve it when drafting.** When a CXPro agent instantiates any of these
templates, it must populate the upward reference, not leave it blank. The OCA agent's core
discipline is refusing to close a loop that doesn't trace to the OPR. If a requirement isn't
measurable in the OPR, fix the OPR first — every other document inherits that defect. The chain
*is* the product; the individual forms are just where it's written down.

---

### One-line takeaways for agent grounding
1. The OPR is the anchor — every document cites upward to it; if it's not measurable there, no template downstream can be filled honestly.
2. Each deliverable has one owning agent and a fixed slot in the lifecycle — don't draft the BoD before the OPR is stable, or the FPT before L3 passes.
3. "Good" always means *traceable and verifiable*: a number, a requirement reference, and a retest — never an adjective.
4. The Systems Manual is operations-level and contains the O&M manuals; don't confuse the two.
5. The Cx Spec (01 91 00) is what makes Cx enforceable — it must be in the contract before award.
6. Preserving the traceability chain is the OCA agent's prime directive; a passing test with no requirement behind it proves nothing.
