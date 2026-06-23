# Commissioning Agent Evaluation — Dataset Plan

How we build the datasets that measure whether CXPro's role agents actually *understand* commissioning — not just sound fluent. This plan pairs with the evaluation section of `docs/business-overview/agent-training.html` (the acceptance bars) and grounds on the knowledge base in `../study-notes/`. External data we can use is cataloged in `dataset-catalog.md`.

## The core finding that shapes everything

There is **no public commissioning-specific QA or reasoning benchmark.** Rich public data exists for *adjacent* tasks — labeled HVAC faults, BAS point metadata, thermal comfort, building telemetry — and there's a large body of *real-project public commissioning documents* (government & university specs, OPR templates, RFPs). But nothing tests functional-performance-testing logic, sequence-of-operations verification, OPR→BoD traceability, deviation triage, or point-to-point checkout.

**So the strategy is two-track:**
1. **Build our own** commissioning QA + reasoning benchmark (the gap) — from our knowledge base, public exam blueprints, and public real-project documents.
2. **Borrow existing open datasets** for the technical sub-skills that *do* have public ground truth (fault detection, point semantics, comfort, control sequences).

## Principles

- **Bias toward HARD, MULTIMODAL problems.** An easy benchmark a model already passes tells us nothing. We deliberately weight CxBench toward problems that are *hard* (multi-hop reasoning, cross-document, expert-level, contamination-resistant) and *multimodal* (the answer requires reading a drawing, schematic, one-line, or schedule — not just text). The document-intelligence track (`cxbench/document-intelligence.md`) is where the hardest, most differentiating problems live, and it gets the most investment. See "Hardness" below.
- **Test understanding, not recall.** Prefer tasks where the agent must reason over a document or signal, cite evidence, and reach a verdict — over trivia.
- **Every eval mirrors a real agent job.** Each suite maps to a role agent and a step in the commissioning process (see `../study-notes/06-roles-and-agent-playbooks.md`).
- **Grade the citation, not just the answer.** A right answer with a wrong/absent citation fails — that's the product's trust promise.
- **Held-out and versioned.** Golden sets are frozen, versioned, and never used as grounding corpus (no train/test leakage).
- **Human-verified ground truth.** Every item is checked by someone who knows commissioning before it can fail an agent.
- **License-clean.** Build-our-own items are our IP. Borrowed datasets are used per license (see catalog); `CC BY-NC-ND` sets are eval-only and never redistributed.

---

## Hardness — what we optimize for

A benchmark is only useful while it's *unsaturated*. CxBench is deliberately built hard, and we retire
items as models master them. Every item carries a `difficulty` tag, and each suite ships a **hard split**
that the headline numbers are reported on.

What "hard" means here (an item should hit one or more):
- **Multi-hop** — the answer requires chaining several facts (e.g. read a value off a schedule → look up its sequence → judge whether a test step is correct).
- **Cross-document / cross-sheet** — requires reconciling the spec, the drawing, the schedule, and the submittal; the single-page lookup is the easy version.
- **Cross-modal** — the answer is only in a drawing, one-line, P&ID, or schedule image — *not recoverable from text*. These are weighted highest.
- **Non-answerable / discrepancy** — the correct response is "this is missing / these two documents disagree / cannot be determined" (the real design-review job). Tests calibration, not just recall.
- **Adversarial distractors** — plausible wrong options that a fluent-but-shallow model picks; numbers that are close but off; a legend that overrides the default symbol.
- **Contamination-resistant (GPQA-style)** — answerable from the artifact by an expert, but *not* from web priors; a web-equipped non-expert should still fail.

How we keep it hard:
- Track a **human-expert baseline** and a **web-equipped non-expert baseline** per suite; a good item has a wide gap between them.
- Report inter-annotator agreement (κ) on the hard split so "hard" doesn't just mean "ambiguous."
- **Retire saturated items** (>95% top-model accuracy) into an archived easy split; keep the live benchmark at the frontier.
- **Multimodal-first investment:** the document-intelligence suites (drawings/one-lines/P&IDs/schedules) are the hardest and the most differentiating, so they get the largest share of authoring effort and the toughest acceptance scrutiny.

## The evaluation suites

Eight suites, each tied to an agent capability, a data source, a grading method, and a starting acceptance bar (bars align with `agent-training.html`).

| # | Suite | What it tests | Primary agent(s) | Data source | Build vs borrow |
|---|---|---|---|---|---|
| 1 | **Knowledge QA** | Core Cx concepts, process, vocabulary, standards-awareness | All | KB + public exam blueprints | **Build** |
| 2 | **Procedure generation** | Draft a correct, cited FPT from a spec/SOO | Cx Engineer | Public 01 91 00 specs + SOO + reference FPT forms | **Build** (gold from public forms) |
| 3 | **Sequence verification** | Given an SOO + telemetry, is behavior correct? identify the fault in the logic | Cx Engineer, Design Engineer | OpenBuildingControl G36, Google sbsim, Mortar | **Borrow** + label |
| 4 | **Fault detection & deviation triage** | Detect a fault, classify severity, hypothesize root cause, route it | Cx Engineer, OCA | LBNL FDD, Drexel/ORNL AHU/VAV faults, CSIRO | **Borrow** (labeled) |
| 5 | **Document traceability** | OPR↔BoD↔test consistency; is an OPR target testable? | OCA, Design Engineer | Harvard/U-Mich/Milwaukee OPR & Cx-plan docs | **Build** from public docs |
| 6 | **Standards & compliance** | Cite the right clause/standard without reproducing text; Tier/redundancy reasoning | OCA, Design Engineer | Our `08-standards-and-compliance.md` + public guides | **Build** |
| 7 | **Citation faithfulness & refusal** | Does each claim trace to a real supporting chunk? does it refuse out-of-corpus questions? | All | Adversarial set over KB + Layer B | **Build** |
| 8 | **Retrieval / point semantics** | Find the right chunk; classify a BAS point ("what is this?") | All; Field Tech | BTS/DIEF, Project Haystack, Mortar | **Borrow** (has tasks) |

### Document-intelligence track (drawings, schematics, schedules)

Suites 1–8 above test *reasoning over text and structured knowledge*. Reading the **design package
itself** — equipment schedules, MEP drawings, electrical one-lines, P&IDs, control diagrams, BIM — is a
separate, multimodal problem with its own eight suites (sheet classification, schedule extraction, symbol
spotting, one-line/P&ID **connectivity**, drawing VQA, sequence extraction, localization/inventory, and
the flagship cross-document **design-review** consistency suite). Because *no public benchmark exists* for
engineering-drawing or commissioning document intelligence, we borrow proven metrics (ANLS\*, TEDS, symbol
mAP + edge accuracy, box-grounded Acc@IoU) and build the content from public-domain BIM/details, open
symbol/graph datasets, and our own annotated + synthetic drawings. Full design: **`cxbench/document-intelligence.md`**; data & licenses in **`dataset-catalog.md` Part 3**.

### Suite detail (construction + grading)

**1 · Knowledge QA (build).** ~50 items per role (300 total), multiple-choice + short-answer, generated from `../study-notes/` and styled on the public sample questions (AEE CBCP and BCCB CCP free samples) and the published exam blueprints — *style and coverage only; we author original questions.* Tag each item by role, commissioning level, and document. **Grade:** exact-match (MCQ) + LLM-judge with human audit (short-answer). **Bar:** ≥85% per role, and the agent must cite a KB source for short answers.

**2 · Procedure generation (build).** Input: a public 01 91 00 spec section + a sequence of operation for one system. Task: draft the FPT (objective, prerequisites, steps, acceptance criteria) with citations. Gold reference: the structure of real public FPT forms (ENERGY STAR checklist, GSA forms, U-Mich/ACG samples). **Grade:** rubric-based LLM-judge (coverage of prerequisites/steps/acceptance + citation presence) + human spot-check against `../study-notes/04-functional-test-library.md`. **Bar:** ≥70% human-accept rate, 100% of steps cited.

**3 · Sequence verification (borrow+label).** Use OpenBuildingControl Guideline-36 reference sequences as "correct" ground truth and Google sbsim / Mortar telemetry as behavior. Inject a sequence error (e.g. economizer disabled, reset schedule wrong); ask the agent to identify whether behavior matches the intended SOO and where it diverges. **Grade:** against the injected label. **Bar:** ≥80% correct identification.

**4 · Fault detection & deviation triage (borrow).** Feed labeled fault windows (LBNL FDD across 7 system types; Drexel/ORNL AHU & VAV faults — eval-only, NC-ND). Agent must: detect fault Y/N, name the fault class, assign severity, hypothesize a root-cause category, and route per `../study-notes/05-deviations-and-issues.md`. **Grade:** detection/classification vs label; severity & routing vs a human-authored rubric. **Bar:** ≥90% detection, ≥75% correct class, severity within one level.

**5 · Document traceability (build).** From public OPR templates/worked OPRs (Harvard, U-Mich, Milwaukee) and Cx plans, construct items: "is this OPR target measurable/testable?", "does this BoD statement satisfy this OPR clause?", "which document should contain X?". **Grade:** human-authored keys + LLM-judge. **Bar:** ≥85%.

**6 · Standards & compliance (build).** Items on what a standard *requires* and which to cite — answered by **reference, never reproduction** (the agent should name the clause and say "see the licensed copy"). Includes Uptime Tier → integrated-test-obligation reasoning. **Grade:** key + a hard check that the answer contains no verbatim standard text. **Bar:** ≥85%, and **zero** reproduced copyrighted text.

**7 · Citation faithfulness & refusal (build).** Two parts: (a) faithfulness — sample agent outputs, check every claim traces to a chunk that supports it (LLM-judge + human audit); (b) refusal — feed out-of-corpus and unanswerable prompts; the agent must refuse, not invent. **Bars:** ≥95% faithfulness, ≤1% unsupported claims, ≥90% refusal precision/recall.

**8 · Retrieval / point semantics (borrow).** BTS/DIEF ships a point-classification benchmark; Haystack/Mortar give tagged points. Tests whether the agent can map a raw BAS point to its meaning and retrieve the right reference. **Grade:** vs dataset labels. **Bar:** ≥90% retrieval hit-rate; point-classification ≥ dataset baseline.

---

## Building our own commissioning benchmark (the gap)

The build-our-own suites (1, 2, 5, 6, 7) form **CxBench** — our internal commissioning reasoning benchmark.

**Inputs (all clean):**
- Our knowledge base (`../study-notes/`) — original IP.
- Public exam blueprints & free sample questions (AEE CBCP, BCCB CCP) — as *style/coverage anchors only*; we author original items.
- Public real-project documents (government + university specs, OPR templates, RFPs) — as scenario material and gold structure.

**Process:**
1. **Draft** items per suite from the KB and public documents (an LLM can propose; we don't ship its first draft).
2. **Human verify** — a reviewer with commissioning knowledge confirms each answer and citation. This is the gate; unverified items don't count.
3. **Tag** every item: role, commissioning level (L1–L5), document, source-KB-section, difficulty.
4. **Freeze & version** — store as `vN`, hold out from any grounding corpus, record which corpus version it evaluates.
5. **Grow to target** — ~300 knowledge QA (50/role) + ~60 procedure-gen + ~60 traceability + ~50 standards + a rolling adversarial faithfulness/refusal set.

**Anti-leakage rule:** CxBench items are never added to Layer A/B/C grounding. The KB *teaches*; CxBench *tests*. Keep them in separate trees (`../study-notes/` vs `corpus/eval/`).

---

## Grading methodology

- **Deterministic where possible** (MCQ exact-match, label comparison for borrowed datasets).
- **LLM-judge for open answers** — a stronger model (e.g. Claude) scores against a rubric; calibrate the judge on a human-scored sample and report judge–human agreement.
- **Citation faithfulness** — programmatically check each cited chunk ID exists and resolves; LLM-judge whether it *supports* the claim; human-audit a sample.
- **Refusal calibration** — measure false-answer rate on a planted out-of-corpus set; tune the confidence gate already in `cx_execution_agent`.
- **All runs reuse `agent_runs` telemetry** — input, output, citations, refusals, token cost, latency are already recorded; we add labels + judges on top.

## Data governance / licensing (enforced)

- Only `ingest-ok` items enter any shipped/grounding dataset; `eval-only` (CC BY-NC-ND: Drexel, ORNL) stay in the eval harness, never redistributed or modified into a shipped artifact.
- `verify` items get their license confirmed before use.
- No copyrighted standard text or proprietary project document is ever reproduced — cite and link to the licensed/owned copy.
- CxBench (our items) = our IP, freely usable.

## Phased rollout (tracks the agent-training plan)

| Phase | Eval work | Gate |
|---|---|---|
| **0 — Foundation** | Stand up the harness on `agent_runs`; assemble borrowed datasets (catalog); confirm licenses | Harness runs end-to-end on one dataset |
| **1 — Cx Engineer first** | Build CxBench suites 1, 2, 7 + borrow suite 4; reach the bars on a design-partner project | Cx Engineer agent passes all its bars before customer exposure |
| **2 — Fan out** | Add suites 3, 5, 6, 8; build the per-role knowledge QA for OCA, Field Tech, CM, Design Eng, Owner/FM | Each role gated on its own bars |
| **3 — Lesson loop** | Feed eval failures + human edits back as Layer C; re-baseline each release | No regression release-over-release |

## Directory layout (proposed)

```
corpus/eval/
├── README.md                 ← this plan
├── dataset-catalog.md        ← external sources & licenses
├── cxbench/                  ← our built benchmark (versioned, held out)
│   ├── knowledge-qa/         ← suite 1 (per role)
│   ├── procedure-gen/        ← suite 2
│   ├── traceability/         ← suite 5
│   ├── standards/            ← suite 6
│   └── faithfulness-refusal/ ← suite 7
├── borrowed/                 ← pointers + loaders for open datasets (not the data itself for NC-ND)
└── harness/                  ← graders, judges, run configs, acceptance bars
```

---

### One-paragraph summary

There's no off-the-shelf way to test a commissioning agent, so we build one. We borrow open datasets for the sub-skills that have public ground truth — fault detection, point semantics, control sequences, comfort — and we build **CxBench** for the commissioning-specific reasoning that nothing public covers, using our own knowledge base and legitimately-public real-project documents. Every item is human-verified, citation-graded, held out from grounding, and gated against the same acceptance bars the agents must clear before they ever reach a customer.
