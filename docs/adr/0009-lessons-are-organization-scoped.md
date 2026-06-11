---
status: accepted
---

# Lessons are Organization-scoped; cross-org learning is model-level only

The lesson engine ("every project makes the next one smarter") needs a confidentiality boundary before it exists. We decided a `Lesson` is an AI & Conversation aggregate scoped to the **Organization**: an org's lessons are retrievable across all of that org's projects and never across org boundaries. Cross-organization improvement happens only statistically — eval sets and DSPy module optimization — never as retrievable records. Rejected: project-scoped lessons (nothing compounds; contradicts the product's core promise) and a global anonymized pool ("anonymized" equipment-failure data on identifiable hyperscale projects would not survive procurement or legal review).

The org boundary is a sales asset, not a concession: a Cx provider's accumulated lessons across every job they run become *their* proprietary moat inside CXPro, deepening their lock-in — and the pitch to security reviewers is clean: "your lessons are yours; your competitors never see them."

## Consequences

- `Lesson` rows carry `organization_id`, not just `project_id`; RLS extends accordingly (org membership, not project participation, gates lesson retrieval).
- Fleet-wide pattern surfacing ("3 of 12 units of this pump model…") may only aggregate within one org's visibility. Cross-customer model-level improvements must be demonstrably non-retrievable (no memorized record regurgitation) — an eval-gate concern.
- Marketing copy must say "your next project starts smarter," not "the next project" — the compounding is per-customer.
