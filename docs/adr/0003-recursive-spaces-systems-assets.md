---
status: accepted
---

# Space, System, and Asset are single recursive tables, not fixed-level hierarchies

Asset Registry models physical location, logical grouping, and equipment composition as **three single tables with self-referential parent FKs**, not as multiple typed tables per hierarchy level. `spaces` carries an optional `parent_space_id` and a `kind` column (`campus`, `building`, `floor`, `data_hall`, `wing`, `room`, ...). `systems` carries an optional `parent_system_id`. `assets` carries an optional `parent_asset_id`. Industry comparables disagree: CxAlloy uses fixed levels (separate Building, Floor, Space tables) and BlueRithm uses a flat folder-system-equipment hierarchy. We deliberately chose the single-recursive-table shape because CXPro's buyer profile — hyperscale data centers (`Building → Floor → Data Hall → Rack Row`), pharma CQV (`Building → Cleanroom Suite → Cleanroom`), Ontario hospital projects (`Building → Wing → Department → Room`), and Year-2 campuses (`Campus → Building → ...`) — all require depth greater than two and require *different* level names per project. Fixed-level tables would force per-customer schema migration or hardcoded level naming; recursion with a `kind` discriminator handles every layout without schema change. The same logic applies to Systems (a "Chilled Water" system has Primary and Secondary loops as children) and Assets (an AHU is the parent of its supply fan; a switchgear is the parent of its breakers — each child is itself a full Asset with its own Tag, tests, deviations, and dossier).

## Consequences

- "List all buildings on a project" becomes `WHERE kind = 'building'` rather than a separate table query.
- Tree queries use recursive CTEs (Postgres `WITH RECURSIVE`). Performance is acceptable up to thousands of nodes; large data centers (>10k assets) may need a materialized closure table later — defer until measured.
- Malformed trees (a `room` parented to a `building` skipping `floor`) are not prevented at the DB level. Enforced in the API layer with a per-`kind` allowed-parent matrix; UI surfaces the rule.
- Renaming a parent does NOT cascade to child Tags. Sub-asset Tag convention (`AHU-42-SF-1`) is naming, not enforced — see [CONTEXT.md](../../CONTEXT.md) Tag entry.
- Cross-context FKs (test_procedure_instances → asset, deviations → asset, documents → asset) reference the recursive table directly; no special handling for sub-assets.
