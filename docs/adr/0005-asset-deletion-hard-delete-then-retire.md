---
status: accepted
---

# Asset deletion is hard-delete pre-FK, retire-only thereafter

Assets carry a `status` column (`active | retired | decommissioned`) and obey a two-mode delete contract. While no FK in the database references an Asset (no test instance, no deviation, no document, no system membership), `DELETE FROM assets WHERE id = ?` is permitted — this is the "I just fat-fingered a draft" case and we honor it. The moment any FK exists, the DELETE endpoint returns HTTP 409 and the only available transition is `status = 'retired'` (and later, post-handover, `status = 'decommissioned'`). There is no `deleted_at` column and no soft-delete predicate scattered across queries. The two obvious alternatives were rejected: pure hard-delete with `ON DELETE RESTRICT` (technically clean but forces users to manually unwind their own commissioning work to remove any typo'd asset that has even one test attached, which is hostile), and pure soft-delete with `deleted_at` (the lazy default, which silently leaks ghost assets into audit queries whenever a `WHERE deleted_at IS NULL` predicate is forgotten — unacceptable in a regulated commissioning context where turnover dossiers must be complete and exact). The hybrid honors both the real user workflow (drafts are reclaimable) and the real domain lifecycle (signed-off Assets are never deleted, they retire).

## Consequences

- Default list views filter `status = 'active'`; retired and decommissioned Assets are visible via explicit filter or on the Asset detail page itself.
- Tag uniqueness constraint is `(project_id, tag) WHERE status != 'retired'` — retired Assets free their Tag for reuse by a new Asset, but the rename requires explicit user confirmation in the UI (matches CxAlloy behavior).
- Cross-context queries (test reports, deviation logs, dossier assembly) join `assets` without any status filter — historical Assets must remain reachable.
- The delete endpoint is a single resource with branching logic, not two endpoints. Surface the 409 with an actionable "Retire instead" affordance in the UI.
- Points have no status column. When their owning Asset retires, Points retire transitively via the join. When the Asset is hard-deleted (pre-FK), Points cascade-delete with it.
- Same hard-delete-then-retire contract should be reused for Space and System aggregates if/when their own FK chains grow — defer the column addition until that's needed.
