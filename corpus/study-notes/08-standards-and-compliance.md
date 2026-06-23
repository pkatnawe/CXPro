# 08 — Standards & Compliance Landscape

> **CXPro knowledge base — for agent grounding.** The standards, codes, and regulatory
> frameworks a commissioning agent must be aware of — framed as *what each one requires and how
> it shapes the work*, never as a reproduction of its text.
>
> Written in our own words, structured as *concept → why it matters → how it maps to CXPro*.
> **Role agents referenced:** OCA (Owner's Cx Authority), Cx Engineer, Design Engineer,
> Owner/FM, Construction Manager.
> **Levels:** L1 factory → L2 install → L3 start-up → L4 functional → L5 integrated.
> **Document chain:** OPR → BoD → Cx Plan → Specs/SOO → Checklists → FPT → Issues Log →
> Systems Manual → Cx Report.
> Cross-refs: [`01-commissioning-process.md`](01-commissioning-process.md) (the process the
> standards formalize), [`02-datacenter-systems-for-cx.md`](02-datacenter-systems-for-cx.md)
> (Tiers and L5), [`03-datacenter-operations-handover.md`](03-datacenter-operations-handover.md)
> (handover records).

---

## 0. The one rule that overrides all others — never embed standard text

**Concept.** Standards bodies publish copyrighted documents. CXPro and its agents must treat
those documents as *references to cite*, not *content to copy*. An agent answers a compliance
question by **naming the standard and the specific clause/section/table**, summarizing the
requirement **in its own words**, and then **pointing the user to their own licensed copy** to
read the exact wording.

**Why it matters.** Reproducing clause text — even a sentence — in the corpus, in a generated
report, or in a chat answer is a copyright violation and a liability for the owner whose name is
on the Cx Report. It also creates a subtler hazard: a paraphrase presented *as if* it were the
authoritative text invites someone to act on our wording instead of the controlling document.
The standard governs; our note merely orients.

**CXPro mapping.** Hard rule for every agent. The **OCA** and **Design Engineer** own
compliance interpretation, but *no* agent may paste standard text into any artifact. The
correct output shape is: *"<Standard> <clause> requires <our-words summary>; confirm against
your licensed copy of <Standard> before relying on it."* If an agent cannot cite a clause, it
flags the gap rather than inventing a requirement. Treat this as a guardrail equal in weight to
"everything traces to the OPR."

---

## 1. The commissioning-process standard family — what the OPR→BoD→test→document flow formalizes

**Concept.** There is a family of consensus standards and guidelines that define commissioning
as a *process* rather than a single test. The foundational guideline (commonly referenced as the
"Guideline 0" of the field) establishes the generic, all-systems commissioning process; a
companion *standard* (the "202"-numbered process standard) makes that process mandatory-language
and auditable. What they formalize is exactly the spine described in `01-commissioning-process.md`:

1. Capture the owner's intent as measurable **Owner's Project Requirements (OPR)**.
2. Have the designer record how the design satisfies that intent in the **Basis of Design (BoD)**.
3. Verify *through the project* — design review, submittal review, installation and pre-functional
   checks, then **functional performance testing** against the OPR/BoD.
4. Document everything in an unbroken, traceable record ending in a **Cx Report** and a
   **Systems Manual**, plus training and a post-occupancy review.

**Why it matters.** These documents are the reason "commissioning" means the same thing across
projects. They define roles, independence, the deliverable chain, acceptance, and the idea that a
requirement which isn't *verifiable in the OPR* can't be commissioned later. They are descriptive
of process, not prescriptive of HVAC numbers — that is what the technical companions are for.

**CXPro mapping.** This family is the **OCA agent's procedural backbone** and the literal source
of the CXPro document chain. When the OCA structures a Cx Plan or defends the order of operations
(why L3 gates L4), it is enacting this process standard. Cite it by guideline/standard number and
section; summarize; defer to the licensed copy.

---

## 2. Technical companions for HVAC commissioning

**Concept.** Sitting beneath the generic process are technical guidelines aimed specifically at
**existing-building / HVAC&R commissioning** and at *retro-* and *ongoing* commissioning. Where
the process standard says "verify functional performance," these companions get concrete: how to
write functional test procedures, what to measure on air and water systems, sampling strategy for
many identical units, sensor calibration before testing, and the difference between *active* tests
(force a condition) and *passive* tests (analyze trended data). They also define the persistence
side — monitoring-based and ongoing commissioning so performance doesn't drift.

**Why it matters.** A commissioning agent's *test design* lives here. The worked HVAC patterns in
`01-commissioning-process.md` (VAV room-temp response, chilled-water load drop, fire-damper
interlock) are the kind of procedure these companions standardize. They are also where the rule
"create a real physical condition, don't just overwrite the BMS value" comes from.

**CXPro mapping.** **Cx Engineer agent** territory. When the Cx Engineer authors an FPT script or
chooses a sampling rate, it should be able to cite the relevant technical guideline as the basis —
again summarized, never reproduced. For data centers, remember our override: cooling-critical
units are *not* sampled (see `02-datacenter-systems-for-cx.md`).

---

## 3. LEED commissioning — Fundamental vs Enhanced

**Concept.** Green-building rating systems (LEED is the dominant one) require commissioning as a
*prerequisite* and reward more of it as a *credit*. Two tiers matter:

| Tier | Status | Independence required | Scope it implies |
|---|---|---|---|
| **Fundamental Cx** | Prerequisite (must-have to certify) | Cx authority may be reasonably independent; on smaller projects can be a qualified member of the design/construction team but not the person who did the work under review | Energy-related systems: HVAC&R, lighting/controls, domestic hot water, renewables. Review OPR/BoD, develop Cx requirements, verify installation and performance, produce a Cx report. |
| **Enhanced Cx** | Optional credit (extra points) | **Independent** Cx authority, engaged early; not an employee of the designer or contractor on that project | Adds early design review, deeper systems-manual and operator-training verification, ongoing-commissioning planning, and (in higher options) envelope commissioning and monitoring-based Cx. |

**Why it matters.** The tier the owner is chasing changes the OCA's *scope and independence*, not
just a checkbox. Enhanced Cx is essentially "do the full process standard, prove independence, and
extend into operations" — which aligns neatly with how CXPro already models the OCA.

**CXPro mapping.** **Owner/FM agent** decides the target tier (it has a credit/cost consequence);
**OCA agent** must then assert the matching independence and scope. If the project targets Enhanced
Cx, the OCA cannot also be wearing a design or construction "hat" — the same clean-hats rule from
`01`. Cite LEED by version and credit/prerequisite name; describe requirements in our words.

---

## 4. Building & energy codes and AHJ acceptance — why the code path gates occupancy

**Concept.** Separate from voluntary standards are **mandatory codes** — building codes, energy
codes (e.g. the ASHRAE 90.1-style energy standard adopted into law, or local equivalents), fire
and life-safety codes — enforced by an **Authority Having Jurisdiction (AHJ)**. Many energy and
mechanical codes now *require* commissioning of larger HVAC and lighting systems as a condition of
the **certificate of occupancy**. The AHJ's acceptance tests (e.g. life-safety smoke-control
verification, electrical inspection, fire-alarm acceptance) are a parallel, legally binding track.

**Why it matters.** Voluntary Cx improves performance; **code acceptance grants the right to
occupy.** They overlap but are not the same authority — an FPT that satisfies the OPR does not
satisfy the AHJ unless the AHJ's specific acceptance test was witnessed and signed. The code path
is a *gate*: fail it and the building legally cannot open, regardless of how well it performs.

**CXPro mapping.** **Design Engineer agent** owns code-compliance interpretation (which code
edition is adopted locally, what it mandates for these systems); the **OCA agent** must *schedule
and align* Cx functional tests with the AHJ's acceptance tests so they aren't run twice or in
conflict — for example, the fire-damper/fan interlock (an L5 integrated test) often doubles as a
life-safety acceptance test. Always pin the **adopted edition** of a code, because jurisdictions
adopt different years; cite edition + section, summarize, defer to the official copy.

---

## 5. Uptime Institute Tiers I–IV — redundancy and what they demand of integrated testing

**Concept.** The Uptime Institute Tier classification rates a data center's **topology** by how
much it can sustain without dropping the IT load. The progression (described in our own words):

| Tier | Redundancy character | Maintainability / fault tolerance | What it demands of L5 testing |
|---|---|---|---|
| **Tier I** | Basic capacity, single non-redundant path | No redundant components; any failure or maintenance event risks downtime | Prove the single path starts and carries load. |
| **Tier II** | Redundant *components* (e.g. N+1 UPS, generators), still a single distribution path | Survives some component failures, but path maintenance still risks the load | Test component failover; the path is still a single point. |
| **Tier III** | **Concurrently maintainable** — redundant components *and* multiple paths, one active | Any single capacity component or distribution path can be taken offline for maintenance with **no impact** on the IT load | Integrated testing must prove you can isolate and service *any one path/component* while load runs — a maintenance-mode L5 scenario. |
| **Tier IV** | **Fault tolerant** — multiple active paths, full redundancy, compartmentalized | Any *single unplanned failure* (including a path) is sustained automatically with no load impact | L5 must prove automatic ride-through of single faults on *each* system independently, plus compartmentalization. |

**Why it matters.** The Tier sets the **redundancy topology** (N / N+1 / 2N — see
`02-datacenter-systems-for-cx.md` §1.4) which in turn *defines the failure scenarios the OCA must
test*. You cannot claim a Tier without demonstrating it under test: Tier III means you actually
took a path offline with load live; Tier IV means you actually injected a single fault and the load
never blinked. Tier is a *commissioning obligation*, not just a design label.

**CXPro mapping.** **Design Engineer agent** designs to a Tier; **OCA agent** must derive the L5
integrated-test matrix *from* that Tier and witness it (utility-loss → generator → UPS ride-through;
loss-of-cooling; concurrent-maintenance isolation). Cite Uptime by Tier number and the
specific objective; describe the requirement in our words. Note that Uptime certifies against its
own program — our note orients the test design, it does not replace their certification.

---

## 6. The regulated / pharma expansion — CQV, IQ/OQ/PQ, and 21 CFR Part 11

**Concept.** When CXPro moves beyond data centers into **regulated environments** (pharma, life
sciences, GMP facilities), commissioning becomes the front half of a wider **CQV** discipline:
**Commissioning, Qualification, and Validation.** Commissioning still verifies the engineered
systems work; **Qualification** then *documents, with regulatory rigor, that they are fit for
GxP use*, in the classic sequence:

| Stage | Question it answers |
|---|---|
| **IQ** — Installation Qualification | Was it installed correctly, to spec, with the right materials, calibration, and documentation? |
| **OQ** — Operational Qualification | Does it operate across its full intended range, including alarms and limits? |
| **PQ** — Performance Qualification | Does it perform reliably and reproducibly *under real process conditions* over time? |

A risk-based "commissioning and qualification" approach lets well-documented commissioning work
**leverage into** qualification rather than repeating it — which is exactly where CXPro's
traceable document chain becomes an asset.

**21 CFR Part 11** is the US FDA rule governing **electronic records and electronic signatures**.
In our own words, it requires that electronic records be **trustworthy, attributable, and
tamper-evident**: validated systems, secure access controls, **audit trails** that capture who did
what and when (and that cannot be silently altered), record retention and retrieval, and
**electronic signatures** that are uniquely bound to an individual and to the record they sign.

**Why it matters.** In a regulated facility the *record* is the deliverable. An IQ/OQ/PQ result is
only acceptable if its provenance is provable. This is precisely the kind of record integrity CXPro
already produces — but Part 11 raises the bar from "good practice" to "legally required," with audit
trails and signatures as first-class features rather than nice-to-haves.

**CXPro mapping.** This is the **strategic reason CXPro's audit trail matters.** The Issues Log,
test records, and signed Cx Report already form a chain of custody; in a Part 11 context that chain
must be *attributable, time-stamped, access-controlled, and tamper-evident* by design. The **OCA**
owns the qualification record and signature integrity; the **Design Engineer** maps system
requirements to IQ/OQ/PQ test items. As always: cite Part 11 by section (and the relevant GxP /
validation guidance by name and clause), summarize the requirement in our words, and direct the
user to the official regulation — never paste it.

---

## Bottom line for the agents

1. **Cite, don't copy.** Name the standard and clause, summarize in our words, point to the user's
   licensed copy. No standard text in the corpus or in answers — ever.
2. **Process vs technical vs code vs Tier are different layers.** The process standards shape the
   *document chain*; the HVAC companions shape *test procedures*; codes/AHJ gate *occupancy*;
   Uptime Tiers gate the *L5 failure matrix*.
3. **Independence scales with the credit.** LEED Enhanced Cx and code-required Cx both demand the
   OCA keep clean hats.
4. **A Tier is a test obligation, not a label** — claim it only after witnessing the matching
   failure/maintenance scenario.
5. **In regulated work the record is the product.** Part 11 makes CXPro's audit trail a compliance
   feature: attributable, tamper-evident, signed.
6. **Ownership:** Design Engineer interprets code/Tier/qualification requirements; OCA owns the
   compliance verification, the independence posture, and the integrity of the signed record.
