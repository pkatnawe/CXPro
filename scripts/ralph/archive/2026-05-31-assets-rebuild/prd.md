# PRD — Assets pages rebuild (DC-12 demo)

**Branch:** `ralph/assets-rebuild`
**Status:** Draft — awaiting approval
**Author:** grilling session, 2026-05-31

## Why

Every list page in the frontend currently renders "Failed to load templates." The proximate cause is an empty database — no demo project, no assets, no templates exist for the logged-in user, so RLS-scoped queries return empty and the frontend (which treats some empties as errors) crashes. The deeper problem is that the Assets pages were built before the `frontend-design/` wireframes existed and don't match the visual language the team wants.

This PRD does two things in one branch:

1. **Seed realistic synthetic data** so the frontend has something to render on every page.
2. **Rebuild the Assets list and Asset detail pages** from the V1 wireframe (`frontend-design/screens/equipment.jsx` + `frontend-design/screens/asset-detail.jsx`), scoped strictly to what the current backend supports.

Other pages (Templates, Systems, Asset Types, etc.) are out of scope — they'll stop erroring once seeded, and their visual rebuild is a separate PRD.

## Out of scope

- Issues / Files / RFIs / History tabs on the asset detail page (no backend for any of them).
- Discipline / phase / owner / commissioning-status as stored columns (they're derived or out-of-scope).
- AI command bar functionality (rendered as decorative input).
- Bulk-select + bulk actions on the list page.
- "Import BIM" / "Export" buttons (decorative stubs).
- Templates/Systems/AssetTypes page rebuilds.

## Decisions locked during grilling

| # | Decision | Rationale |
|---|---|---|
| 1 | Schema: add `assets.vendor_name TEXT` only | CONTEXT.md says vendor is an Organization, but we don't have an Organizations CRUD UI yet. Text snapshot ships today; can promote to FK later. |
| 2 | Reuse `manufacturer`, `model`, `serial`, `nameplate_data` JSONB | They already exist on the assets table. No further schema changes needed for arbitrary metadata. |
| 3 | Status pill = DB lifecycle status only (`active`/`retired`/`decommissioned`) | Honest; matches the only status the backend tracks. The wireframe's `in-progress/blocked/commissioned` chips are fiction without a derivation rule. |
| 4 | Phase = highest commissioning level (L1–L5) with an `in_progress` or `complete` TestProcedureInstance; `"Pre-install"` if none | Derivable client-side from the existing instances endpoint. No backend changes. |
| 5 | Cx progress % = `complete instances / total instances on this asset` | Step-level progress would require a schema change; instance-level is good enough. |
| 6 | 5 tabs in scope (Overview, Devices, Checklists, Tests, Linked); 4 hidden (Issues, Files, RFIs, History) | Hidden tabs have no backend. Show only what's real. |
| 7 | Filter chips: space, asset_type, lifecycle status | All three are existing query params on `GET /assets`. Tag search and free-text NL deferred. |
| 8 | Write ops in scope: create modal, inline edit, delete | User wants to demo creating assets, not just viewing seeded ones. |
| 9 | Delete old `frontend/src/contexts/asset_registry/ui.tsx` + its tests; write fresh | "Scrap the old setup." |
| 10 | Port `WBox`/`WPill`/`WT`/`WAvatar`/etc. from `frontend-design/wireframe-kit.jsx` into a real `frontend/src/lib/frontend-kit/` module | Higher fidelity to wireframes; reusable for future pages built from the same kit. |
| 11 | Seed = standalone idempotent Python script, ~15 assets, bound to `shlokp98@gmail.com` | Re-runnable; doesn't pollute migrations. |

## Domain (CONTEXT.md) impact

None. No new terms introduced. `vendor_name` is a denormalized display snapshot of the existing `Organization (type=Vendor)` concept — explicitly temporary, no glossary entry needed.

## ADR impact

None. Every decision is reversible:
- `vendor_name TEXT` → can be migrated to FK without data loss (lookup-by-name backfill).
- Hidden tabs → re-show when backend ships.
- Phase derivation → can move to a stored column later.

## User stories (vertical slices)

See `scripts/ralph/prd.json` for the Ralph-runnable version with `passes` flags.

| ID | Title |
|---|---|
| US-001 | Migration — `assets.vendor_name TEXT` + apply script |
| US-002 | Seed script — DC-12 Hudson Valley demo project, idempotent, bound to caller email |
| US-003 | Port wireframe primitives into `frontend/src/lib/frontend-kit/` (`WBox`, `WPill`, `WT`, `WAvatar`, `WBar`, `WStamp`, `WIcon`, `WLiveDot`) |
| US-004 | Assets list page — V1 dense-table rebuild, filter chips wired to `useUrlFilters`, decorative AI command bar, no bulk-select |
| US-005 | Asset detail page — hero (tag + name + asset_type + space path + lifecycle pill + vendor + mfr/model/serial + nameplate KVs) + KPI strip (Cx progress %, sub-asset count, instances done/total) + 5-tab strip (Overview, Devices, Checklists, Tests, Linked) |
| US-006 | Phase derivation + lifecycle phase tracker visual on detail page |
| US-007 | Create-asset modal — form for tag, asset_type, space, manufacturer, model, serial, vendor_name, nameplate JSON editor |
| US-008 | Edit + delete affordances — inline edit of editable fields, delete with confirmation |
| US-009 | Cleanup — delete `frontend/src/contexts/asset_registry/ui.tsx`, `ui.test.tsx`, any references; write fresh tests for new components |

## Verification

After all stories pass:

- [ ] `python3 scripts/seed_demo_data.py` runs clean twice in a row (idempotency).
- [ ] Logged in as the seed user, `/project/<demo-id>/assets` renders the list with ≥15 rows, all three filter chips work, no errors in console.
- [ ] Clicking a row navigates to `/project/<demo-id>/assets/<id>`; all 5 tabs render with real data; hidden tabs are absent.
- [ ] Create modal successfully creates an asset and it appears in the list.
- [ ] Edit + delete round-trip successfully.
- [ ] No file in `frontend/src/contexts/asset_registry/` imports the deleted `ui.tsx`.
- [ ] Existing tests for other contexts still pass; new tests for assets list + detail components pass.

## Risks

| Risk | Mitigation |
|---|---|
| Seed script tied to `auth.users` row that doesn't exist yet | Script errors loudly with `--email` argument; user must have signed in once. |
| Porting wireframe-kit pulls in styles that conflict with existing `bp-*` CSS variables | Namespace the new kit's CSS classes (`fk-*`) and keep them self-contained. Don't touch global styles. |
| Phase derivation hides legitimate in-progress work if instance statuses are misnamed | Document the exact rule in a comment in the derivation function; trivially adjustable. |
| Write ops (create/edit/delete) expand scope materially | Stories US-007 and US-008 are last — can be cut without losing the visual rebuild value. |
