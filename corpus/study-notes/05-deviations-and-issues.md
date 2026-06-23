# Deviations & Issues — Study Notes

> **CXPro knowledge base — for agent grounding.** Our working notes on how a commissioning
> deviation moves from the moment a test step fails to the moment it is verified closed — the
> severity taxonomy, the lifecycle state machine, root-cause categories, routing rules, the
> record fields, escalation, closeout, and the Issues Log roll-up. Written in our own words and
> framed for CXPro's use case: AI agents that play commissioning roles on data-center projects.
> Each entry follows *concept → why it matters → how it maps to CXPro*.
>
> **Role agents (shared with notes 01–03):** OCA (Owner's Cx Authority — independent, reviews
> and signs, owns the Issues Log), Cx Engineer (writes/executes tests, triages deviations),
> Construction Manager (schedule, coordinates fixes), Field Technician (executes tests, raises
> findings), Design Engineer (BoD/SOO/RFIs), Owner/FM (OPR, inherits the building).
> **Commissioning levels:** L1 factory → L2 install → L3 start-up → L4 functional → L5 integrated.
> **Document chain:** OPR → BoD → Cx Plan → Specs/SOO → Checklists → FPT → Issues Log →
> Systems Manual → Cx Report.

---

## 1. What a deviation is (and when one is raised)

**Concept.** A *deviation* (we use the words deviation, issue, finding, and deficiency
interchangeably as states of one record) is any observed gap between *required behaviour* and
*actual behaviour*. "Required" is whatever the document chain says it should be: a checklist
acceptance line, an SOO set-point or sequence, an FPT pass/fail criterion, or — ultimately — the
OPR. A deviation is raised the moment that gap is observed. There are three classic triggers:

- **A failed FPT step** — a functional or integrated test step whose measured response does not
  meet its acceptance criterion (chillers don't stage down on load drop; a fire damper doesn't
  close on alarm).
- **A non-conformance** — a checklist or installation item that does not match the submittal,
  spec, or manufacturer requirement (uninsulated chilled-water run, miswired sensor, the wrong
  pump model delivered).
- **A design conflict** — a contradiction *inside* the documents themselves, surfaced during
  design or submittal review (the SOO calls for an economizer the BoD never sized for; two
  sequences command the same damper in opposite directions).

**Why it matters.** Commissioning is only as valuable as the deficiencies it catches and the
discipline with which it drives them to closure. An untracked observation is worthless — worse,
it creates false confidence. The whole point of a structured deviation process is that *nothing
relies on memory* and *nothing waits for the end of the project*.

**CXPro mapping.** Any agent can be the *source* of a deviation — the Field Technician and Cx
Engineer raise most of them at L2–L5, the OCA raises them during design/submittal review, and
the Cx Engineer surfaces design conflicts at L1. But there is exactly one **owner of the record
itself: the OCA**, who owns the Issues Log end to end. Raising a deviation is a first-class
action in CXPro, not a comment on a test — see note 04 on test execution.

> **Raise it the instant it fails.** A deviation is created at the failing step, in the field,
> with evidence captured then and there. We never batch findings to a weekly write-up — the
> condition (and the chance to capture clean evidence) is gone by then.

## 2. Severity taxonomy

**Concept.** Severity answers "how much does this matter, and how fast must it move?" We use
three tiers. Severity is about *consequence*, not about how hard the fix is.

| Severity | Definition | Examples | Consequence it implies |
|---|---|---|---|
| **Critical** | Defeats a core OPR guarantee — life-safety, redundancy/uptime, or the ability to test further. Blocks the level. | Fire/smoke interlock fails on alarm (L5); loss of N+1 — a single failure drops cooling; a UPS fails to hold load on utility loss; a fault that *prevents* the rest of the FPT from running. | **Blocks closeout of the level and handover.** Escalates immediately. Often gates dependent tests. |
| **Major** | System does not meet a measurable design/SOO target, but life-safety and redundancy hold. Performance, efficiency, or sequence is wrong. | Chilled-water plant doesn't reset differential pressure correctly; fan tracking off-design wasting energy; economizer never enables; alarm not configured. | **Must be resolved and re-tested before the Cx Report can sign that system.** Tracked on the critical path. |
| **Minor** | Cosmetic, documentation, or low-impact deviation that doesn't affect performance or safety. | Mislabelled valve, missing as-built mark-up, trend interval set to 15 min instead of 5, untidy cable dressing. | **Logged and scheduled; may be punch-listed.** Does not by itself block handover but must still be closed and recorded. |

**Why it matters.** Severity drives *routing speed and escalation*. It tells the Construction
Manager what to schedule first and tells the Owner/FM what stands between them and the building.
Mis-rating a critical as a minor is the single most dangerous error in the process.

**CXPro mapping.** The Cx Engineer agent proposes a severity at raise-time using the rule
*"which OPR guarantee does this threaten, and does it block a level or a downstream test?"* A
human (OCA for critical/major) confirms before the rating sticks. When in doubt the agent rates
*up*, never down.

## 3. The lifecycle state machine

**Concept.** Every deviation is a record that moves through a defined set of states. The happy
path is left-to-right; the side states handle the real world.

```
            ┌──────────► rejected
            │            (not a real deviation)
            │
 open ──► assigned ──► in-progress ──► resolved ──► verified / re-tested ──► closed
            │                              ▲
            │                              │ (re-test fails → reopen)
            ├──────────► duplicate         │
            │            (merge to primary)│
            └──────────► deferred ─────────┘
                         (e.g. needs full load → year 1)
```

| State | Meaning | Who acts |
|---|---|---|
| **open** | Raised, evidence attached, awaiting triage/ownership. | Cx Engineer triages |
| **assigned** | Severity set, root-cause hypothesized, owner assigned. | OCA / Cx Engineer |
| **in-progress** | The owning party is actively fixing it. | Contractor / Design / Vendor |
| **resolved** | Owner claims it is fixed — **a claim, not a fact**. | Owning party |
| **verified / re-tested** | The originating step (or fuller test) has been re-run and now passes. | Cx Engineer / Field Tech |
| **closed** | Verified and signed off; rolled into the Issues Log history. | OCA signs |
| **rejected** | On review, not an actual deviation (test error, mis-read instrument, within tolerance). | OCA / Cx Engineer |
| **duplicate** | Same underlying defect as an existing record; merged into the primary. | Cx Engineer |
| **deferred** | Real and valid but cannot be tested now (e.g. needs full IT load, or a season). Stays open with a scheduled trigger. | OCA, with Owner/FM |

**Why it matters.** The state machine is what makes status *computable*: "how many critical are
open?", "what is blocking L5 sign-off?", "what's left before handover?" all become queries, not
meetings. The single most important rule lives here: **resolved ≠ closed.**

**CXPro mapping.** CXPro models the deviation as a small state machine on the Issues Log.
Transitions are role-gated — only the OCA agent can move a record to **closed**, and only after a
**verified/re-tested** transition exists with a real re-test result attached. A *resolved* claim
from a contractor never auto-closes anything.

## 4. Root-cause categories

**Concept.** Every closed deviation should be tagged with *why* it happened. We use six
categories (these mirror the deficiency families in note 01 §9):

| Root cause | What it means | Typically owned by |
|---|---|---|
| **Design fault** | Wrong concept or sequence in the SOO/BoD. | Design Engineer |
| **Selection / sizing** | Right idea, wrong-sized or wrong-selected equipment (oversized chiller short-cycling). | Design Engineer / Vendor |
| **Manufacturing / early failure** | Component defective or failed prematurely out of the box. | Vendor (warranty) |
| **Installation** | Built wrong: miswiring, leaks, missing insulation, dirty coils. | Contractor |
| **Tuning / controls** | Bad set-points, mis-sequenced staging, alarms not configured. | Contractor (controls) / Design |
| **Abnormal use** | Real load/occupancy diverges from design assumptions. | Owner/FM |

**Why it matters.** Root cause is what routing keys off (next section), and it's the data that
makes the Cx Report and ongoing-Cx program *learn*: a cluster of "tuning/controls" findings says
the BMS programming was rushed; a cluster of "selection/sizing" says the design needs a hard
look. Symptom ≠ cause — "room won't cool" could be design, install, or tuning.

**CXPro mapping.** The Cx Engineer agent hypothesizes a root-cause category at triage from the
test evidence, but it is held as a *hypothesis* until the fix confirms it. The closed record
carries the *confirmed* cause, which feeds the roll-up analytics.

## 5. Routing & ownership rules

**Concept.** Who fixes a deviation follows from its root cause, not from who found it. The
heuristic:

- **Design fault / design conflict → Design Engineer**, via an RFI. Resolution is a revised SOO,
  BoD clarification, or formal direction — *then* a re-test.
- **Installation / tuning → Contractor**, coordinated by the Construction Manager. Most L2–L4
  findings live here.
- **Manufacturing / early failure → Vendor**, under warranty, with the Construction Manager
  managing the replacement logistics and schedule.
- **Selection / sizing → Design Engineer to adjudicate** (was it specified wrong, or installed
  off-spec?), often shared with the vendor.
- **Abnormal use → Owner/FM**, who either corrects the operating assumption or accepts and
  updates the OPR.

The OCA stays **independent**: it routes, witnesses, and verifies — it never owns the fix. The
Construction Manager is the schedule hub that turns "assigned" into "in-progress" on the ground.

**Why it matters.** Clean ownership prevents the two failure modes of issue management:
ping-pong (no one owns it) and capture (the party who caused it grades its own fix). Routing by
root cause keeps the OCA's hat clean.

**CXPro mapping.** CXPro encodes this routing table so the Cx Engineer agent can *propose* an
owner at assign-time. A human confirms the assignment; the OCA agent retains veto, because a
wrong route burns days on the critical path.

## 6. Anatomy of a high-quality deviation record

**Concept.** A deviation is only as useful as the record behind it. A complete record carries:

| Field | Why it's required |
|---|---|
| **ID** | Stable handle for cross-reference (FPT, Cx Report, handover). |
| **System / asset** | The specific unit and its place in the systems list (e.g. CH-02, AHU-14). |
| **Source test / step** | The checklist line, FPT step, or review comment that surfaced it — traces back up the document chain. |
| **Severity** | Critical / major / minor, with the OPR guarantee it threatens. |
| **Description** | Required vs actual behaviour, in plain terms. |
| **Evidence** | Trend export, photo, instrument reading, BMS screenshot — captured *at raise-time*. |
| **Owner** | The party responsible for the fix, per routing. |
| **Root-cause category** | Hypothesized at triage, confirmed at closeout. |
| **Resolution** | What was actually done. |
| **Re-test result** | The proof: the re-run step now passes, with new evidence. |
| **State + history** | Current state and the timeline of transitions (audit trail). |

**Why it matters.** These fields are exactly what the Issues Log needs to roll up, what the Cx
Report needs to defend a sign-off, and what the Owner/FM needs to inherit a building they can
trust. A record missing *evidence* or *re-test result* cannot legitimately close.

**CXPro mapping.** This field set is the deviation schema in CXPro. The two fields agents most
often under-fill — *evidence* and *re-test result* — are the two CXPro makes mandatory gates: no
evidence, can't leave *open*; no re-test result, can't reach *closed*.

## 7. Escalation triggers

**Concept.** A deviation escalates (to the OCA, then to the Owner/FM) when it threatens the
project, not merely the system. Triggers:

- Any **critical** severity, automatically and immediately.
- A **major** that lands on the critical path or blocks a level gate (can't start L5 until it
  clears).
- A finding **aged past its target** in *in-progress* without movement (stalled fix).
- A **rejected/route dispute** — the owning party contests that it's their fix or that it's a
  real deviation.
- A **cluster** — repeated findings of the same root cause pointing at a systemic problem.

**Why it matters.** Escalation is how the process protects the schedule and the OPR before the
end of the job. Silent aging of a critical finding is the failure the whole system exists to
prevent.

**CXPro mapping.** CXPro fires these as alerts on the Issues Log to the OCA agent (and, for
critical/path-blocking, surfaces them to the Owner/FM). The agent drafts the escalation; a human
owns the conversation that follows.

## 8. Closeout & verification criteria

**Concept.** A deviation is **closed only when the originating condition has been re-tested and
now passes**, with fresh evidence attached. The closeout checklist:

1. Owner reports *resolved* (a claim).
2. The source step — or a fuller test, if the fix could affect neighbours — is **re-run**.
3. Re-test **passes** against the original acceptance criterion → *verified/re-tested*.
4. Root cause confirmed; resolution and re-test evidence attached.
5. OCA signs → *closed*. A **failed re-test reopens** the record (back to in-progress).

For *deferred* items (need full load or a season), the record stays open with an explicit
re-test trigger and is carried into the Systems Manual and year-1 program — it is *not* a
closeout.

**Why it matters.** This is the integrity line of the whole discipline. "Contractor says it's
fixed" closes nothing. A change to one system can break a neighbour, which is why critical/L5
fixes re-run the *integrated* test, not just the failed step.

**CXPro mapping.** CXPro enforces this as the hard gate of §3: the *closed* transition is
unreachable without an attached passing re-test, and only the OCA agent can take it.

## 9. The Issues Log roll-up — status & handover

**Concept.** The Issues Log is the official running record of every deviation, owner, and
resolution, from design through year-1. Because every record is structured and stateful, the Log
*rolls up* into the answers the project actually asks: open-by-severity, open-by-system,
what-blocks-this-level, aging, and root-cause distribution. At handover it becomes the honest
ledger — closed items prove the building was verified; remaining open/deferred items become the
Cx Report's outstanding-items list with a resolution plan, and feed the year-1 and ongoing-Cx
work.

**Why it matters.** The Log is the bridge from execution to handover. A clean, queryable Log is
the difference between an Owner/FM inheriting a *known* building and inheriting a pile of
unverified claims.

**CXPro mapping.** The OCA agent owns the Log; the roll-ups are live views, not a manual report.
The Cx Report's open-items section and the Systems Manual's retest schedule both generate from
it. See note 03 on operations & handover for how the Owner/FM inherits this.

---

## 10. AI triage (how the Cx Engineer agent works a deviation)

**Concept.** When a deviation lands *open*, the Cx Engineer agent runs a triage pass:

1. **Classify severity** — from the rule in §2: which OPR guarantee does this threaten, does it
   block a level or a downstream test? Rate up when unsure.
2. **Hypothesize root cause** — map the symptom to one of the six categories in §4 using the test
   evidence and the SOO (e.g. "stages don't drop on load decrease, valves modulating correctly →
   tuning/controls, not install").
3. **Propose an owner & route** — apply the §5 routing table (design→RFI, install/tuning→contractor,
   early failure→vendor).
4. **Draft the record** — fill description, link source step, attach evidence, suggest the re-test.

**Why it matters.** Triage is the slow, repetitive, judgement-light-but-context-heavy work that
agents do well and that humans skip when tired — which is exactly when criticals get mis-rated.

**CXPro mapping — human always confirms.** The agent *proposes*; a human *confirms* before any
consequential transition: severity (OCA for critical/major), assignment/route, and every
*closed*. The agent is fast and consistent; the human is accountable. The agent never escalates a
record's authority beyond *assigned* on its own, and it never closes a deviation.

---

### One-line takeaways for agent grounding
1. A deviation is raised the instant a step fails — in the field, with evidence — never batched.
2. Severity is about consequence (OPR guarantee + does it block a level), not difficulty; rate up when unsure.
3. **Resolved ≠ closed.** Nothing closes until the originating step is re-tested and passes.
4. Route by *root cause*, not by who found it; the OCA routes and verifies but never owns the fix.
5. Two fields are non-negotiable gates: *evidence* (to open) and *re-test result* (to close).
6. The agent triages — classify, hypothesize, route — but a human confirms every consequential move, and only the OCA closes.
