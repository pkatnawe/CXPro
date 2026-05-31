from __future__ import annotations

from typing import Literal

_REFERENCE_KEYS = (
    "test_procedure_instances",
    "deviations",
    "punch_items",
    "documents",
    "asset_system_memberships",
    "points",
    "child_assets",
)


def decide_delete_mode(
    reference_counts: dict[str, int],
) -> Literal["hard_delete", "retire_only"]:
    for key in _REFERENCE_KEYS:
        if reference_counts.get(key, 0) != 0:
            return "retire_only"
    return "hard_delete"
