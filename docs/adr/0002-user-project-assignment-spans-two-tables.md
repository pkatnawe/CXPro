---
status: accepted
---

# UserProjectAssignment is a logical aggregate spanning two physical tables

The architecture defines `UserProjectAssignment` as `User × Project × Role × DisciplineScope(s) × authority` — the keystone of project-level access. The schema in [migrations/001_party_model.sql](../../migrations/001_party_model.sql) ships this aggregate as two tables instead of one: `participations(user_id, project_id)` is the project-level gate that RLS keys off, and `assignments(user_id, discipline_scope_id)` is the per-discipline seat. We accepted this split rather than collapsing them into a single `user_project_assignments` table because the existing RPCs (`create_org_with_membership`, `create_project_with_discipline`, `invite_user_by_email`) and the dashboard UI already reference `participations` by name; renaming would force lockstep changes across SQL functions, RLS policies, frontend, and integration tests for no behavioral gain. `UserProjectAssignment` is a domain concept, not a table — treat the two-table shape as an implementation detail.

## Consequences

- All access-control code that needs both "is this user on this project?" and "in which disciplines?" must join `participations` and `assignments`.
- RLS policies that gate by discipline must reach through `assignments`; org-only policies stay on `memberships`.
- Future Role / Permission expansion (replacing the hardcoded `OCA | cx_engineer` enum) lives on `memberships.role`, not on a new column in either of these tables.
