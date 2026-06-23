# CXPro Commissioning Knowledge Base

The grounding corpus (**Layer A**) for CXPro's role agents — our own working knowledge of the
commissioning domain, written in our own words and structured for retrieval. Original work
product: no external sources are cited, quoted, or reproduced. See
`docs/business-overview/agent-training.html` for how this layer feeds the agents alongside
project documents (Layer B) and org-scoped lessons (Layer C).

## Contents

| File | Domain | Primary agents |
|---|---|---|
| `01-commissioning-process.md` | What Cx is, the document chain, team/roles, the four phases, L1–L5 testing, deficiencies, ongoing/retro Cx | All (foundational) |
| `02-datacenter-systems-for-cx.md` | Power & cooling systems, how each is tested L1–L5, failure modes, Tiers, monitoring | Cx Engineer, Field Tech, OCA |
| `03-datacenter-operations-handover.md` | Day-2 operations discipline, the Systems Manual handover, availability, change control | Owner/FM |
| `04-functional-test-library.md` | Reusable FPT/IST templates (objective, prereqs, steps, acceptance, failure modes) for every major system | Cx Engineer, Field Tech |
| `05-deviations-and-issues.md` | Deviation lifecycle, severity taxonomy, root-cause categories, routing, closeout, AI triage | Cx Engineer, OCA, Construction Mgr |
| `06-roles-and-agent-playbooks.md` | Per-agent job, inbox/actions, draft→confirm gate, retrieval scope, guardrails, RACI | All (persona grounding) |
| `07-glossary-and-acronyms.md` | The ubiquitous language — acronyms + key term definitions | All (shared vocabulary) |
| `08-standards-and-compliance.md` | Standards landscape (Guideline 0/202, LEED Cx, Uptime Tiers, CQV/21 CFR Part 11) and the cite-don't-copy rule | OCA, Design Engineer |
| `09-document-templates.md` | Structure/contents/acceptance of every deliverable (OPR → Cx Report) | OCA, Cx Engineer, Design Engineer |
| `10-sequences-of-operation.md` | SOO anatomy, points lists, modes, representative sequences, line-by-line FPT verification | Design Engineer, Cx Engineer |
| `11-schedule-coordination-and-field-safety.md` | Cx scheduling, level-gating, witnessing; field safety (LOTO, arc-flash) & evidence capture | Construction Mgr, Field Tech |

## Which agent retrieves what (retrieval-scope map)

| Role agent | Core notes to ground on |
|---|---|
| **OCA** (Owner's Cx Authority) | 01, 06, 05, 08, 09, 03 |
| **Cx Engineer** | 01, 04, 10, 05, 02, 09 |
| **Construction Manager** | 11, 05, 06, 01 |
| **Field Technician** | 04, 11, 02, 07 |
| **Design Engineer** | 10, 08, 09, 02 |
| **Owner / Facility Manager** | 03, 09, 01, 07 |

> All agents also draw on `06` (their own playbook), `07` (shared vocabulary), and `01`
> (the foundational process). Project-specific facts come from Layer B (the customer's
> documents), never from this layer.

## House rules (for anyone adding to this KB)

- **Original prose only.** Concepts, process, and facts — never copied text. Do not name or
  allude to external books/authors/publishers. Standards may be referenced by their public
  identifier (e.g. "ASHRAE Guideline 0") but their text is never reproduced — cite the clause,
  point to the licensed copy (see `08`).
- **House structure:** every topic as **concept → why it matters → how it maps to CXPro**
  (which role agent · which L1–L5 level · which document).
- **Shared vocabulary:** the six agents, the L1–L5 levels, and the
  OPR → BoD → Cx Plan → Specs/SOO → Checklists → FPT → Issues Log → Systems Manual → Cx Report
  chain are used consistently across every file.
- Keep `07` consistent with the site Glossary page.
