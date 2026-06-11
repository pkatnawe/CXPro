# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

This repo is single-context. The canonical glossary is **[`CONTEXT.md`](../../CONTEXT.md)** at the repo root, sourced from the per-context `**Language:**` lines in `docs/architecture.md`. Architecture (aggregates, events, bounded contexts, cross-context flows) stays in **[`docs/architecture.md`](../architecture.md)**. ADRs live in **[`docs/adr/`](../adr/)**. The PRD-1 spec lives in **[`docs/prd-1-tracer-bullet.md`](../prd-1-tracer-bullet.md)** and is the next-most-authoritative source for current scope.

## Before exploring, read these

- **[`CONTEXT.md`](../../CONTEXT.md)** — the ubiquitous language. Start here when you need to name something.
- **[`docs/architecture.md`](../architecture.md)** — bounded contexts, aggregates, events, cross-context flows. The "how it fits together" doc.
- **[`docs/prd-1-tracer-bullet.md`](../prd-1-tracer-bullet.md)** — the active spec. Read the slice you're working on (or all of them for cross-cutting work).
- **[`docs/adr/`](../adr/)** — ADRs that touch the area you're about to work in.

If any of these don't exist, proceed silently. Don't flag absence; don't suggest creating them upfront. `/grill-with-docs` will create ADRs lazily when decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms — say `OCA` not "owner", `InboxItem` not "task", `TestProcedureInstance` not "checklist instance", `DisciplineScope` not "discipline". Check `CONTEXT.md`'s **Flagged ambiguities** section before reaching for "task" or "account".

If the concept you need isn't in `CONTEXT.md` yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs` to resolve and add to `CONTEXT.md`).

## Frontier bets stay out of the domain model

Marketing/strategy features (see `docs/business-overview/ai-strategy.html`) enter `CONTEXT.md` and the schema **only when a customer funds a pilot of them**. Do not reserve speculative aggregates or "future-proof" columns for unfunded bets — the site is the only home for frontier language until then. When a bet is funded, it gets grilled (`/grill-with-docs`) and earns its entries.

## Flag ADR conflicts

If your output contradicts an existing ADR (or an explicit architectural decision in `docs/architecture.md`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
