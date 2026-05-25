# PRD-3: v0 Teams — signup → org → project → discipline-scoped seat

Status: ready-for-agent
Related ADR: [ADR-0002](./adr/0002-user-project-assignment-spans-two-tables.md)
Glossary: [CONTEXT.md](../CONTEXT.md)

---

## Problem Statement

CXPro's downstream features — Equipment CRUD, Checklist authoring, Test Procedure execution, Inbox, Dashboard — all require a user to be seated on a Project with a Role and a DisciplineScope before Supabase RLS will let them read or write anything. Today an authenticated user lands in `auth.users` via `handle_new_user`, but there is no end-to-end path for an OCA to invite a teammate, capture their Role and Discipline at invite time, or have the invitation redeem itself on signup. The existing `invite_user_by_email` RPC silently fails for any invitee who hasn't already signed up, and the dashboard's invite form gives no feedback that the invitation went nowhere. Until this is fixed, every other CRUD feature is unreachable for any user who is not a hand-provisioned test row.

## Solution

Build the minimal invite-and-redeem flow that lets an OCA add a teammate to a Project with a specific Role and DisciplineScope, regardless of whether the invitee already has an account. The flow:

1. OCA opens a Members tab on a Project, enters an email, picks a Role (`OCA` or `cx_engineer`), picks a DisciplineScope (Mechanical, Electrical, Controls, or General Construction), submits.
2. A FastAPI backend endpoint writes a `pending_invitations` row with a unique token and calls Supabase Auth's admin invite API (or `signInWithOtp` if the invitee already has an account — one code path for both cases).
3. The invitee gets a magic-link email, clicks it, completes signup (or is signed in).
4. On signup, `handle_new_user` is extended to redeem every unexpired `pending_invitations` row matching the user's email — creating `memberships`, `participations`, and `assignments` rows and marking the invitations as accepted.
5. The invitee lands on the Project. Direct DB inspection and the Project's Members UI confirm the rows were written with the correct Role and Discipline.

The OCA can edit a member's Discipline after acceptance. Role is locked at invite time for v0. Discipline-gated RLS (the proof that User B can write Mechanical but not Electrical TestProcedureInstance rows) is **deferred to the Equipment/Asset slice** where the discipline column belongs naturally.

## User Stories

1. As an OCA, I want to create an Org on my first login, so that I can start adding teammates to a Project.
2. As an OCA, I want to create a Project that auto-seeds all four canonical DisciplineScopes (Mechanical, Electrical, Controls, General Construction), so that I do not have to manually configure each discipline before inviting anyone.
3. As an OCA, I want a Members tab on each Project, so that team management is project-scoped rather than buried in a global dashboard.
4. As an OCA, I want to invite a teammate by email, picking their Role (`OCA` or `cx_engineer`) and DisciplineScope at the time of invite, so that the invitee lands directly on the Project with the correct seat.
5. As an OCA, I want to invite teammates who have never signed up for CXPro, so that I can onboard a fresh team without asking them to register first.
6. As an OCA, I want to invite teammates who already have a CXPro account from another Project, so that I can pull existing colleagues into my Project without making them re-register.
7. As an OCA, I want to see the list of pending invitations on the Members tab, so that I can tell which invites have been accepted and which are still outstanding.
8. As an OCA, I want to edit a member's DisciplineScope after they have accepted the invitation, so that I can correct mistakes or reassign people as the project evolves.
9. As an invitee, I want to click the link in my invitation email and arrive on a page that signs me up (or in) and then drops me into the Project I was invited to, so that I do not have to manually figure out which Org or Project to join.
10. As an invitee, I want my email invitation to stay valid for a reasonable window (default 7 days) and then expire, so that stale invites cannot be redeemed long after the inviter has changed their mind.
11. As an invitee with multiple pending invitations across different Orgs, I want all of them to redeem on signup, so that I do not have to chase down each inviter to re-send.
12. As an expired-invite invitee, I want to land on a "create your own org" page after signup rather than getting a confusing error, so that the failure mode is recoverable without engineering help.
13. As an OCA, I do not want to give the role `OCA` to teammates by default — `cx_engineer` should be the default selection on the invite form, so that I have to consciously elevate someone to co-owner.
14. As an OCA, I want the invite to fail loudly if I try to invite someone with an email that already has a pending invitation to the same Project, so that I do not generate duplicate redemptions.
15. As a developer running the verification script, I want to walk through the 9-step demo and confirm at each step that the expected DB rows are present, so that I have ground-truth proof the slice works end-to-end before downstream CRUD is built on top of it.

## Implementation Decisions

### Identity model

- `UserProjectAssignment` from the architecture continues to be a logical aggregate over two physical tables: `participations` (project-level gate, what RLS keys off) and `assignments` (discipline-level seat). No schema rename. See ADR-0002 for the trade-off.
- The hardcoded `memberships.role CHECK (role IN ('OCA', 'cx_engineer'))` enum stays for v0. A full Role/Permission table is out of scope.

### Invitation table

- New table `pending_invitations` with columns: `id`, `email`, `org_id`, `project_id`, `role`, `discipline_scope_id`, `token` (unique, url-safe ~32 bytes), `invited_by` (FK to `users`), `expires_at` (default `now() + interval '7 days'`), `accepted_at` (null until redemption), `created_at`. The full life cycle of an invite — issued, accepted, expired — lives on this single row.
- Token is opaque, generated server-side, and transported as a query param on the Supabase Auth redirect URL.

### Invite-send path

- New FastAPI endpoint `POST /invites` on `backend/main.py`. Holds the Supabase **service-role key** (not shippable to the browser). Inputs: `email`, `org_id`, `project_id`, `role`, `discipline_scope_id`. Authentication: caller's JWT, validated to be an `OCA` of the target org. Effect: write `pending_invitations` row, then call Supabase Auth:
  - If the email does not exist in `auth.users`: `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: '<frontend>/accept-invite?token=<token>' })`
  - If the email exists: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '<frontend>/accept-invite?token=<token>' } })`
- Single response shape for both paths so the frontend doesn't branch.
- Encapsulated inside an `InvitationService` module in the backend; the endpoint is a thin HTTP wrapper.

### Invite-redeem path

- New Postgres function `redeem_pending_invitations(user_id uuid, email text) RETURNS int` (SECURITY DEFINER). Behavior: select every unexpired, unaccepted row from `pending_invitations` where `email = email`, and for each row: insert a `memberships` row (`ON CONFLICT DO NOTHING`), insert a `participations` row (`ON CONFLICT DO NOTHING`), insert an `assignments` row (`ON CONFLICT DO NOTHING`), update `accepted_at = now()`. Return the count of redeemed rows.
- `handle_new_user` trigger is extended to call `redeem_pending_invitations(NEW.id, NEW.email)` after inserting the `users` row. Existing behavior preserved for users who sign up without an invite.

### Discipline seeding

- The existing `create_project_with_discipline` function in [migrations/001_party_model.sql](../migrations/001_party_model.sql) seeds only `Mechanical`. This is extended to seed all four canonical disciplines: `Mechanical`, `Electrical`, `Controls`, `General Construction`. The function signature does not change; only the body.

### Members UI

- New route `/project/[id]/members` in the frontend. Two visible regions: a table of current members (joined `memberships` × `participations` × `assignments` for the project), and an invite form (email, role dropdown, discipline dropdown defaulting to the first discipline the inviter is themselves seated in). A second region lists pending invitations with their expiry.
- New route `/accept-invite` renders a "welcome — taking you to your Project" interstitial that reads the `token` query param, confirms with the backend that redemption succeeded, then redirects to `/project/<id>`.

### Edit-discipline action

- Inline action on the members table: clicking a member's discipline opens a single-select dropdown. On change, the frontend calls a new `members` lib function `updateDiscipline(userId, projectId, newDisciplineScopeId)` that updates the `assignments` row (one assignment per `(user_id, project_id)` for v0 — no multi-discipline yet). The old row is replaced, not augmented.

### Modules

- **`invite_redeemer`** (Postgres function): encapsulates the redemption loop.
- **`InvitationService.create_invitation`** (FastAPI backend): encapsulates token generation, table write, and the Supabase-Auth-which-API branch.
- **`AssignmentEditor.updateDiscipline`** (frontend lib): single-op write to `assignments`.
- **`members` lib** (frontend `lib/members.ts`): `getMembersForProject` and `getPendingInvitesForProject` read functions. Mirrors `lib/projects.ts` shape.

## Testing Decisions

Good tests assert externally visible behavior — what rows end up in the database, what response the endpoint returns, what the UI renders — never the internal sequence of inserts or which Supabase Auth method was called. Mocks are minimal and confined to the boundary where the real service costs money or is slow (Supabase Auth's transactional email).

| Module | Test type | Notes |
|---|---|---|
| `invite_redeemer` Postgres function | pytest integration (real Supabase) | Cases: single invite redeems, multiple invites across orgs all redeem, expired invite is skipped, accepted invite is not re-redeemed, no-invite signup is no-op. Mirrors the integration-test pattern in [backend/test_slice_06.py](../backend/test_slice_06.py). Marked `@pytest.mark.integration` so it is excluded from default `pytest`. |
| `InvitationService.create_invitation` | pytest unit + one integration | Unit: branches correctly between `inviteUserByEmail` and `signInWithOtp` based on whether email exists; validates inviter is OCA. Integration: actually writes a `pending_invitations` row and verifies the Supabase Auth call returned a magic link. |
| `AssignmentEditor.updateDiscipline` | vitest | Mirrors [frontend/src/lib/__tests__/projects.test.ts](../frontend/src/lib/__tests__/projects.test.ts). Asserts the `assignments` row is replaced not augmented. |
| `members` lib (read functions) | vitest | Same pattern as [projects.test.ts](../frontend/src/lib/__tests__/projects.test.ts). Asserts joined rows are returned with the right shape for the Members UI. |

UI rendering and migration files are non-behavioral and are not unit-tested. They are covered by the manual demo verification (story 15).

## Out of Scope

- Discipline-gated RLS on TestProcedureInstance / Asset / any Commissioning Execution table. Deferred to the Equipment / Asset CRUD slice that comes next, where `discipline_scope_id` naturally belongs on the table being designed.
- Replacing the hardcoded `OCA | cx_engineer` enum with a Role / Permission table. Future work.
- Multi-discipline assignments per user on a single Project. v0 allows exactly one `assignments` row per (user, project).
- Multi-Org participation in a single Project (Owner + GC + CxConsultant on the same Tower). Future work; architecture supports it but UI does not.
- Custom invitation email templates, branded sender domains, custom transport (Resend, Postmark). v0 piggybacks Supabase Auth's default emails.
- AuditLogEntry rows for invite issued / accepted / expired events. Future cross-cutting concern.
- Resend, cancel, or extend-expiry actions on pending invitations.
- Notifying the inviter via Inbox or email when an invitation is accepted.
- Promoting / demoting Role after invite acceptance.
- Removing or deactivating a member.
- An `/onboarding` flow that asks the user to name their Org and pick its type. v0 keeps the existing dashboard "Create your organization" form.

## Further Notes

- The branch name should be `ralph/prd-3-v0-teams` to match the repo's Ralph convention and let `scripts/ralph/ralph.sh`'s branch-detection archive prior runs cleanly.
- The verification step (story 15) is the 9-step demo script written in the conversation that produced this PRD. It is not a Vitest or pytest test — it is a manual walkthrough that proves end-to-end the slice unblocks downstream CRUD for two distinct users.
- After this PRD ships, the next slice is Equipment / Asset CRUD. That slice will introduce a real `assets` table with `discipline_scope_id`, the deferred discipline-gated RLS policy, and full CRUD on Equipment. Identity is the bridge that lets that next slice be testable for multi-user scenarios.
- The decision to keep `participations` + `assignments` as two physical tables for one logical aggregate is recorded in [ADR-0002](./adr/0002-user-project-assignment-spans-two-tables.md). All access-control code in this PRD must respect that split.
