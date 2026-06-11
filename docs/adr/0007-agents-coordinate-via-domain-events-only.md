---
status: accepted
---

# AI agents coordinate via domain events only — no agent-to-agent invocation

CXPro's per-persona agents (CMPlannerAgent, CxExecutionAgent, FieldAssistAgent, ProgramAgent, …) coordinate exclusively by emitting and subscribing to domain events through the existing Transactional Outbox rails — the same rails that drive human notifications. No agent ever invokes another agent directly, and there is no central orchestrator agent. The "multi-agent choreography" the product sells (one disruption → each role's agent reacting in its own scope) is event choreography in the literal architectural sense, not orchestration.

The trendy alternative in 2026 — direct agent-to-agent messaging or a planner agent that delegates to role agents — was rejected for three reasons: (1) a chained A2A call has no clean answer to "whose permissions govern this action?", which breaks the AgentPolicy guarantee that every agent operates strictly within its human's permission envelope; (2) a central orchestrator must hold every role's permissions, recreating the mega-agent that architecture.md §10 explicitly rejects; (3) event-mediated coordination gets auditability for free — every cross-role effect is already an outbox row plus an InboxItem, which is the audit posture a compliance product needs.

## Consequences

- Agent reactions to other agents' work are asynchronous and eventually consistent; multi-step coordination is slower than direct A2A. Accepted price.
- Every cross-agent interaction is inspectable post-hoc as a sequence of domain events and AgentRuns; no new audit surface is needed.
- A "smarter" planner that reasons across roles must be expressed as a richer event vocabulary (e.g., `DowntimeWindowScheduled`, `AssignmentReassigned`), not as a privileged agent. If the event vocabulary feels insufficient, extend it — do not add an agent-to-agent channel.
- Runaway-loop protection reduces to outbox idempotency keys plus per-agent rate limits; no distributed agent-call-graph tracing required.
