# CXPro Agentic Design — Research Foundations

Grounding CXPro's architecture (per-role agents under a global objective, a strong AI **inception
baseline**, and lightweight **mini-grill-me** feedback that makes the system better over time) in the
actual research. The point: this isn't a hunch — it maps cleanly onto a recent, coherent literature, which
makes it credible to a technical hyperscaler buyer *and* tells us what to build, in what order.

> Source-honesty note (matching the rest of this repo): several cited works are very recent preprints —
> treat specific numbers as directional, the qualitative patterns as solid. The Pasfield paper is the
> closest published blueprint and is CC-BY; everything below is paraphrased, not reproduced.

---

## The one-line mapping

| CXPro design element | Grounded in | What the research says |
|---|---|---|
| Mini-grill-me feedback → system improves | **Alignment-to-Optimization Bridge** (Pasfield 2026); MemAlign | Expert labels are the *only* manual step; they calibrate a judge that then drives automated optimization |
| Improve agents from a *few* signals (not RL at scale) | **GEPA / `optimize_anything`** (OPRO→MIPRO→GEPA) | LLM-as-optimizer + natural-language reflection beats RL with ~35× fewer rollouts |
| Strong AI inception baseline from the design package | **Test-time scaling** (Snell; Large Language Monkeys; ToT) | Sample many candidate plans, then *verify-and-select*; compute trades up to quality **if** you have a good verifier |
| The global objective | **The verifier/judge** (Cobbe; "Let's Verify Step by Step") | The objective that ranks plans/steps is the bottleneck — invest in it first |
| Per-role agents + recursive subgoals | **Orchestrator-worker multi-agent**; hierarchical decomposition | A global objective decomposed into sub-agent subgoals, kept aligned to the whole |
| One harness for plan / eval / live | **KARL** (the "aroll" harness) | Keep the harness identical across data→train→eval→test-time so the plan doesn't degrade in execution |
| CxBench | **KARLBench**; held-out aligned judge | A multi-regime benchmark *is* the optimization objective and the release gate |
| The lesson loop / moat | The bridge run continuously; MemAlign "memory scaling" | Each project's feedback compounds into a sharper judge and better agents |

---

## 1. The central pattern — the Alignment-to-Optimization Bridge

Pasfield (2026), *Steering Agent Behavior via a Domain Expert-Driven Alignment-to-Optimization Bridge*
(CAIS '26, CC-BY). This is the closest thing to a published version of CXPro's loop.

The mechanism, paraphrased:
1. An **LLM-as-judge** scores agent traces — but an out-of-the-box judge drifts from expert quality.
2. **Domain experts label** a small set of those traces (the *only* manual step).
3. **MemAlign** calibrates the judge to the expert labels via a dual memory — *semantic* (generalizable
   principles, e.g. "always include sample sizes") and *episodic* (specific edge-case examples). It keeps
   improving as feedback accumulates ("memory scaling").
4. **GEPA** (reflective prompt optimization) updates the agent's system prompt using the *aligned judge*
   as the scorer.
5. **`optimize_anything`** synthesizes the optimized prompt + aligned-judge guidelines + tool signatures +
   traces into composable **agent skill modules** loaded at runtime.

The core insight — and why both halves are required:
- **Alignment without optimization** improves how well you *measure*, but doesn't improve the agent.
- **Optimization without alignment** is dangerous: the agent learns to game a mis-calibrated scorer
  (**reward hacking**) — it gets "better" at the wrong thing.
- The bridge connects them: human feedback calibrates the judge; the calibrated judge safely drives
  optimization. All artifacts (judges, prompts, scores, traces) are versioned for audit, and you can
  insert **manual gates** (approval before a new prompt goes live).

Reported effect: GEPA lifted held-out quality +11% (optimized prompt) and +15.7% (with generated skills),
under the same expert-aligned judge.

**→ CXPro:** the **mini-grill-me is the labeling session.** Lightweight, role-scoped multi-select prompts
collect exactly the expert signal that calibrates a per-role judge; the aligned judge then drives automated
improvement of each role agent — *usable day one, better with every answer*, with no RL loop and no manual
prompt-tuning. It also tells us the guardrail that matters most: **never optimize against an uncalibrated
scorer.** The stack matches almost exactly — the paper's agent is a LangGraph state machine with a
Postgres-backed per-thread checkpoint and a versioned prompt registry; CXPro is LangGraph + pgvector + DSPy.

## 2. "Optimize anything" — the improvement engine

The improvement step rests on the **LLM-as-general-optimizer** line: describe any scoreable objective,
let an LLM propose candidates, score them, feed the trajectory back, iterate.
- **OPRO** — *Large Language Models as Optimizers* (Yang et al., DeepMind 2023, arXiv:2309.03409): the
  foundation; up to +50% on Big-Bench Hard via optimized prompts.
- **MIPROv2** (arXiv:2406.11695): generalizes from "optimize the prompt" to "optimize a whole multi-stage
  LM **program**" — instructions, demonstrations, per-call params — against any metric (this is DSPy).
- **GEPA** — *Reflective Prompt Evolution* (arXiv:2507.19457, ICLR'26): samples execution *trajectories*,
  has an LLM **reflect in natural language** on what went right/wrong, and evolves candidates on a
  Genetic-Pareto frontier. Beats RL (GRPO) by ~6–20% with up to **35× fewer rollouts**; the `optimize_anything`
  entry point optimizes prompts, skills, and tool signatures alike.

**→ CXPro:** GEPA is the right engine for "gets better from lightweight feedback." Human signal enters as
*natural-language reflection on a trajectory* ("this test step missed the redundancy requirement"), and a
handful of those refine the role agent — no need to stand up RL. It's already in the DSPy ecosystem we use.

## 3. Grounded long-horizon agents + harness discipline — KARL

**KARL** — *Knowledge Agents via Reinforcement Learning* (arXiv:2603.05218, 2026): builds grounded,
long-horizon, tool-using search agents via (a) **agentic data synthesis** (bootstrap grounded trajectories
from progressively stronger models), (b) multi-task RL, and (c) a harness ("aroll") that is **identical
across offline data → training → evaluation → test-time**. It ships **KARLBench**, a *multi-regime*
benchmark (constraint search, cross-document synthesis, tabular reasoning, procedural reasoning, …), and
shows that **with enough test-time compute it surpasses the strongest closed models**.

**→ CXPro:** three lessons. (1) **One harness** for inception planning, eval, and live execution — so the
plan that scores well is the plan that runs (no "great in the planner, degrades in the field"). (2) **CxBench
is our KARLBench** — deliberately multi-regime (per-role, text + the hard multimodal document-intelligence
track) so we optimize for generalization, not one slice. (3) **Synthesize grounded trajectories** to seed
the inception baseline and the eval set (ties directly to our demo-data + synthetic-data plan).

## 4. Test-time scaling — how the inception baseline gets strong

The inception baseline should not be a single greedy generation. The test-time-compute literature gives the
recipe:
- **Sample many** (Large Language Monkeys, arXiv:2407.21787; Self-Consistency, arXiv:2203.11171): coverage
  rises with N — the best plan is very likely *in* your samples; the job becomes selecting it.
- **Verify-and-select** (Cobbe et al., arXiv:2110.14168; *Let's Verify Step by Step*, arXiv:2305.20050):
  best-of-N with a verifier — ideally a **process** reward that scores each *step* (feasibility, dependency
  order, requirement coverage, risk) — is the highest-leverage move. **Without a verifier, more sampling
  buys coverage you can't cash in.**
- **Search when it branches** (Tree of Thoughts, arXiv:2305.10601; MCTS/ReST-MCTS\*): expand a tree of
  partial plans guided by the value model; spend compute adaptively on the hard sub-decisions
  (compute-optimal scaling, Snell et al. arXiv:2408.03314).
- **Refine carefully** (Self-Refine arXiv:2303.17651; Reflexion arXiv:2303.11366) — but ground the critique
  in an *external* signal; pure self-second-guessing can *degrade* quality (*LLMs Cannot Self-Correct
  Reasoning Yet*, arXiv:2310.01798). Stop after 1–2 rounds; returns diminish, and long-horizon execution
  reliability decays (arXiv:2509.09677).

**→ CXPro:** generate the inception baseline by **sampling N candidate project plans/states and selecting
with the aligned global-objective judge.** This is the moment the *global objective becomes the verifier* —
the rubric that balances requirements, feasibility, schedule risk, and human/safety constraints is exactly
the process-reward the search optimizes against. Everything hinges on that judge being good — which is why
the bridge (§1) and CxBench (§3) come first.

## 5. Multi-agent structure & the meta-harness horizon

- **The keystone — goal-oriented multi-agent reliability** (*Goal-Oriented Reliability and Self-Improvement
  for Multi-Agent Systems*, SaraLabs/Cornell, *3786335.3813230*). Almost a research write-up of CXPro's
  thesis. Three coupled components: a **Goal Decomposition Engine** that turns a high-level objective into a
  **DAG of *verifiable* sub-goals** (each with success predicates, I/O schemas, timeout bounds); a **Runtime
  Reliability Monitor** that checks live progress against those predicates and **detects goal drift before
  failures cascade**; and a **Self-Improvement Loop** that harvests traces + user feedback into revised
  policies with no manual step. It names the two failure modes we must beat — **goal drift** (capability
  drifts from evolving goals, no alarm) and **architectural rigidity** (a fixed pipeline can't restructure
  for new situations) — and treats architecture selection as runtime search. **→ CXPro:** this *is* the
  global-objective layer — decompose the project objective into per-role, verifiable subgoals; monitor
  against them continuously (the daily decision support + drift alarms); improve from mini-grill-me feedback.
- **Orchestrator-worker / hierarchical decomposition**: the established pattern — a global objective split
  into sub-agent subgoals with the orchestrator keeping workers aligned (e.g. Anthropic's multi-agent
  research system). CXPro's "global project objective + per-role agents pursuing recursive subgoals" *is*
  this pattern, applied to a commissioning program.
- **Automated/meta design (the destination)**: systems that *design and optimize their own agentic
  structure* against a benchmark — **ADAS** (Hu, Lu, Clune; ICLR'25): a meta-agent writes new agents *as
  code* and grows an archive; **AFlow** (ICLR'25 Oral): MCTS over code-represented workflows; **Darwin Gödel
  Machine** (Sakana 2025): a coding agent rewrites its own code and validates each change empirically —
  **SWE-bench 20%→50%**. This is the **meta-harness**: once the aligned judge + CxBench are solid, the bridge
  can optimize not just prompts but the agent *topology*.
- **Multi-agent reality checks** (don't over-build): the **MAST** failure taxonomy (Berkeley 2025) blames
  spec/design (~42%), **inter-agent misalignment/coordination (~37%)**, and weak verification (~21%) — not
  raw capability. Two hard rules: **parallelize reading, funnel writing** (fan out for exploration; route
  synthesis/state-changes through one agent), and **counter goal drift** (*Inherited Goal Drift*, 2026) by
  re-injecting the global objective and not conditioning strong agents on weak predecessors' traces.
  Multi-agent costs ~15× the tokens of chat — justified only for parallelizable, high-value work.

**→ CXPro:** build the global-objective layer as a GDE/RRM/SIL-style monitored DAG of verifiable subgoals;
start with a fixed orchestrator-worker topology and optimize prompts/skills via the bridge; let the
orchestrator *choose* single- vs. multi-agent per task. Meta-optimizing the harness itself (ADAS/DGM-style)
is a later, earned capability — a strong long-term research story — but only safe once the judge is
trustworthy (else you meta-optimize toward a bad objective).

---

## 6. The CAIS '26 production-agent cluster

Four more papers from the bridge paper's venue, which together form a playbook for **governed, skilled,
self-learning, production-grade** enterprise agents — precisely CXPro's regime (mission-critical,
compliance-heavy, long-horizon, learns the team).

- **Governance by Construction — CUGA policy system** (IBM, *3786335.3813192*). A **policy-as-code** layer
  over a generalist agent enforcing governance at **five checkpoints**: *Intent Guard* (block bad requests
  before planning), *Playbook* (steer per-role planning in the system prompt), *Tool Guide* (shape tool use
  at the call boundary), *Tool Approvals* (a **human-in-the-loop gate** before risky/destructive actions),
  and *Output Formatter* (filter/structure the final response). Typed, runtime-enforced, auditable,
  conflict-resolved, **no fine-tuning**; on LangGraph + a vector store. **→ CXPro:** the concrete shape of
  "AI drafts, humans decide" for a mission-critical facility — governance as an enforceable *layer*, not
  prompt hygiene. Tool Approvals = the HITL gate before any state-changing action; Output Formatter = the
  cite-or-refuse contract. Compliance (a hyperscaler must-have) becomes auditable by construction.
- **cotomi Act — learning to automate work by watching you** (NEC, *3786335.3813203*). A browser co-worker:
  a reliable scaffold (adaptive lazy observation, verbal-diff history compression, coarse actions) + **test-
  time scaling via best-of-N action selection** — **80.4% on WebArena, beating the 78.2% human baseline** —
  plus a **behavior-to-knowledge pipeline** that distills observed work into a **shared workspace (task
  boards, timelines, wiki) editable by both user and agent**; success *improves as knowledge accumulates*.
  **→ CXPro:** the closest analog to the whole thesis — a *situated co-worker* that builds a living model of
  how the team works and gets better over time; best-of-N validates §4; the shared editable workspace *is*
  the project-state model + the mini-grill-me loop.
- **Skilled AI Agents + IoT-SkillsBench** (Duke, *3786335.3813205*). A skills-based agentic framework +
  benchmark (3 platforms / 23 peripherals / 42 tasks), tested with **no-skills vs. LLM-generated-skills vs.
  human-expert-skills**. Result: **concise human-expert skills → near-perfect success; LLM-generated skills
  are inconsistent and can *degrade* performance.** **→ CXPro:** direct empirical backing for our bet —
  human-authored, expert-grounded knowledge (the study-notes KB + mini-grill-me) beats auto-generated
  grounding; and IoT-SkillsBench is a structural template for CxBench (multi-platform, multi-task,
  difficulty-tiered, **validated against real execution**).
- **Agent Lifecycle Toolkit (ALTK)** (IBM, *3786335.3813206*). Framework-agnostic **middleware** for failure
  modes across the lifecycle: *SPARC* (pre-tool **semantic validation** via LLM judges — catches
  hallucinated args, unmet prerequisites, format errors *before* execution), *JSON Processor* ("LLM as
  programmer, not reader"), *Silent Error Review* (post-tool). **→ CXPro:** the reliability layer that makes
  "cited + refuse" robust in production — SPARC-style pre-tool validation and silent-error review are exactly
  what a mission-critical commissioning agent needs to avoid acting on a bad call.

## 7. Building the judge — the load-bearing piece

Every result above (test-time scaling, GEPA, the bridge, the GDE monitor) bottlenecks on one thing: **a
verifier/judge that tracks expert quality.** Get it right and inference compute trades up to quality; get it
wrong and you *reward-hack* — optimization makes the agent worse while the score rises. The recipe:

1. **Decompose into critics, not a monolith.** For commissioning plans: *feasibility* (sequencing,
   prerequisites, availability), *dependency ordering* (L1→L5 gating), *requirement coverage* (every
   OPR / sequence-of-operations item is tested — a **deterministic checklist match**, not "LLM vibes"), and
   *risk/safety* (interlocks, occupied-building hazards). Back the formalizable critics with *sound* checks;
   **never let the plan's author model self-verify** (self-critique yields false positives and can degrade).
2. **Calibrate from few expert labels via dual memory (MemAlign).** *Semantic* principles + *episodic* edge
   cases in retrievable memory; ~2–10 examples per critic; improves as labels accumulate. **This is exactly
   what the mini-grill-me collects.**
3. **Measure & gate.** Judge↔expert **Cohen's κ** + Spearman on a held-out gold set; **alarm on κ < ~0.6**;
   track calibration (ECE); re-calibrate on a cadence — judges drift.
4. **Spend labels via active learning.** Route low-confidence / critic-disagreement cases to the expert;
   those become new episodic anchors.
5. **Harden against reward hacking (highest-stakes).** Over-optimization is *law-like* and hits even
   best-of-N with no training — **cap pressure / early-stop**; **ensemble diverse critics** with conservative
   aggregation; keep a **deterministic "sound floor"** (coverage/ordering/safety) a persuasive-but-wrong plan
   can't argue away.

**Risks to name:** auto-generated rubrics *collapse* on niche/factual domains — commissioning is exactly
this, so human episodic anchors are non-negotiable; self-verification false positives; silent calibration
drift; correlated-critic false safety. **The judge is the moat *and* the liability — build it first,
calibrate from expert feedback, never optimize against an uncalibrated one.**

---

## How it composes — the CXPro loop, grounded

```
INCEPTION   ingest design package
            → sample N candidate baselines (test-time scaling, §4)
            → verify-and-select with the aligned global-objective judge (§4, §1)
            → strong baseline project state (standardized states instantiated)

LIVE        orchestrator (global objective) → per-role agents pursue subgoals (§5)
            → AI drafts, cited, refuses-on-low-confidence; human decides
            → single harness, same as inception & eval (KARL, §3)

FEEDBACK    mini-grill-me  =  domain-expert labeling session (§1)
            → MemAlign-style judge alignment (per role) — improves with every answer

OPTIMIZE    GEPA / optimize_anything refines role prompts + skills
            against the aligned judge (§1, §2); versioned + gated

MEASURE     CxBench (multi-regime, hard, multimodal) = held-out aligned judge (§3)
            → gates releases; no regression ships
```

The flywheel: every project's mini-grill-me feedback sharpens the judge and the agents → the inception
baseline gets stronger → the moat compounds. That's the lesson loop, now with a name and a method.

## What this means for what we build (priority order)

We already have the hard parts: a LangGraph agent, pgvector retrieval, cited + refuse-on-low-confidence,
and DSPy. The missing pieces, in dependency order:

1. **An aligned judge per role**, calibrated from mini-grill-me feedback (MemAlign-style: semantic +
   episodic memory). *Everything downstream depends on this.*
2. **CxBench as the held-out judge** — multi-regime, hard, multimodal — to measure and gate (we have the
   seed; expand it).
3. **The GEPA / `optimize_anything` loop** — refine role prompts + skills against the aligned judge.
4. **Test-time sample-and-select for the inception baseline** — N candidate plans → verify with the
   global-objective judge.
5. **The orchestrator / global-objective layer** — formalize the rubric that balances requirements,
   feasibility, risk, and human/safety constraints (this rubric *is* the verifier).
6. *(Later)* **Meta-harness** — ADAS-style optimization of the agent topology, once the judge is trusted.

This is a credible, literature-backed architecture: the same artifacts that make the product good (aligned
judge, optimized agents, CxBench) *are* the research contribution — which is exactly the product-and-research
balance the project is aiming for.

## Sources

**CAIS '26 papers (provided locally; CC-BY):**
- Pasfield, *Steering Agent Behavior via a Domain Expert-Driven Alignment-to-Optimization Bridge* — doi 10.1145/3786335.3813200 (`3786335.3813200.pdf`).
- Katharki & Galhotra, *Goal-Oriented Reliability and Self-Improvement for Multi-Agent Systems* — doi …/3786335.3813230 (`3786335.3813230.pdf`) — GDE / RRM / SIL; goal drift.
- Shlomov et al. (IBM), *Governance by Construction for Generalist Agents* (CUGA) — …/3786335.3813192.
- Oyamada et al. (NEC), *cotomi Act: Learning to Automate Work by Watching You* — …/3786335.3813203.
- Li et al. (Duke), *Skilled AI Agents for Embedded and IoT Systems Development* (IoT-SkillsBench) — …/3786335.3813205.
- Wright et al. (IBM), *Agent Lifecycle Toolkit (ALTK)* — …/3786335.3813206.

**Optimization / judge / harness:**
- MemAlign (Databricks Mosaic, 2026) — judge alignment from human feedback with scalable memory.
- OPRO — *LLMs as Optimizers* (arXiv:2309.03409); MIPROv2 (arXiv:2406.11695); **GEPA** (arXiv:2507.19457); DSPy (arXiv:2310.03714).
- **KARL** — *Knowledge Agents via RL* (arXiv:2603.05218) + KARLBench.
- Judge/verifier: *Judging LLM-as-a-Judge* (2306.05685); G-Eval (2303.16634); *Scaling Laws for RM Overoptimization* (2210.10760); RM-ensembles (2310.02743); inference-time reward hacking / HedgeTune (2506.19248); *Let's Verify Step by Step* (2305.20050); Math-Shepherd (2312.08935); LLM-Modulo (2402.01817); Valmeekam planning (2305.15771); EvalGen (2404.12272).
- Test-time scaling: Snell et al. (2408.03314); Large Language Monkeys (2407.21787); Self-Consistency (2203.11171); Cobbe et al. (2110.14168); Tree of Thoughts (2305.10601); Self-Refine (2303.17651); Reflexion (2303.11366); *Cannot Self-Correct Yet* (2310.01798); long-horizon execution (2509.09677).
- Multi-agent / meta-design: **ADAS** (2408.08435, ICLR'25); **AFlow** (2410.10762, ICLR'25); Gödel Agent (2410.04444, ACL'25); **Darwin Gödel Machine** (2505.22954); **MAST** failure taxonomy (2503.13657); *Inherited Goal Drift* (2603.03258); SWE-agent (2405.15793); Anthropic multi-agent + context-engineering (blog); Voyager (skill libraries).

> Honesty caveats: the Pasfield result is a single-domain demonstration with a small label set and an
> author-as-expert circularity risk (it says so itself) — it's a strong *blueprint*, not proof at scale.
> KARL and the agentic test-time-scaling papers are recent preprints. The pattern is well-supported; the
> exact numbers are not load-bearing for us. What *is* load-bearing: invest in the aligned judge first,
> never optimize against an uncalibrated one.
