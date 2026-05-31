import pytest
from contexts.asset_registry.tree_validation import is_allowed_space_parent

KINDS = ["campus", "building", "floor", "wing", "department", "data_hall", "rack_row", "room"]

_EXPECTED: list[tuple[str | None, str, bool]] = [
    # campus — only at root
    (None,          "campus",     True),
    ("campus",      "campus",     False),
    ("building",    "campus",     False),
    ("floor",       "campus",     False),
    ("wing",        "campus",     False),
    ("department",  "campus",     False),
    ("data_hall",   "campus",     False),
    ("rack_row",    "campus",     False),
    ("room",        "campus",     False),

    # building — root or under campus
    (None,          "building",   True),
    ("campus",      "building",   True),
    ("building",    "building",   False),
    ("floor",       "building",   False),
    ("wing",        "building",   False),
    ("department",  "building",   False),
    ("data_hall",   "building",   False),
    ("rack_row",    "building",   False),
    ("room",        "building",   False),

    # floor — only under building
    (None,          "floor",      False),
    ("campus",      "floor",      False),
    ("building",    "floor",      True),
    ("floor",       "floor",      False),
    ("wing",        "floor",      False),
    ("department",  "floor",      False),
    ("data_hall",   "floor",      False),
    ("rack_row",    "floor",      False),
    ("room",        "floor",      False),

    # wing — only under floor
    (None,          "wing",       False),
    ("campus",      "wing",       False),
    ("building",    "wing",       False),
    ("floor",       "wing",       True),
    ("wing",        "wing",       False),
    ("department",  "wing",       False),
    ("data_hall",   "wing",       False),
    ("rack_row",    "wing",       False),
    ("room",        "wing",       False),

    # department — under floor or wing
    (None,          "department", False),
    ("campus",      "department", False),
    ("building",    "department", False),
    ("floor",       "department", True),
    ("wing",        "department", True),
    ("department",  "department", False),
    ("data_hall",   "department", False),
    ("rack_row",    "department", False),
    ("room",        "department", False),

    # data_hall — under floor or building
    (None,          "data_hall",  False),
    ("campus",      "data_hall",  False),
    ("building",    "data_hall",  True),
    ("floor",       "data_hall",  True),
    ("wing",        "data_hall",  False),
    ("department",  "data_hall",  False),
    ("data_hall",   "data_hall",  False),
    ("rack_row",    "data_hall",  False),
    ("room",        "data_hall",  False),

    # rack_row — only under data_hall
    (None,          "rack_row",   False),
    ("campus",      "rack_row",   False),
    ("building",    "rack_row",   False),
    ("floor",       "rack_row",   False),
    ("wing",        "rack_row",   False),
    ("department",  "rack_row",   False),
    ("data_hall",   "rack_row",   True),
    ("rack_row",    "rack_row",   False),
    ("room",        "rack_row",   False),

    # room — under floor, wing, department, or data_hall
    (None,          "room",       False),
    ("campus",      "room",       False),
    ("building",    "room",       False),
    ("floor",       "room",       True),
    ("wing",        "room",       True),
    ("department",  "room",       True),
    ("data_hall",   "room",       True),
    ("rack_row",    "room",       False),
    ("room",        "room",       False),

    # unknown child kind returns False regardless of parent
    (None,          "unknown",    False),
    ("building",    "unknown",    False),
]


@pytest.mark.parametrize("parent_kind,child_kind,expected", _EXPECTED)
def test_is_allowed_space_parent(parent_kind: str | None, child_kind: str, expected: bool) -> None:
    assert is_allowed_space_parent(parent_kind, child_kind) == expected
