# PRD-1 — Tracer Bullet: "First AI Win"

**Status:** Draft for build
**Target duration:** 2–3 weeks
**Owner:** 2-person team
**Architectural reference:** [docs/architecture.md](architecture.md)

---

## 1. Goal

Ship the thinnest possible end-to-end slice that exercises **every architectural layer** of the CXPro v0 stack. The slice is the "First AI Win" moment from §6 of the architecture: a user uploads a single submittal PDF, the AI ingests it, drafts one test procedure with citations, and the user accepts it. Every subsequent PRD builds on this proven foundation.

This is **not** boilerplate. It is a real, demo-able feature — but intentionally narrow on every horizontal axis so we prove the architecture before scaling features.

---

## 2. The User Story (one-liner)

> An OCA signs up, creates a project, uploads one submittal PDF, and within 2 minutes sees an AI-drafted L2 pre-functional checklist for the asset described in that PDF — complete with citations back to the source — and accepts it with one click.

---

## 3. Success Criteria

The PRD is **done** when all of the following are true on a deployed environment (Vercel + Supabase + Railway):

- A new user can sign up, create an org, create a project, and invite a teammate by email — all without engineering intervention.
- Row-Level Security is provably isolating: a user from Org A cannot list, read, or modify any record belonging to Org B (verified by automated test).
- A user can upload one PDF (≤25MB) and see it transition through `uploaded → processing → indexed` states with live UI updates.
- The Python AI service ingests the PDF, embeds chunks into pgvector, extracts one `ExtractedSpec`, and produces a draft `TestProcedureInstance` with at least one `Citation` linked to a `DocumentChunk`.
- The draft appears as an `InboxItem` on the user's home within 2 minutes of upload.
- The user opens the entity-detail page (three-panel desktop / single-scroll mobile layout) and sees the draft procedure, the AI-proposed-action button, and the AI Chat drawer pre-populated with the entity's context.
- Clicking "Accept draft" transitions the procedure from `draft → active` and writes an `AuditLogEntry` with `actor_type: ai`, `confirmed_by_user_id: <user>`.
- All AI outputs without grounding-required citations are refused with a path-forward message (no silent fabrications).
- ESLint context-boundary rules pass — no context imports another context's internals.
- A 10-fixture EvalRun on `CxExecutionAgent` passes in CI before deploy.

---

## 4. In-Scope Features

| Area | What ships |
|---|---|
| Identity & Access | Email/password signup via Supabase Auth. `Organization`, `User`, `Membership`, `ProjectParticipation`, `UserProjectAssignment`. Two roles only: **OCA** and **Cx Engineer**. RLS on every domain table keyed off `ProjectParticipation`. Invite-by-email flow. |
| Project & Portfolio | `Project` create form (name, customer org, target substantial completion date). One `DisciplineScope` auto-created (`Mechanical`) — multi-discipline deferred to PRD-2. |
| Asset Registry | One `Asset` entity, manually created OR detected by ingestion. `AssetType` not modeled yet (string field). |
| Document & Knowledge | `Document`, `DocumentVersion` (always v1 in PRD-1), `DocumentChunk` (pgvector). One `ExtractedSpec` shape, one document type only: **submittal cut sheet**. Supabase Storage for the file blob. |
| Commissioning Execution | `TestProcedureTemplate` (seeded — one "AHU L2 Pre-Functional Checklist" template) and `TestProcedureInstance` with state machine: `draft → active`. No witness, no result, no L3+ — those land in PRD-2. |
| AI & Conversation | `Agent` (one: `CxExecutionAgent`), `AgentRun`, `Conversation`, `Message`, `Tool` (one: `generate_l2_checklist_from_submittal`), `ToolCall`, `Citation`, `AgentPolicy` (OCA can call all tools; Cx Engineer cannot yet), `FeedbackRecord`, `EvalRun` harness (CI-runnable, 10 seed fixtures). DSPy signatures enforce citation contract. **Google Gemini 2.5 Flash** for default inference (free tier covers PRD-1 dev); Gemini 2.5 Pro for complex reasoning. Provider-swappable via DSPy LM init. |
| Notification & Inbox | `Subscription` (auto-provisioned: OCA subscribes to `AgentRunCompleted` for their own runs), `Notification`, `InboxItem`, `DeliveryChannel` = in-app only via **Supabase Realtime** (no Knock in PRD-1 — Knock is added in v1 when email/SMS channels ship). |
| Outbox & Integration | `outbox` table, Postgres trigger emits `NOTIFY 'outbox_new'`, two consumers: Next.js cron worker (handles in-app notifications) and Python LISTENer (handles AI agent runs). Idempotency keys enforced. |
| UX | Inbox-home layout (daily bucket only — weekly view ships PRD-5). Canonical entity-detail page (three-panel desktop / single-scroll mobile). Cmd-K palette stub (searches Projects + Documents only — full search ships PRD-5). |

---

## 5. Out of Scope (explicitly)

- Multi-discipline. Project has one Mechanical scope.
- Multi-doc-type. Only submittal cut sheets parse.
- Witness sessions, signatures, retest history.
- Deviations, RFIs, submittals as workflow artifacts, punch items, change orders.
- Workforce, Scheduling, Crews, Assignments.
- Dashboards, KPIs, reports.
- CxAlloy import.
- ComplianceMapping, RegulatoryFramework.
- Cost & Commercial.
- Handover & Compliance.
- Offline sync. PWA shell exists but no service-worker caching yet.
- Voice-to-step. Camera/QR. Mobile-specific UX polish.
- SMS, Slack, email-delivery refinements beyond a basic Knock-replacement in-app feed.
- MCP server.
- Persona dashboards beyond Inbox.
- BrandingProfile, white-label reports.
- Markup on drawings.
- Custom KPIDefinitions.
- AI-driven custom report generation.

---

## 6. User Stories (build order)

Each story is independently testable and represents 1–3 days of work. Build in this order — each unlocks the next.

### US-1 — Repo bootstrap & infra
**As an engineer**, I want a Next.js + Supabase + Railway project skeleton with CI so I can deploy any commit.

**Acceptance:**
- Next.js 14 app on Vercel, deployed from `main`.
- Supabase project provisioned; migration tool (Drizzle or Supabase CLI) configured.
- Python FastAPI service on Railway, deployed from `main`.
- GitHub Actions CI runs typecheck + ESLint + Python tests on PR.
- `eslint-plugin-boundaries` configured with two stub contexts (`identity`, `commissioning`) to verify boundary enforcement works.
- Health-check endpoints on both services return 200.

### US-2 — Identity, Org, Project, RLS
**As a new user**, I want to sign up, create my org, create a project, and invite a teammate so we can collaborate.

**Acceptance:**
- Supabase Auth email/password signup + magic-link login.
- `Organization`, `User`, `Membership`, `Project`, `ProjectParticipation`, `UserProjectAssignment` tables created with RLS policies.
- Invite-by-email flow: invitee receives email, clicks link, completes signup with role + project pre-assigned.
- Automated test: user_a in org_a cannot list project_b in org_b via any API path.
- One Mechanical `DisciplineScope` auto-created on project creation.

### US-3 — Document upload & storage
**As an OCA**, I want to upload a submittal PDF and see its status so I know the system received it.

**Acceptance:**
- Upload UI accepts PDFs ≤25MB; rejects others with a clear message.
- File stored in Supabase Storage; `Document` row created with `status: uploaded`.
- `DocumentUploaded` event inserted into `outbox` in same transaction as the file metadata write.
- UI shows live status updates via Supabase Realtime as state progresses (`uploaded → processing → indexed`).

### US-4 — Outbox dispatcher (both directions)
**As an engineer**, I want a working outbox dispatcher so cross-process events flow reliably.

**Acceptance:**
- Postgres trigger emits `NOTIFY 'outbox_new'` on every insert into `outbox`.
- Next.js cron worker LISTENs on `outbox_new`, handles in-app notification events, marks `dispatched_at`. Fallback poll every 30s for missed notifications.
- Python service on Railway LISTENs on `outbox_new`, handles AI/ingestion events. Same fallback poll.
- Idempotency: each subscriber records `(event_id, subscriber_name)` in a `outbox_dispatches` table; re-delivery is a no-op.
- Test: kill the Python worker mid-event; restart; event is processed exactly once.

### US-5 — PDF ingestion pipeline
**As the system**, when a Document is uploaded, I want to ingest it so AI agents can reason over its content.

**Acceptance:**
- Python worker consumes `DocumentUploaded` event.
- Detector classifies the PDF; if not `submittal_cut_sheet`, marks `Document.status: failed` with reason "doc type not supported in PRD-1" and emits `DocumentIndexingFailed`.
- For submittal cut sheets: chunker splits PDF into pages, embeds via **Gemini `text-embedding-004`** (768-dim) into `DocumentChunk` (pgvector), captures page coordinates for deep-link.
- One DSPy extractor (`ExtractEquipmentFromSubmittal`) produces one `ExtractedSpec` row (`{equipment_type, manufacturer, model, tag_suggestion, design_specs: {...}}`).
- On success, `Document.status: indexed`, `DocumentIndexed` event emitted to outbox.

### US-6 — AI agent: generate L2 checklist
**As an OCA**, when my submittal is indexed, I want the AI to draft an L2 pre-functional checklist for the asset so I have a starting point.

**Acceptance:**
- Python worker consumes `DocumentIndexed`.
- `CxExecutionAgent` (LangGraph) is invoked with the ExtractedSpec + relevant chunks.
- DSPy module `GenerateL2Checklist` produces a structured `TestProcedureInstance` draft with `steps: [...]` and `citations: list[Citation]` (required by DSPy signature — refuses to return without).
- If citation count < 1 or confidence below threshold, agent refuses; emits `AIRefusal` event with reason; user sees actionable "I need more info" InboxItem instead of silent failure.
- On success: `Asset` row created (if no matching tag exists), `TestProcedureInstance` row inserted with `status: draft, actor_type: ai`, `AgentRun` row recorded with full audit (input, output, tool calls, citations, token cost, latency, model version).
- `AgentRunCompleted` event emitted.

### US-7 — Inbox & in-app notification feed
**As an OCA**, I want to see "AI drafted a checklist for you to review" on my home so I know what to act on next.

**Acceptance:**
- `Subscription` row auto-created for the OCA at project assignment time (subscribed to `AgentRunCompleted` for their own runs).
- Next.js worker consumes `AgentRunCompleted`, creates `Notification` + `InboxItem` (because the agent output requires user action).
- Home page is the Inbox view; new `InboxItem` appears via Supabase Realtime without page refresh.
- Daily bucket only (overdue / today / flagged). Weekly view deferred.
- `Notification` vs `InboxItem` split is real — informational notifications never enter the to-do list.

### US-8 — Entity detail page + AI Chat drawer
**As an OCA**, I want to open the draft procedure and see its content, citations, and ask the AI questions about it.

**Acceptance:**
- Three-panel layout on desktop ≥1024px; single-scroll on smaller.
- Center column: state badge, identity, AI-proposed-action button (distinct visual treatment — lightning bolt icon, "AI proposed" label).
- Each step displays inline citation chips ("Submittal pg. 4"). Clicking a chip opens the source PDF at that page coordinate.
- Right drawer default tab = AI Chat. Conversation auto-scoped to this `TestProcedureInstance`. User can ask "why this step?" and get a grounded answer with new citations.
- Activity tab shows the AgentRun audit entry (`AI drafted at <timestamp>, model: gemini-2.5-flash, citations: 3`).
- Cmd-K opens a basic palette searching Projects + Documents.

### US-9 — Accept (state transition + audit)
**As an OCA**, I want to accept the AI draft so it becomes the active procedure for execution.

**Acceptance:**
- "Accept draft" button visible only when state = `draft` and user role permits (OCA only in PRD-1).
- Click transitions `TestProcedureInstance.status: draft → active` in a single transaction.
- `AuditLogEntry` written: `entity_type: test_procedure_instance, entity_id, from_state: draft, to_state: active, actor_user_id: <user>, actor_type: human, confirmed_ai_run_id: <agent_run_id>, timestamp`.
- `TestProcedureInstanceActivated` event emitted to outbox (no consumers in PRD-1; proves the pattern for PRD-2).
- InboxItem marked `action_state: acted`.
- Optional thumb-up/down on the AgentRun writes a `FeedbackRecord`.

### US-10 — EvalRun harness in CI
**As an engineer**, I want AI quality regressions to block deploys so we don't ship a worse agent.

**Acceptance:**
- 10 seed fixtures in `ai_service/eval/fixtures/` — each is `(submittal_pdf, expected_extracted_spec, expected_min_citations, expected_steps_count_range)`.
- `pytest ai_service/eval/test_cx_execution.py` runs the agent against each fixture and asserts: citation count ≥ expected, structured output schema valid, key extracted fields present.
- GitHub Actions runs eval suite on PR; failures block merge.
- README documents how to add a new fixture (every customer-correction during pilots becomes a fixture).

---

## 7. Schema sketch (minimum for PRD-1)

```
-- Identity
organizations(id, name, type, created_at)
users(id, email, display_name, created_at)
memberships(user_id, org_id, default_role, created_at)
project_participations(org_id, project_id, role_in_project, created_at)
user_project_assignments(user_id, project_id, role, discipline_scope_ids[], authority, created_at)

-- Project
projects(id, name, owner_org_id, customer_org_id, target_substantial_completion, status, created_at)
discipline_scopes(id, project_id, name, lead_user_id, status)
milestones(id, project_id, discipline_scope_id NULL, name, planned_date, actual_date)

-- Asset
assets(id, project_id, discipline_scope_id, tag, equipment_type, manufacturer, model, status, location_text, design_specs JSONB)

-- Document & Knowledge
documents(id, project_id, title, doc_type, status, storage_uri, uploaded_by, uploaded_at)
document_versions(id, document_id, revision, storage_uri, created_at)
document_chunks(id, document_version_id, page, coords JSONB, text, embedding vector(768))  -- gemini text-embedding-004
extracted_specs(id, document_version_id, source_chunk_ids UUID[], spec_type, payload JSONB)

-- Commissioning
test_procedure_templates(id, name, level, applies_to_equipment_type, version, body JSONB)
test_procedure_instances(id, project_id, asset_id, template_id, level, status, body JSONB, actor_type, drafted_by_agent_run_id, created_at)

-- AI & Conversation
agents(id, name, persona_affinity, model, dspy_module_ref, agent_policy_id)
agent_runs(id, agent_id, input JSONB, output JSONB, status, tool_calls JSONB, token_cost_usd, latency_ms, triggered_by_user_id, triggered_by_event_id, model_version, created_at)
conversations(id, project_id, user_id, scope_entity_type, scope_entity_id, created_at)
messages(id, conversation_id, role, content, agent_run_id NULL, created_at)
tools(id, name, input_schema JSONB, output_schema JSONB, permission_policy JSONB)
tool_calls(id, agent_run_id, tool_id, input JSONB, output JSONB, latency_ms, error)
citations(id, agent_run_id, source_kind, source_id, source_chunk_id NULL, snippet, confidence)
agent_policies(id, name, allowed_tools UUID[], requires_confirmation_for UUID[])
feedback_records(id, agent_run_id, user_id, rating, correction_text, created_at)

-- Notification & Inbox
subscriptions(id, user_id, event_topic, delivery_channels TEXT[])
notifications(id, recipient_user_id, source_event_id, channel, status, payload JSONB, deep_link)
inbox_items(id, recipient_user_id, source_notification_id, action_state, entity_type, entity_id, due_at NULL)

-- Audit & Outbox
audit_log_entries(id, project_id, entity_type, entity_id, from_state, to_state, actor_user_id, actor_type, justification, confirmed_ai_run_id NULL, occurred_at)
outbox(id, event_type, payload, source_context, occurred_at, dispatched_at, retry_count)
outbox_dispatches(event_id, subscriber_name, dispatched_at)  -- idempotency
```

All tables get RLS policies keyed off `project_participations` (where applicable) or `memberships`.

---

## 8. Architectural surface exercised

Confirms these architecture decisions work end-to-end before further build:

- [x] Next.js + Supabase + Railway split
- [x] Supabase Auth + RLS multi-tenant isolation
- [x] pgvector for AI retrieval
- [x] DSPy structured outputs with mandatory-citation signature
- [x] LangGraph agent execution
- [x] Outbox + LISTEN/NOTIFY dispatcher across two languages
- [x] State-machine + AuditLogEntry pattern with `actor_type: ai|human`
- [x] Inbox vs Notification split
- [x] Canonical three-panel entity-detail page
- [x] ESLint context boundaries
- [x] EvalRun in CI as deploy gate
- [x] FeedbackRecord loop UI

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| DSPy citation enforcement is finicky in early versions | Spike US-6 in week 1; if DSPy is unstable, fall back to manual Pydantic validation + retry with `response_format` |
| pgvector retrieval quality from one chunked PDF is poor | Use page-sized chunks with overlap; test with 5 real submittals before declaring US-5 done |
| Outbox dispatcher edge cases (worker crash, duplicate delivery) | Idempotency table is non-negotiable; chaos-test as part of US-4 acceptance |
| Railway cold starts add latency to first AI call | Keep Python worker warm with `min_instances: 1` (Railway supports); cost ~$15/mo |
| Scope creep — "while we're at it, let's add witness sessions" | Reject anything not in §4; everything else is PRD-2+ |
| Real submittal PDFs are messier than test fixtures | Get 3 real cut sheets from a Cx contact before US-5 starts |

---

## 10. Definition of Done

- All 10 user stories pass their acceptance criteria.
- A live demo flow on the deployed environment: signup → create project → upload PDF → InboxItem appears → open entity → see draft + citations → click "Accept" → state transitions → audit log records `actor_type: ai` + `confirmed_by: human`.
- EvalRun passes 10/10 in CI.
- RLS isolation automated test passes.
- ESLint context boundary check passes.
- README updated with local-dev setup, deploy steps, and how to add an EvalRun fixture.
- Demo video (2 min, screen-recording) shipped to the team Slack/Notion. This is the first marketing asset.

---

## 11. Visual Reference (mockup alignment)

A reference mockup exists in [frontend-design/](../frontend-design/). PRD-1 builds against the **Blueprint** direction (light paper-like, Archivo + JetBrains Mono, blue + cream palette, reticle brand mark).

### Reuse from mockup (lift directly into PRD-1 implementation)

| Pattern | Source file | Usage in PRD-1 |
|---|---|---|
| Three-panel layout shell (left nav, center, right drawer) | `blueprint-app.jsx` | The canonical layout for the entity-detail page (US-8) |
| AI Chat drawer with `Ask | Generate | Scan` tabs + confidence badges | `blueprint-app.jsx` (AI Panel section) | Drawer default tab in entity-detail page; PRD-1 ships only the **Ask** tab (Generate moves to PRD-2 where it can drive workflow; Scan defers to PRD-6 mobile) |
| Color palette: `#1240FF` blue, `#1a1a1a` near-black, `#E6E1D4` cream, paper background | `blueprint.css` | Global theme tokens |
| Typography: Archivo (UI), JetBrains Mono (IDs, metrics, tags) | `blueprint.css` (`.bp-mono` class) | Lift class verbatim |
| Equipment glyph SVGs (AHU, Chiller, Pump line-drawn icons) | `blueprint-app.jsx` glyphs | Asset detail headers |
| State badges as colored pills (`Energized`, `Under Install`, etc.) | `blueprint-app.jsx` | TestProcedureInstance state badge |
| Line-numbered checklist items (1.1, 1.2, …) with `[Y] [N] [NA]` buttons + inline AI suggestion pills | `blueprint-app.jsx` Checklist Detail | The procedure body rendering on entity-detail page |
| Confidence display pattern (`CONF 94%`) | `blueprint-app.jsx` AI Panel + Scan | Lift the badge component; reuse for citation confidence in the AI Chat drawer |
| Monospace IDs (tags, serials, run IDs) | mockup convention throughout | All entity IDs in PRD-1 |
| Activity timeline rendering | `blueprint-app.jsx` Dashboard activity strip | Activity tab in the right drawer |

### Gaps in mockup that PRD-1 must add (architecture requirements not in mockup)

These ship in PRD-1 even though they're absent from the reference design. The mockup helps with the *look*; the architecture defines the *behavior*.

| Architecture requirement | Status in mockup | PRD-1 user story |
|---|---|---|
| **Inbox-primary home** (§4.1) — default landing surface | Not present (mockup defaults to Equipment list) | **US-7** — must design and build from scratch in Blueprint style; daily bucket only in PRD-1 |
| **AI-proposed action button** — distinct lightning-bolt visual treatment, one-click confirm (§4.2) | Mockup has AI chat output but no proposed-action button on entity headers | **US-8** — net-new component; place in entity header action area, visually distinct from human-initiated actions |
| **Refusal path-forward UX** — refusals propose next step + become InboxItems (§5) | Not modeled in mockup | **US-6 + US-7** — design a refusal card variant for AI Chat drawer and a corresponding InboxItem type |
| **FeedbackRecord controls** — thumb up/down + "correct this" on every AI output (§5) | Not in mockup | **US-9** — add a small feedback footer to every AgentRun-rendered card in the AI drawer |
| **Cmd-K command palette** — first-class, Day 1 | Referenced in mockup code but not rendered | **US-8** — implement minimal palette (searches Projects + Documents only in PRD-1) |
| **`actor_type: ai`** distinction in Activity tab | Mockup activity strip exists but doesn't distinguish AI vs human entries | **US-9** — render AI entries with the lightning-bolt glyph + "AI · confirmed by [user]" line |

### Mockup features explicitly out of PRD-1 scope (defer per architecture)

These exist in the mockup and are good — but they're beyond PRD-1's tracer-bullet slice and ship in later PRDs.

- **Drawings / floor plan markup** (`blueprint-drawings.jsx`) → Year 2 Markup aggregate
- **Reports** (`blueprint-reports.jsx`) → PRD-5
- **Integrations** (`blueprint-integrations.jsx`) → Year 1 H2 (Procore connector)
- **Multi-project Projects view** → PRD-5
- **AI Generate tab** (spec→checklist 4-step flow) → PRD-2 (PRD-1's `CxExecutionAgent` runs the same flow but triggered by upload event, not user-initiated from drawer)
- **AI Scan tab** (nameplate OCR) → PRD-6 mobile
- **Dashboard with charts** → PRD-5

---

## 12. After PRD-1

PRD-2 will expand horizontally — adding the full L1-L5 test workflow, witness sessions, signatures, retest history. The tracer-bullet pattern (one user story per architectural surface, each independently testable) repeats.

The architecture document does not change; this PRD validated it.
