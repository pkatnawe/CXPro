from __future__ import annotations

_ALLOWED_PARENTS: dict[str, set[str | None]] = {
    "campus":     {None},
    "building":   {None, "campus"},
    "floor":      {"building"},
    "wing":       {"floor"},
    "department": {"floor", "wing"},
    "data_hall":  {"floor", "building"},
    "rack_row":   {"data_hall"},
    "room":       {"floor", "wing", "department", "data_hall"},
}


def is_allowed_space_parent(parent_kind: str | None, child_kind: str) -> bool:
    allowed = _ALLOWED_PARENTS.get(child_kind)
    if allowed is None:
        return False
    return parent_kind in allowed
