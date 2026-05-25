# PRD-5: v0 Stabilization — bug-fix sweep

Status: needs-triage
Glossary: [CONTEXT.md](../CONTEXT.md)
Related: PRD-1 (tracer bullet), PRD-2 (Blueprint frontend port), PRD-3 (v0 Teams invite flow), [ADR-0002](./adr/0002-user-project-assignment-spans-two-tables.md)

---

## Problem Statement

A new user signs up to CXPro, creates an Organization, creates a Project as `OCA` — and the Project does not appear on their dashboard. They can confirm via direct DB inspection that the row exists, but the dashboard query returns nothing. There is no error message, only an empty state that reads "No projects yet. Create one to get started!" — which is the same copy shown to users who have not created anything yet. The OCA has no in-app way to recover.

Adjacent screens reinforce the confusion rather than expose the underlying cause:

- The Project detail page silently redirects to `/dashboard` when access can't be verified, with only a `console.error`.
- The Entity detail page silently redirects to `/inbox` for the same class of failure, and defaults the user's role to `cx_engineer` if no participation row exists — granting an unintended permission rather than refusing the page.
- The Profile page renders with an empty role field if the user has no memberships, without warning that the account isn't seated anywhere yet.
- Multiple Supabase error handlers display the literal string "Unknown error" because they check `error instanceof Error` against Supabase RPC error objects (which are plain objects, not `Error` instances). The real `.message` is in the object but is never surfaced.
- The checklist accept flow (`accept_draft_test_procedure`) references columns that do not exist on the `assignments` aggregate, so the first attempt to accept any draft will crash with a Postgres error.
- The `getProjectDashboard` query references `agent_runs.test_procedure_instance_id`, which does not exist on the `agent_runs` table, producing a console error on every project visit.

The cumulative effect is that every shipped v0 feature — Project creation, Project listing, Entity inspection, checklist acceptance, invitation acceptance — has a visible defect or silent failure for at least one realistic user flow.

The most-reported symptom is from user `shlokp98@icloud.com`, the OCA who created the first organization on this system. DB inspection: `memberships=1`, `participations=0`, `assignments=0`. The cause is that `create_project_with_discipline` inserts the Project and a single `Mechanical` DisciplineScope, but never inserts a `participations` row for the caller. The creator is never seated on their own Project.

## Solution

A focused bug-fix sweep — every shipped v0 feature works end-to-end for a freshly-signed-up OCA and for an invited `cx_engineer`. No silent failures, no masked Supabase errors, no SQL functions that reference columns the schema does not have.

From the OCA's perspective: I sign up, I land on the dashboard, I see a "Create your organization" prompt because I haven't made one yet. I create one. I create a Project. **The Project appears immediately on my dashboard with all four DisciplineScopes seeded.** I can open it. I can open any entity within it. I can accept a draft checklist if I have OCA role. If something fails, I see why.

From the `cx_engineer`'s perspective: I accept an invitation via magic link. I land on my Project page. The Members tab shows me with my discipline. I can read and edit anything in my discipline scope. If the backend URL is misconfigured in my environment, the form tells me — not a "Failed to fetch" with no detail.

## User Stories

1. As an `OCA` who just created an Organization, I want creating a Project to automatically seat me on that Project, so that the Project appears on my dashboard immediately.
2. As an `OCA`, I want creating a Project to automatically assign me to all four canonical DisciplineScopes (Mechanical, Electrical, Controls, General Construction), so that I have write access to every discipline of the Project I own.
3. As an `OCA` creating a Project, I want the seating to happen atomically with the Project insert, so that I never end up in a half-state where the Project exists but I'm not seated on it.
4. As a developer running the dashboard query, I want `getProjectDashboard` to reference columns that actually exist on `agent_runs`, so that the page doesn't error in the browser console on every project visit.
5. As an `OCA` using the checklist accept flow, I want `accept_draft_test_procedure` to read my role from `memberships` (where the role enum is stored), so that accepting a draft doesn't crash.
6. As a `cx_engineer` attempting to accept a draft I don't have permission for, I want a clear "permission denied" response from the accept function, so that I know why my action was refused.
7. As any user, when a Supabase RPC or query fails, I want to see the real underlying error message — not the literal text "Unknown error", so that I can tell `duplicate key` from `permission denied` from `network timeout`.
8. As a user navigating to a Project I don't have access to, I want a meaningful in-page error, so that I'm not silently redirected away with no explanation.
9. As a user navigating to an Entity I don't have access to, I want the same — meaningful error, no silent redirect, no role defaulting to `cx_engineer`.
10. As a user landing on the dashboard with Memberships but zero Projects visible, I want the empty state to distinguish "you don't have a Project yet" from "your Projects failed to load", so that the empty state isn't misleading.
11. As a user on the Profile page who has no Memberships yet, I want to see a clear note that I haven't joined any Organization, so that I can take action rather than seeing a blank role field.
12. As an `OCA` using the invite form on the Members tab in a deployed environment, I want the form to call the backend at a configured URL, so that invites work outside of localhost.
13. As a developer cloning the repo, I want Python bytecode files excluded from version control, so that every backend run doesn't generate noisy diffs.
14. As an `OCA` who has the deeper architectural pattern in mind, I want the OCA-implicit-project-access question (membership-grants-participation vs. materialize-participation-on-create) called out for a future architecture decision, so that the v0 fix doesn't quietly lock in the wrong long-term shape.
15. As a developer running the manual 9-step demo from PRD-3, I want the demo to actually be runnable end-to-end after this PRD lands, so that the HITL verification gate is meaningful.

## Implementation Decisions

### Backend — three migrations

- **Migration `014_seat_project_creator.sql`** — rewrite `create_project_with_discipline(name, description, org_id)` so it does all of the following atomically:
  - Insert the Project row.
  - Insert four DisciplineScope rows for the new Project (Mechanical, Electrical, Controls, General Construction), superseding the earlier "Mechanical only" version.
  - Insert one `participations` row for `auth.uid()` × the new Project.
  - Insert four `assignments` rows for `auth.uid()` × each new DisciplineScope.
  - Use `SECURITY DEFINER`, `SET search_path = public`, and explicit `ALTER FUNCTION ... OWNER TO postgres` so the function bypasses RLS for the insert chain. This pattern is recorded in migration 012 as the canonical safeguard against the "Database error saving new user" class of regression.

- **Migration `015_fix_agent_runs_column.sql`** — resolve the `agent_runs.test_procedure_instance_id` mismatch. Two possible directions, chosen at implementation time by reading architecture.md §2.3 Context 9:
  - If the architecture says `agent_runs` should reference its target entity, add the column to `agent_runs` and backfill where needed.
  - If the architecture says `agent_runs` is target-agnostic and the relationship lives elsewhere (e.g. `test_procedure_instances.agent_run_id`), update the frontend query to match the existing shape instead. No schema change.
  - Decision recorded in the migration's header comment so future readers see the trade-off.

- **Migration `016_fix_accept_draft_test_procedure.sql`** — rewrite the function. The current definition joins `assignments a ON a.participation_id = p.id` (no such column) and reads `a.role` (no such column). Replace with a `memberships` lookup keyed by user and org. Function stays `SECURITY DEFINER`, with `SET search_path = public` and `OWNER TO postgres`.

### Frontend — three behavioral changes, no new modules

- **Use the existing `getErrorMessage` helper everywhere.** The helper at `frontend/src/lib/error.ts` already correctly unwraps `Error` instances, Supabase RPC error objects (`{message, code, details}`), and plain values. Audit and replace every `error instanceof Error ? error.message : 'Unknown error'` (and the `err instanceof Error ? err.message : 'Failed to …'` variants) with `getErrorMessage(...)`. Known sites: the dashboard page, the profile page (three sites), the project detail page, the entity detail page, the sign-in / sign-up forms.

- **Bound every `.single()` call.** Every `.single()` that may legitimately return zero rows changes to `.maybeSingle()` with explicit handling for the `null` case. Where `.single()` is genuinely correct (the row must exist), assert that and surface the error to the user — do not `console.error` and silently `router.push`.

- **Distinguish empty states inline on the dashboard.** Today the message "No projects yet. Create one to get started!" appears whether the user has zero memberships, zero projects loaded, or a failed query. The dashboard page already knows all three pieces (memberships, projects, error). Compute the message inline in the page (no new helper module — per direction). Three branches: zero memberships → onboarding copy; >0 memberships but empty projects with no error → "no projects yet" copy; >0 memberships but error → "couldn't load projects, retry" copy with a retry button.

- **Members page API URL.** Replace the hardcoded `http://localhost:8000/invites` with `process.env.NEXT_PUBLIC_API_URL` (fallback to `http://localhost:8000` for dev). Add `NEXT_PUBLIC_API_URL` to the example env file checked into the repo.

### Repo hygiene — one tiny change

- Add `**/__pycache__/` and `*.pyc` to `.gitignore`. `git rm --cached` the currently-tracked `.pyc` files. One commit, no application code touched.

### Modules touched (per direction: no new modules)

This PRD modifies behavior inside three existing deep modules and expands the use of a fourth already-built helper:

- `create_project_with_discipline` (Postgres function — deep module, single-RPC interface, complex transactional body).
- `accept_draft_test_procedure` (Postgres function — deep module, role-check + state-transition).
- `getProjectDashboard` (frontend lib query function — its column references change; signature unchanged).
- `getErrorMessage` (frontend helper — already exists, usage widens; signature unchanged).

No new TS modules, no new Postgres functions beyond replacing the broken ones. The dashboard empty-state logic stays inline in the page.

## Testing Decisions

A good test asserts externally visible behavior — what the database ends up containing after the function runs, what message the user sees in the UI, what error the RPC returns — not the internal sequence of inserts or the specific Supabase method called. Mocks are confined to the boundary where the real service is slow or costs money. The most consequential change in this PRD (seating the project creator) cannot be meaningfully tested with mocks because the entire point of the change is the transactional database state.

| Module | Test type | Prior art |
|---|---|---|
| `create_project_with_discipline` | pytest integration against real Supabase. Cases: caller is now in `participations` for new project; caller is in `assignments` for all four DisciplineScopes; second invocation of the function on the same project is idempotent; the function works when called by a user without superuser privileges (i.e., the BYPASSRLS owner pattern holds). Marked `@pytest.mark.integration`. | Mirrors the integration patterns in [backend/test_redeem_pending_invitations.py](../backend/test_redeem_pending_invitations.py) and [backend/test_slice_06.py](../backend/test_slice_06.py). |
| `accept_draft_test_procedure` | pytest integration. Cases: `OCA` of the correct org accepts a draft → state transitions to `active`; `cx_engineer` attempts → function raises a clear permission-denied error; user with no membership in the project's org → function raises a clear permission-denied error. | Same prior art as above. |
| `getErrorMessage` | vitest unit. Cases: `Error` instance returns `.message`; Supabase object `{message, code, details}` returns `.message`; plain string returns the string; `null` / `undefined` returns the literal `"Unknown error"`; arbitrary object falls back to `JSON.stringify`. | Mirrors the shape of [frontend/src/lib/__tests__/projects.test.ts](../frontend/src/lib/__tests__/projects.test.ts). |

The frontend `.single()` → `.maybeSingle()` migrations, error-helper swaps, and inline empty-state branches are non-behavioral in the TDD sense (no new logic, just relocating existing handling). They are verified by manual smoke through the browser, not by unit tests. The migration schema changes are verified by direct DB inspection after applying.

## Out of Scope

- The repository-layer refactor in progress on a separate branch is its own PRD. The fixes in this PRD apply equally to the pre-refactor shape on `main` and the post-refactor shape on the in-flight branch — neither one introduces nor depends on the new `lib/repos/` interfaces.
- Wiring Vitest into the CI workflow and un-ignoring the integration tests in `backend/pytest.ini` are CI improvements that would have prevented every bug in this PRD. Highly recommended next, but not in this slice.
- `AuditLogEntry` rows for invite events, multi-discipline assignments per user on a single project, custom email templates and branded sender domains, role editing post-accept — all deferred per the PRD-3 grill.
- The deeper architectural decision of whether `OCA` Membership implicitly grants `Participation` on every org-owned Project. This PRD answers "no, materialize a participation row at project creation time" for v0; the longer-term answer (RLS policy that unions `participations` with `memberships WHERE role = 'OCA'`) is left for a future architecture grill.
- Resolution of the duplicate `frontend/src/app/dashboard/page.tsx` vs `frontend/src/app/(app)/dashboard/page.tsx` observed during exploration. Probably a leftover from PRD-2 routing; should be reconciled but is its own ticket.

## Further Notes

- Branch name: `ralph/prd-5-v0-stabilization`. Matches the Ralph convention and lets `scripts/ralph/ralph.sh`'s branch-detection archive cleanly.
- After this PRD lands, the PRD-3 manual verification (GitHub issue #22 — the 9-step demo) becomes runnable end-to-end. Until then, the demo gets stuck at step 3 (project doesn't appear on the OCA's dashboard).
- Migrations 014–016 must each restore `OWNER TO postgres` + `SET search_path = public` on every function they redefine. The pattern that bit us with `handle_new_user` (recorded in migration 012) is the same pattern that will bite us again unless every `CREATE OR REPLACE FUNCTION` in the migration set follows it. Worth a one-line lint check in CI on the migrations directory, but that's a separate ticket.
- The OCA-no-participation bug is a symptom of a deeper architectural choice that has not been formally settled. The v0 fix in this PRD is "materialize a participations row" because it's the smallest change that makes today's queries work. A future architecture grill should decide whether to switch to the "OCA membership grants participation implicitly" model, which would mean adjusting RLS policies and removing the materialization step. Flag for the next grill, not for this PRD.
