---
status: accepted
---

# Point is a separate entity from Asset, not a polymorphic row

A `Point` (ISA-S5.1 signal-level tag such as `FT`, `PT`, `ZS` on a parent valve or instrument loop) lives in its own `points` table with a hard FK to its owning Asset. The obvious alternative — collapsing Point and Asset into one polymorphic table with a `kind` column — was rejected because Points and Assets behave fundamentally differently in commissioning. Assets get tested (an L2 checklist, an L3 startup, an L4 functional test), get deviations raised against them, can have sub-Assets, can belong to multiple Systems, and have a full lifecycle (active → retired → decommissioned). Points are *referenced by* a test step (e.g., "apply 0% signal, verify FT reads 4mA"); they have no own tests, no deviations, no sub-points, no System membership, no retirement workflow. Their schema is also different: per-instance calibration data (`signal_type`, `range_low`, `range_high`, `engineering_units`, `last_cal_date`, `cal_due_date`) is meaningful on a Point and nonsense on a parent Asset. The user's framing — "tiny tags that aren't assets" — encodes a real domain split between commissioned equipment and the instrument signals integral to that equipment.

## Consequences

- Cascading delete: `points.asset_id ON DELETE CASCADE`. A Point cannot outlive its parent Asset.
- Test step references use `point_id` directly (a future migration); no need to walk `parent_asset_id` to find signals.
- "All flow transmitters on this project" is a flat query (`points WHERE tag LIKE 'FT-%'` or by `signal_type`), not a recursive Asset traversal.
- Cannot retire a Point. The lifecycle status column lives on Asset only — if an Asset is retired, its Points effectively retire with it via the parent join.
- If a future requirement demands testing a Point independently (e.g., standalone calibration certificates), we'd revisit by either promoting that Point to an Asset or attaching a lightweight `calibration_record` entity to the Point. Do NOT collapse the tables to handle it.
