# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

This repo is single-context. There is no `CONTEXT.md` or `CONTEXT-MAP.md` at the root. Instead, the project's domain language and architecture both live in **[`docs/architecture.md`](../architecture.md)** — treat it as the canonical CONTEXT source. The PRD-1 spec lives in **[`docs/prd-1-tracer-bullet.md`](../prd-1-tracer-bullet.md)** and is the next-most-authoritative source for current scope and terminology.

There is no `docs/adr/` directory yet. ADRs may be created lazily by `/grill-with-docs` when decisions crystallize.

## Before exploring, read these

- **[`docs/architecture.md`](../architecture.md)** — the system's bounded contexts (identity/, commissioning/), domain entities (OCA, cx_engineer, Org, Project, DisciplineScope, Document, ExtractedSpec, TestProcedureInstance, InboxItem, AgentRun, AuditLogEntry, FeedbackRecord, Citation, EvalRun), and the architectural patterns in use (transactional outbox, DSPy-typed AI modules, party model + RLS, Inbox-as-home).
- **[`docs/prd-1-tracer-bullet.md`](../prd-1-tracer-bullet.md)** — the active spec. Read the slice you're working on (or all of them for cross-cutting work).
- **`docs/adr/`** — if it exists, read ADRs that touch the area you're about to work in.

If any of these don't exist, proceed silently. Don't flag absence; don't suggest creating them upfront. `/grill-with-docs` will create ADRs lazily when decisions actually get resolved.

## Use the architecture doc's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/architecture.md`. Don't drift to synonyms — say `OCA` not "owner", `InboxItem` not "task", `TestProcedureInstance` not "checklist instance", `DisciplineScope` not "discipline".

If the concept you need isn't in the architecture doc yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR (or an explicit architectural decision in `docs/architecture.md`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
