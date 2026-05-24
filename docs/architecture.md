# CXPro Architecture

CXPro is an **AI-native commissioning OS** for hyperscale data centers, with planned expansion into Ontario government/hospital projects and pharma CQV. The product matches the feature surface of CxAlloy and BlueRithm 2.0 but is built **action-centric, not data-centric**, with a Domain-Driven Design (DDD) decomposition into 12 bounded contexts.

This document covers:
1. Personas & Roles
2. Domain Model (DDD bounded contexts)
3. Interaction Paradigm
4. UX Patterns
5. AI Quality Contract
6. Day-One Experience
7. Inter-Context Integration
8. Tech Stack
9. System Layers
10. AI Agent Design
11. MCP Server
12. Deployment
13. v0 / v1 / Year-2 Scope Tiering
14. Out of Scope (Year 1)

End-to-end data flow example appears in §2.4 as part of the Domain Model.

---

## 1. Personas & Roles

CXPro has **seven first-class roles**. Personas drive UI defaults, agent capabilities, and bounded-context entry points.

| Role | Persona summary | Primary contexts |
|---|---|---|
| **Construction Manager (CM)** | Project-level orchestrator. Coordinates all disciplines, writes RFIs, plans downtime, manages crews. Lives in Workforce & Scheduling. | Workforce & Scheduling, Issue & RFI, Analytics |
| **Owner's Cx Agent (OCA)** | Program owner. Approves turnover packages, overrides gates with justification, sees compliance posture. | Commissioning Execution, Handover & Compliance, all contexts (read) |
| **Cx Engineer / Specialist** | Discipline-scoped test author/executor. Marks tests pass/fail, raises deviations. | Commissioning Execution, Issue & RFI |
| **Subcontractor / Field Technician** | Narrow assigned-work view. Can only see/action their assigned tests. | Commissioning Execution (own assignments only) |
| **Design Engineer (Mechanical / Electrical / etc.)** | Consultative read-only. Answers design-intent questions. Reviews submittals. | Document & Knowledge, Issue & RFI (RFI responder) |
| **Owner / Facility Manager** | Read-only progress, deviation, package, cost views. Receives handover. | Analytics, Handover & Compliance, Cost & Commercial |
| **AI Agent (system role)** | First-class actor. Can write draft records and call read-side tools, cannot commit state transitions without human confirmation. | All contexts (via AgentPolicy in AI & Conversation) |

**Default cross-discipline visibility:** read-everything, write-your-scope. Confidentiality scoping is opt-in via `confidentiality_scope` (e.g., sub-only deviations between competing subs).

---

## 2. Domain Model

### 2.1 Bounded Context Map

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Project & Portfolio│────▶│ Commissioning Exec  │────▶│ Issue & RFI Mgmt    │
│  (Project/Discipline│     │ (L0-L5 tests,       │     │ (Deviation, RFI,    │
│   Scope/Milestone)  │     │  witness, results)  │     │  Punch, CO, Submit) │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Asset Registry    │     │ Document & Knowledge│     │ Handover & Compliance│
│   (Asset/System/    │     │ (Doc/Chunk/Extract/ │     │ (TurnoverPkg/AHJ/   │
│    Space/Markup)    │     │  Markup/Citation)   │     │  ComplianceMapping) │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│Workforce & Scheduling│    │Analytics & Reporting│     │ Cost & Commercial   │
│ (Crew/Assignment/   │     │ (Dashboard/KPI/     │     │ (Contract/Billing/  │
│  Downtime/Alert)    │     │  Report/Snapshot)   │     │  Invoice/Retention) │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                            │
           └───────────────┬───────────┴────────────────────────────┘
                           ▼
              ┌────────────────────────┐    ┌────────────────────────┐
              │   AI & Conversation    │    │  Identity & Access     │
              │ (Agent/Run/Tool/       │    │  (User/Org/Membership/ │
              │  Citation/Feedback)    │    │  Permission/Audit)     │
              └────────────┬───────────┘    └────────────┬───────────┘
                           │                              │
                           └──────────────┬───────────────┘
                                          ▼
                          ┌─────────────────────────────┐
                          │   Notification & Inbox      │
                          │ (Subscription/Inbox/Digest) │
                          └─────────────────────────────┘
```

**Investment tiers:**
- **Core (heavy):** Commissioning Execution, Issue & RFI, Asset Registry, AI & Conversation, Workforce & Scheduling
- **Supporting (medium):** Project & Portfolio, Handover & Compliance, Document & Knowledge, Analytics & Reporting, Cost & Commercial
- **Generic (light — buy/use SaaS):** Identity & Access (Supabase Auth + custom party model), Notification & Inbox (Knock for delivery)

### 2.2 Discipline as Aggregate (key differentiation)

CxAlloy treats discipline as a per-project enum tag on records. CXPro treats discipline as a **first-class aggregate boundary** (`DisciplineScope`) within Project & Portfolio. Each DisciplineScope owns:
- Team membership, lead, status
- Discipline-specific milestones
- Discipline-scoped permissions (write your discipline; read all others by default)
- Cross-discipline dependency events (Controls blocking Mechanical L4)

This unlocks discipline-isolated dashboards, native cross-discipline coordination, and discipline-specific AI agent surfaces — none of which CxAlloy can retrofit without a data migration.

---

### 2.3 The 12 Bounded Contexts

#### Context 1 — Project & Portfolio
**Concern:** Project lifecycle, discipline scopes, milestones.
**Aggregates:** `Project`, `DisciplineScope` (Mechanical, Electrical, Controls, General Construction), `Milestone` (both project-level and discipline-level), [`Portfolio` — stubbed for Year 2].
**Language:** Mobilization, Substantial Completion, Closeout, Campus.
**Out of scope:** Tests/deviations/RFIs, crew assignments, budgets, document files.
**Key events:** `ProjectMobilized`, `MilestoneReached`, `DisciplineScopeCreated`, `ProjectHandoverInitiated`.
**Notes:** Construction Manager is a project-level orchestrator (not bound to one discipline). Contract reference lives here as `contract_id` (Contract aggregate owned by Cost & Commercial).

#### Context 2 — Commissioning Execution
**Concern:** L0–L5 test workflow execution.
**Aggregates:** `TestProcedureTemplate`, `TestProcedureInstance` (single aggregate covering checklists *and* tests; differentiated by `level: L1..L5`), `TestResult` (multiple results per instance — retest history), `WitnessSession` (batched witness events), `Signature`.
**Levels:** L1 Factory Witness, L2 Pre-Functional Checklist, L3 Start-Up, L4 Functional Performance Test, L5 Integrated Systems Test.
**Out of scope:** Asset specs, deviations, attachments, scheduling, dossiers.
**Key events:** `TestInstanceScheduled`, `TestStepFailed`, `TestResultCompleted`, `WitnessSessionSigned`.

#### Context 3 — Issue & RFI Management
**Concern:** All workflow-shaped artifacts that require human action.
**Aggregates:** `Deviation`, `RFI` (project-level, originated by CM, can affect multiple disciplines), `PunchItem`, `ChangeOrder`, `Submittal` (PDF in Document & Knowledge; workflow here).
**Language:** Triage, Route, Accepted as built, Substantial vs. cosmetic punch, RFI turn-around time.
**Cross-aggregate refs:** `Deviation → RFI → ChangeOrder`, `PunchItem ← TestResult`.
**Out of scope:** Failed test data, crew dispatch, $ values, attachments.
**Key events:** `DeviationRaised`, `RFISubmitted`, `RFIAnswered`, `ChangeOrderApproved`, `PunchItemClosed`, `SubmittalApproved`.

#### Context 4 — Asset Registry
**Concern:** Physical/logical inventory — equipment, systems, spaces.
**Aggregates:** `Asset` (atom of commissioning), `System` (many-to-many with Asset), `Space` (recursive hierarchy with project-configurable level naming), `AssetType` (catalog template).
**Language:** Tag, Serial, Nameplate data, Energized, Beneficial Use, Spare.
**Out of scope:** Test procedures, photos/cut-sheets, costs, BMS telemetry.
**Key events:** `AssetEnergized` (unlocks L3), `AssetInstalled` (unlocks L2 scheduling), `SystemReadyForFunctional` (unlocks L4), `AssetTagChanged`.
**Deferred:** SparePartsKit, Tool, AssetConfiguration (Year 2).

#### Context 5 — Document & Knowledge
**Concern:** All uploaded files plus AI-derived knowledge extracted from them.
**Aggregates:** `Document` (typed: drawing / spec / submittal_pdf / opr / bod / sequence_of_operations / cut_sheet / o_and_m_manual / photo / datalog / schedule_xlsx / report), `DocumentVersion` (revision history; tests captured against specific version), `DocumentChunk` (pgvector embedded, page-coordinate metadata for deep-link), `ExtractedSpec` (structured data parsed per type), `KnowledgePack` (curated bundle per AI agent run), `Markup` (annotation on drawings — first-class).
**Value objects:** `ExternalDocumentLink` (for documents owned in Procore/SharePoint but indexed locally).
**Language:** Revision, As-built, Submittal log, Markup, Cited from.
**Out of scope:** Submittal workflow (Issue & RFI), Asset metadata, LLM run audit, Citation provenance (AI & Conversation).
**Key events:** `DocumentUploaded`, `DocumentIndexed`, `DocumentVersionSuperseded`, `ExtractedSpecCreated`.

#### Context 6 — Handover & Compliance
**Concern:** Owner-acceptable, audit-ready, regulator-traceable handover. The compliance moat.
**Aggregates:** `TurnoverPackage` (a.k.a. dossier, per-system or per-project), `WarrantyRecord`, `TrainingRecord`, `ComplianceMapping` (links TestStep → regulatory citation), `RegulatoryFramework` (versioned, jurisdiction-tagged), `OwnerAcceptance`, `AHJInspection` (formal inspector visits).
**Year-1 regulatory content (seeded via consultant):** ASHRAE 202, NFPA 72, OBC 2025, LEED v4.1. (NRCan Guide + FDA 21 CFR Part 11 in Year 2.)
**Language:** Dossier, Substantial Completion, Final Acceptance, Punch closure, AHJ, Citation, Conditional acceptance.
**Out of scope:** Test execution, source documents, the compiler agent, billing release logic.
**Key events:** `TurnoverPackageAssembled`, `OwnerAccepted` (triggers billing/warranty/closeout), `ComplianceGapDetected`, `RegulatoryFrameworkUpdated`.

#### Context 7 — Workforce & Scheduling
**Concern:** Construction Manager's home. Who is available, what they can do, when they're doing it, and how to plan around downtime.
**Aggregates:** `Crew`, `CrewMember` (skills, certs — warn-not-block on cert gaps in MVP), `Assignment` (work × crew × window), `ScheduledEvent` (witnesses, AHJ visits, training, vendor visits), `DowntimeWindow`, `Alert` (CM rule), `Availability`, `Resource` (calibrated instruments, load banks, lifts — planning constraint).
**Language:** Crew, Dispatch, Look-ahead, Float / slack, Critical path, Downtime window (planned) vs. outage (unplanned), Tag-out / LOTO, Standby.
**Out of scope:** Test execution, asset state, labor cost (Cost & Commercial), auth, notification delivery.
**Key events:** `AssignmentCreated`, `AssignmentCompleted`, `DowntimeWindowScheduled`, `AvailabilityShortageDetected`, `CriticalPathSlipDetected`.
**Integrations:** P6 / MS Project two-way sync at the Assignment level deferred to Year 1 H2 (CSV import/export for MVP).

#### Context 8 — Analytics & Reporting
**Concern:** Read-model context — subscribes to events from every other context, projects, surfaces dashboards/reports. Pure read for users.
**Aggregates:** `Dashboard` (persona-tied), `Widget`, `KPIDefinition` (org-configurable — "% Complete" means what *you* define), `MetricSnapshot`, `SavedQuery`, `ReportTemplate` (white-label per `BrandingProfile`), `ReportInstance` (immutable, archived as Document), `ScheduledReport`.
**Implementation:** Live Postgres views/CTEs for MVP (Option A); migrate to materialized projections per-widget as performance demands.
**Custom reports — the AI-native angle:** User describes the report ("MEP progress by system for Q1 with deviation aging"), AI assembles a new ReportTemplate by composing SavedQueries. Pre-built templates Day 1; AI overlay shortly after.
**Language:** Look-ahead, Burndown, S-curve, Drill-down, Snapshot, Rollup.
**Out of scope:** Source data, AI Q&A grounding logic (AI & Conversation calls SavedQuery here), notification transport.
**Key events:** `MetricThresholdCrossed`, `ReportGenerated`.

#### Context 9 — AI & Conversation
**Concern:** The differentiator context. Every agent, every run, every tool call, every grounded citation. Where role-specific agent capability is defined, executed, audited, and learned-from.
**Aggregates:**
- `Agent` (capability definition, persona affinity, tools, DSPy module, model preference, safety policy)
- `AgentRun` (immutable audit record — backs `actor_type: ai` in cross-system audit log)
- `Conversation` (multi-turn; auto-scoped to Project / System / Asset / Deviation per UI entry point)
- `Message`
- `Tool` (addressable action, typed I/O, permission policy)
- `ToolCall`
- `Citation` (provenance link — your hallucination defense)
- `AgentPolicy` (per-role agent capability + confirmation requirements)
- `FeedbackRecord` (user corrections — feeds DSPy optimization; **data network effect**)
- `EvalRun` (periodic quality measurement against labeled test sets)

**Per-persona agent / tool map:**

| Persona | Agent | Tools |
|---|---|---|
| Construction Manager | `CMPlannerAgent` | `propose_assignment`, `draft_alert_rule`, `plan_downtime_window`, `summarize_lookahead`, `flag_critical_path_risk` |
| Cx Engineer | `CxExecutionAgent` | `generate_fpt_steps`, `summarize_test_result`, `draft_deviation`, `find_similar_deviations`, `cite_code_for_step` |
| Mechanical/Electrical/Controls Design Engineer | `DesignIntentAgent` | `explain_design_intent`, `summarize_bod_section`, `compare_as_built_to_design`, `find_design_conflicts` |
| Subcontractor / Field Tech | `FieldAssistAgent` | `read_my_assignments`, `explain_this_step`, `attach_photo_to_step`, `flag_blocker` (narrow on purpose) |
| OCA | `ProgramAgent` | full read across, `draft_compliance_gap_report`, `draft_turnover_package`, universal Q&A |
| Owner / FM | `OwnerInsightAgent` | read-only summaries, cost trends, schedule health, warranty lookups |

**Language:** Agent, Tool, Grounding, Citation, Confirmation gate, Hallucination, Run, Session, Eval.
**Out of scope:** Embedding storage (Document & Knowledge), the action's effect (target context), notification delivery, infra/keys.
**Key events:** `AgentRunStarted`, `AgentRunCompleted`, `ToolCallProposed` (needs confirmation), `FeedbackReceived`, `CitationOpened`.

#### Context 10 — Identity & Access
**Concern:** Multi-org, multi-project, multi-discipline party model + RBAC + audit. Generic subdomain but party model is domain-shaped.
**Aggregates:** `User`, `Organization` (typed: Owner / GC / CxConsultant / Subcontractor / Designer / Vendor / AHJ / InternalCXPro), `Membership` (User × Org), `ProjectParticipation` (Org × Project × Role-in-project), `UserProjectAssignment` (User × Project × Role × DisciplineScope(s) × authority), `Role`, `Permission` (atomic capability), `ApiKey` / `ServiceAccount` (integrations + external MCP), `BrandingProfile`, `AuditLogEntry` (system-wide, every state transition; the compliance moat).
**Confidentiality:** Cross-org default = read-project; opt-in `confidentiality_scope` per record for sub-isolation.
**Multi-tenant isolation:** Supabase RLS on every queryable row, keyed off ProjectParticipation.
**Pricing alignment:** Per-project tier, *unlimited users*. Don't gate features by seat; gate by project tier (Cost & Commercial owns tier).
**Language:** Party, Seat (assignment, not license), Loaned, Delegate, Service account.
**Out of scope:** Crew composition (Workforce), billing (Cost & Commercial), notification routing, LLM tool auth (AI & Conversation enforces).
**Key events:** `UserProjectAssignmentCreated`, `OrganizationParticipationGranted`, `RoleAssignmentChanged`, `AuditLogEntryRecorded`.
**Deferred:** SSO config per Organization (per first paying pilot, supabase-auth-native).

#### Context 11 — Notification & Inbox
**Concern:** Transport and dwell layer. Subscribes to events from every context, doesn't write back. Uses Knock (or similar) for delivery infra; CXPro owns the domain (Subscription, InboxItem, Digest, Escalation).
**Aggregates:** `Subscription` (User × EventTopic × DeliveryPreference, auto-provisioned by role + project), `Notification` (delivered message, immutable), `InboxItem` (actionable, persists until resolved — distinct from informational Notification), `DeliveryChannel` (in_app / email / sms / push / slack / teams), `Digest`, `DigestSchedule`, `Escalation` (SLA breach → next-level role).
**Key UX win:** Split *To-Do* surface (InboxItems requiring action) from *Feed* surface (Notifications for awareness). CxAlloy has a flat notification list — biggest single ergonomics win.
**Value objects:** `Acknowledgment` (required for safety-critical events: downtime, LOTO).
**Language:** Inbox, Digest, Quiet hours, SLA, Escalate, Deep-link.
**Out of scope:** Alert *rule definition* (Workforce or Analytics), delivery vendor internals.
**Key events emitted:** `NotificationRead`, `InboxItemActioned`, `InboxItemEscalated`, `DigestDelivered` (mostly Analytics + agent feedback).

#### Context 12 — Cost & Commercial
**Concern:** Contracts, billing milestones, change-order $-impact, labor cost, retention, forecasts. Heavy boundary with external AR systems.
**MVP scope (Option B):** Contract + BillingMilestone + Invoice draft. Defer Forecast / Retention / LaborCostEntry / BudgetLine / PurchaseOrder to Year 2.
**Aggregates (full set):** `Contract` (lifecycle drafted → executed → active → amended → closed), `BillingMilestone` (earned on domain trigger from another context — e.g., `WitnessSessionSigned`), `Invoice`, `ChangeOrderCommercial` (mirror of Issue & RFI's ChangeOrder workflow side), `Retention`, `LaborCostEntry` (from `AssignmentCompleted`), `BudgetLine`, `Forecast`, `PurchaseOrder`.
**Visibility model:** Strict confidentiality by default. `Contract` visible only to two contracting parties; `LaborCostEntry` to source Org only; `BudgetLine` to OCA + Owner. RLS enforced.
**Integrations:** Push Invoice records to external AR (Procore Financials, NetSuite, QuickBooks); two-way connectors prioritized.
**Language:** Contract type (fixed price / T&M / cost-plus / GMP), Earned value, Cost-to-complete (CTC), Estimate-at-completion (EAC), Margin, Retention, Variance.
**Out of scope:** Pre-sales pipeline, payroll, general ledger, CXPro's own ops costs.
**Key events:** Consumes `WitnessSessionSigned`, `MilestoneReached`, `OwnerAccepted`, `ChangeOrderApproved`, `AssignmentCompleted`. Emits `BillingMilestoneEarned`, `InvoiceSubmitted`, `RetentionReleased`, `BudgetOverrunDetected`.

---

### 2.4 Cross-Context Event Flow Example: FPT Generation → Witness → Billing

```
1.  OCA uploads design package (PDF, Excel, drawings) — Document & Knowledge
        ↓ DocumentUploaded
2.  Python worker ingests: detector classifies, chunker embeds → pgvector, extractors parse
        ↓ DocumentIndexed
3.  OCA clicks "Generate Procedures" for AHU-42 — Commissioning Execution
        ↓ AgentRunStarted (AI & Conversation)
4.  CxExecutionAgent → KnowledgePack assembled → DSPy generates typed steps
        ↓ AgentRunCompleted, Citations recorded
5.  Procedure returned as draft TestProcedureInstance (actor_type: ai)
6.  OCA reviews + confirms → state: active
        ↓ AuditLogEntryRecorded (human-confirmed AI draft)
7.  CM dispatches assignment — Workforce & Scheduling
        ↓ AssignmentCreated → Notification to crew
8.  Field tech executes L4 FPT, marks pass — Commissioning Execution
        ↓ TestResultCompleted
9.  Witness signs WitnessSession — Commissioning Execution
        ↓ WitnessSessionSigned
10. → Handover & Compliance flags eligible for dossier
    → Cost & Commercial earns BillingMilestone
        ↓ BillingMilestoneEarned
11. Invoice draft auto-assembles; Notification to billing role
        ↓ InvoiceSubmitted → external AR push
```

---

## 3. Interaction Paradigm

- **Primary interface:** Structured PWA. Contextual action buttons based on entity state + user role, not generic forms. Field crews and Cx engineers live here.
- **AI role:** Agents run in background, surface results inside the UI. Humans confirm before any AI output changes system state. AI is a first-class `actor_type` in every audit row.
- **Action-centric, not data-centric:** Every entity has a state machine; every action is a transition. The UI renders allowed transitions; the AI proposes transitions; humans confirm.

---

## 4. UX Patterns

### 4.1 Navigation paradigm

**Inbox-primary, persona dashboard secondary.** Default landing = Inbox ("Today" view filtered to InboxItems the user owns). One click to flip to the persona dashboard. Two surfaces, both feel native; the InboxItem split (action items) vs Notifications (awareness feed) is preserved.

**Two time horizons on home:**
- **Daily:** Inbox of action items (overdue + due-today + flagged, with visual buckets)
- **Weekly:** Look-ahead view of planned tasks

Responsive layout, **optimized for tablet portrait** — the format both desk-bound (CM/OCA) and field (Tech) personas can use.

### 4.2 Canonical entity-detail page

**Three-panel workspace on desktop / single-scroll on mobile.** Every entity (Asset, TestProcedureInstance, Deviation, RFI, etc.) renders the same canonical shape:

- **Left rail:** project navigation
- **Center column:** entity content. Header shows state, identity, contextual action buttons (state-machine-aware, role-filtered). AI-proposed actions appear as first-class action buttons with distinct visual treatment (lightning bolt icon, "AI proposed" label) — one-click confirm. Cross-entity context (linked tests, deviations, documents) rendered as inline expandable cards.
- **Right drawer:** persistent, with tabs `AI Chat | Activity | Comments`. **AI Chat is the default tab** — every entity has AI auto-scoped to it, no context-switching. On mobile, drawer collapses to floating button → bottom sheet.

**Universal Cmd-K command palette** — fuzzy search across entities + saved queries + AI prompts. First-class from Day 1; every entity indexed.

### 4.3 Persona home dashboards (v0 set + v1 additions noted)

**Construction Manager (`CMHome`)** — v1
1. 3-week look-ahead Gantt (assignments + downtime, swimlanes by Crew, drag to re-assign)
2. Crew utilization heatmap (day × crew, over/under capacity)
3. Critical-path risk panel (AI-flagged)
4. Open RFI count + aging (CM-originated)
5. AI prompt bar — "Plan downtime for chiller plant Tuesday"
6. Conditional: Safety / LOTO acknowledgment widget when a downtime/LOTO event is active

**OCA (`OCAHome`)** — v0
1. Project health summary (% complete by discipline, milestone burndown, open deviations by severity)
2. Compliance posture (RegulatoryFramework coverage %, gaps)
3. Turnover package pipeline
4. AI Program Brief (daily auto-summary)
5. Small commercial widget (earned-but-not-invoiced, pending owner approvals) — v1 once Cost & Commercial is in
6. AI prompt bar

**Cx Engineer (`CxEngineerHome`)** — v0
1. My active tests (Kanban: In Progress / Awaiting Witness / Failed / Complete-this-week)
2. Deviations I own (sorted by aging)
3. Today's assignments (quick mark-pass/fail)
4. Document feed (newly indexed docs in my disciplines)
5. AI prompt bar

**Field Technician (`FieldHome`, mobile-primary)** — v0
1. Today's assignments (vertical list, tap to open, prominent pass/fail buttons; offline-cached)
2. AI-suggested walking order (by Space proximity)
3. Open blockers I flagged
4. Photo / QR scan quick action (floating button)
5. **Voice-to-step** for hands-free entry on noisy floors (replaces text prompt bar)
6. One-tap "I'm safe to start work" (records LOTO + PPE acknowledgment as first-action-of-shift)

**No dashboard customization in v0** — preset per persona. Drag-to-rearrange ships v1 H2 (persisted to `Dashboard` aggregate).

---

## 5. AI Quality Contract

CXPro guarantees a **tiered grounding contract** based on the consequence of the AI's output. Failures of AI quality in compliance-sensitive industries destroy pilots; this contract is product-critical.

| Agent activity | Grounding | Citation | Refusal behavior |
|---|---|---|---|
| Q&A (read-only) | retrieve if relevant | inline if cited | "I don't have that information" if no relevant retrieval + fact-shaped question |
| Tool call with side effect | **mandatory** | **mandatory on output** | hard refuse below confidence threshold |
| Draft record (FPT, deviation classification, assignment) | **mandatory** | **mandatory + structured** | refuse + explain gap |
| Summary / digest | retrieve from source | inline citations | omit if no source |

### Enforcement mechanisms (all four ship in v0)

1. **DSPy signatures encode the contract at code level** — outputs requiring citations have a `citations: list[Citation]` field marked required; DSPy refuses to return without it.
2. **EvalRun gates production deploys** — labeled fixture set (seed: 50 examples per agent; grows over time via FeedbackRecord). Regression in citation recall, refusal precision, or correctness blocks the deploy.
3. **FeedbackRecord loop surfaced in UI** — every AI output has thumb up/down + "correct this." Corrections feed labeled set. **Data network effect compounds here.**
4. **Confidence display** — every draft shows 3-tier confidence (high/medium/low), derived from retrieval score + DSPy signature. Below-low triggers automatic refusal. Underlying score revealable for power users.

### Refusal UX

Refusals never dead-end. Every refusal proposes a **path forward** ("I'd need the equipment cut sheet — should I create a request to upload?"). The refusal becomes an InboxItem in the user's flow.

### AI Quality dashboard (v1)

Per-project dashboard visible to OCA + Owner showing citation coverage, refusal rate, correction rate, EvalRun pass rate. **The hyperscaler procurement answer to "how do you guarantee quality?"** Also the basis for any future SLA offer.

---

## 6. Day-One Experience

The first 10 minutes decide whether a pilot succeeds. Two on-ramps:

### Greenfield + CxAlloy-migrant Day-1 flow

1. **~30 sec:** Org + first project setup (name, target Substantial Completion, campus context). Discipline scopes auto-created.
2. **~2 min:** Asset import wizard with three on-ramps:
   - **From CxAlloy** — API key or exported archive; adapter maps flat tagged schema → DisciplineScope aggregates; conflicts surfaced inline
   - **From spreadsheet** — drop XLSX/CSV; AI extracts columns; user confirms mapping
   - **From scratch** — manual entry, or AI ingestion of design package (extracts asset list from equipment schedules)
3. **~3 min:** Document ingest. Drag-drop design package (OPR/BOD/SOO/submittals). Background ingestion non-blocking.
4. **~2 min:** Invite teammates. Smart defaults: detected discipline from job title → DisciplineScope.
5. **~2 min:** **The "first AI win"** — once docs are indexed, AI surfaces a proposed action on OCA's Inbox: *"I drafted 12 L2 pre-functional checklists for AHU-01 through AHU-12 from your submittal package. Review and accept?"* One-click accept seeds the backlog. **Hard product requirement:** AI must produce a credible accept-able draft on Day 1. If ingestion isn't done, an interim "I'm still learning your project" message replaces silence.
6. **~24h background:** Full indexing completes; ComplianceMapping engine runs; AI sends Day-1 morning report with priorities.

### CxAlloy import depth

**v0 = Option B (one-way sync CxAlloy → CXPro).** Periodic pull from CxAlloy API; CXPro is read+write, CxAlloy becomes secondary. Two-way sync (Option C) deferred to Year 2 if a paying customer asks. Read-only snapshot import (Option A) is fallback for customers whose CxAlloy contract restricts API access.

### Demo project

A read-only **"Demo Hyperscaler" project** visible to every new account from Day 1. New users see what a mature project looks like before importing their own data. Also a sales asset.

### Onboarding model

**Both self-serve and white-glove supported.** Self-serve flow must work standalone. Every $250K+ pilot also gets a 2-hour kickoff workshop (founders + customer team walk through steps 1-5 together; also where customer's first KPIDefinitions and BillingMilestones are collected).

---

## 7. Inter-Context Integration

DDD without an explicit integration pattern collapses into a distributed monolith. CXPro uses a **hybrid: in-process events for same-transaction reactions, Transactional Outbox for cross-process/async/external**.

| Event class | Mechanism | Example |
|---|---|---|
| Same-transaction reaction (validation, derived field updates) | In-process synchronous | TestStep marked failed → Deviation row inserted in same tx |
| Cross-process async (AI worker, Notification, Analytics projection) | Postgres Outbox → worker dispatch | `TestStepFailed` outbox row → Deviation Triage Agent runs on Railway |
| External integration (Procore, P6, NetSuite, BMS) | Outbox + idempotent webhook adapter | `InvoiceSubmitted` → push to Procore Financials with retry |

### Outbox pattern

```sql
CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,        -- 'commissioning.test_step_failed'
  payload JSONB NOT NULL,
  source_context TEXT NOT NULL,    -- 'commissioning'
  occurred_at TIMESTAMPTZ DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0
);

CREATE TRIGGER outbox_notify AFTER INSERT ON outbox
  EXECUTE FUNCTION pg_notify('outbox_new', NEW.id::text);
```

Next.js cron + Python service `LISTEN` on `outbox_new` for low-latency dispatch; fall back to polling for missed notifications. **Idempotency keys** (`event_id + subscriber_name`) prevent duplicate processing.

### Codebase boundaries

- **Two codebases:** Next.js (most contexts) + Python on Railway (AI & Conversation only)
- **Within Next.js:** contexts are folders under `src/contexts/`, each with a `public/` surface (event types, subscribers, commands, read queries). Internals not importable across contexts.
- **Enforced via `eslint-plugin-boundaries`** — `workforce/*` cannot import from `commissioning/internals/*`, only from `commissioning/public/*`. Set up Day 1; intractable to retrofit at 50K LOC.

### Consistency rule

- **Synchronous in-process** for anything that gates user action (state-machine transitions, derived state the next click depends on).
- **Async via Outbox** for everything else. Users never see incoherent UI from un-propagated derived state.

---

## 8. Tech Stack

| Concern | Technology |
|---|---|
| Frontend | Next.js (TypeScript), PWA with service-worker offline sync |
| Hosting (frontend) | Vercel |
| Database | Supabase (Postgres + pgvector + Auth + Realtime + Storage) |
| AI service | FastAPI (Python) on Railway |
| AI orchestration | LangGraph (per-agent graphs, sharing signatures + index) |
| Structured LLM outputs | DSPy |
| Async job queue | Supabase `agent_jobs` table (prototype); migrate to Redis/BullMQ at scale |
| Notification delivery | Knock (vendor) |
| MCP server | FastAPI-MCP, action-scoped |
| LLM | Google Gemini API — Gemini 2.5 Flash default, Gemini 2.5 Pro for complex reasoning. Free tier viable for dev. Provider-swappable via DSPy/LangGraph abstractions if Claude API is added later. |
| Multi-tenancy | Supabase RLS keyed off ProjectParticipation |

---

## 9. System Layers

### 9.1 Frontend (Next.js / TypeScript)
PWA with service worker for offline sync. Persona-aware UI defaults (CM home ≠ OCA home ≠ Field Tech home). Supabase Realtime for live dashboards. SSE for AI agent progress streams. Next.js API routes act as BFF — auth, CRUD, proxy to Python.

### 9.2 Database (Supabase)
Core schema follows the 12 bounded contexts as schema groups (e.g., `commissioning.*`, `workforce.*`, `ai.*`). RLS policies enforced at the table level keyed off ProjectParticipation. pgvector indexes for Document & Knowledge. Supabase Realtime channels per Project for collaborative updates.

### 9.3 Python AI Service (FastAPI on Railway)
Pure AI concerns. No auth, no user management. Called exclusively by Next.js BFF.

```
ai_service/
  agents/                      # LangGraph graphs (one per Agent)
    cm_planner.py
    cx_execution.py
    design_intent.py
    field_assist.py
    program_agent.py
    owner_insight.py
  signatures/                  # DSPy signatures (shared)
    extract_equipment.py
    classify_deviation.py
    generate_procedure_step.py
    cite_regulatory_code.py
  ingestion/
    detector.py                # PDF / drawing / Excel / submittal classifier
    chunker.py                 # chunk + embed → pgvector
    extractors/                # Per-document-type structured extractors
  tools/                       # Tool implementations (per AI & Conversation Tool aggregate)
    query_deviations.py
    propose_assignment.py
    draft_alert_rule.py
    ...
  mcp/
    server.py                  # Action-scoped MCP tools
  eval/                        # EvalRun harness, labeled fixtures
```

**Sync vs. async:** Sync for fast single-record (deviation triage, Q&A turn). Async via `agent_jobs` for long-running (multi-doc ingestion, FPT generation, dossier compilation, scheduled reports).

---

## 10. AI Agent Design

**Three core agents at MVP** (matching original plan): `CxExecutionAgent` (FPT Generator), Deviation Triage (sub-flow inside CxExecutionAgent), Handover Compiler (inside `ProgramAgent`). **Three more agents added per persona at MVP+:** `CMPlannerAgent`, `DesignIntentAgent`, `FieldAssistAgent`. `OwnerInsightAgent` follows.

**Per-persona, not mega-agent.** Crisper prompts, better evals, easier to ship incrementally. Shared substrate is the Tool library, the Citation pattern, the pgvector index, the DSPy signature library.

**Conversations auto-scope** to entry point: from the AHU-42 page, agent context is asset-scoped. From the project dashboard, project-scoped. From the inbox, the InboxItem's referenced entity. Scope = grounding signal = answer quality.

**Hallucination defense:** every agent output carries `Citation` records back to source chunks / records. UI deep-links. Users click → land on source. Trust loop closed.

**Provider note:** PRD-1 ships against Google Gemini (Flash default, Pro for complex reasoning) to leverage the free tier during early development. The DSPy module + LangGraph graph abstractions are provider-agnostic, so the architecture supports swapping to Claude API later without code changes beyond an LM init.

**Quality / data network effect:** `FeedbackRecord` captures user corrections. DSPy optimization compiles improved modules. `EvalRun` runs against labeled fixtures on every model upgrade. Accumulated deviation/triage corrections become CXPro's compounding moat.

---

## 11. MCP Server (Action-Scoped)

Curated tool surface. External agents (Claude, Cursor, Perplexity) can **read and draft, not commit**.

```python
@mcp.tool() def generate_fpt(asset_id: str, doc_ids: list[str]) -> FPTProcedure
@mcp.tool() def query_deviations(project_id: str, filters: DeviationFilter) -> list[Deviation]
@mcp.tool() def project_health(project_id: str) -> HealthSummary
@mcp.tool() def propose_assignment(project_id: str, constraints: dict) -> Assignment
@mcp.tool() def explain_design_intent(asset_id: str, question: str) -> Answer
```

Same Tool definitions as the in-app agents — single source of truth. AgentPolicy controls per-ApiKey/ServiceAccount which tools are available.

---

## 12. Deployment (Prototype)

| Service | Host |
|---|---|
| Next.js frontend + BFF | Vercel |
| Postgres + pgvector + Auth + Realtime + Storage | Supabase |
| FastAPI AI service | Railway |
| Async job queue | Supabase `agent_jobs` table |
| Notification delivery | Knock |

---

## 13. v0 / v1 / Year-2 Scope Tiering

A 2-person team in 90 days ships **v0**. v1 ships in months 4-6 before the second pilot signs. Year-2 items are deferred regardless.

### v0 (90 days) — what ships

| Context | In v0 | Deferred |
|---|---|---|
| Identity & Access | User, Org, Membership, ProjectParticipation, UserProjectAssignment, 7 roles, RLS, AuditLogEntry, Supabase Auth | SSO, BrandingProfile, per-record confidentiality (default project-level read-all) |
| Project & Portfolio | Project, DisciplineScope (M/E/C/General), Milestone (project + discipline) | Portfolio, campus rollup |
| Asset Registry | Asset, System (M2M), Space (recursive), AssetType | Markup integration, AssetConfiguration, Resource |
| Commissioning Execution | TestProcedureTemplate, TestProcedureInstance (L1-L5), TestResult, WitnessSession, Signature | L1 factory-witness flow at vendor sites |
| Issue & RFI | Deviation, RFI, Submittal + Triage Agent | PunchItem, ChangeOrder |
| Document & Knowledge | Document, DocumentVersion, DocumentChunk, ExtractedSpec (top 3 doc types: submittal cut sheet, SOO, BOD) | Markup first-class, KnowledgePack, ExternalDocumentLink |
| AI & Conversation | Agent, AgentRun, Conversation, Message, Tool, ToolCall, Citation, AgentPolicy, FeedbackRecord. **Three persona agents:** CxExecutionAgent, ProgramAgent (OCA), FieldAssistAgent. EvalRun harness w/ 50-fixture seed. | CMPlannerAgent, DesignIntentAgent, OwnerInsightAgent |
| Notification & Inbox | Subscription, Notification, InboxItem, DeliveryChannel (in-app + email via Knock) | SMS, push, Slack/Teams, Digest, Escalation |

### v1 (Months 4–6, before second pilot signs)
- **Workforce & Scheduling** — Crew, CrewMember, Assignment, Availability, look-ahead view, `CMPlannerAgent`. Defer Resource, DowntimeWindow first-class, P6/MSP CSV.
- **Analytics & Reporting** — Dashboard (presets only), Widget, KPIDefinition, SavedQuery, MetricSnapshot, ReportTemplate (3 hyperscaler-format presets). AI-driven custom reports = v1.5.
- **Handover & Compliance** — TurnoverPackage + Handover Compiler Agent. ComplianceMapping for ASHRAE 202 + OBC 2025. Defer NFPA 72, LEED, AHJ Inspection.
- **MCP server** — 3 read-only tools (`query_deviations`, `project_health`, `explain_design_intent`). Match BlueRithm MCP narrative within 60 days of v0 launch.

### Year 2
- Cost & Commercial (full context; v0 stores `contract_id` as string ref on Project)
- CxAlloy two-way sync
- BMS integrations (Siemens / Honeywell / JCI / Schneider)
- Pharma CQV (IQ/OQ/PQ) language adaptation
- FedRAMP / Protected B authorization
- Cross-discipline dependency graph view (events fire in v0; visual view ships Year 2)

### The v0 demo-ready story
*"Upload your design package → 24 hours later you have a draft test backlog → 30 days later you've executed 200 tests with AI-triaged deviations → 90 days later you've handed over System 1 with a compliance-mapped dossier."*

Every v0 feature serves this narrative. Anything that doesn't gets cut.

---

## 14. Out of Scope (Year 1)

- BIM authoring (Autodesk owns)
- 3D progress capture (Buildots / DroneDeploy — integrate, don't build)
- Continuous Cx / FDD (Year 2 — different buyer)
- FedRAMP / Protected B authorization (Ontario federal — Year 2)
- Native iOS/Android app (PWA first; build native if pilots demand)
- Full event sourcing (timestamped audit log sufficient; revisit for FDA 21 CFR Part 11)
- Portfolio aggregate UI (stub FK only)
- P6 / MS Project live sync (CSV import/export MVP)
- BMS live integration (Siemens, Honeywell, Johnson — Year 2)
- Full Cost & Commercial (Forecast, Retention, Labor cost, Budget — Year 2)
- Pre-sales / CRM (out of CXPro entirely)
- Pharma CQV / IQ-OQ-PQ language adaptation (Year 2)
