import pytest
from contexts.asset_registry.asset_lifecycle import decide_delete_mode, _REFERENCE_KEYS

_ALL_ZERO: dict[str, int] = {k: 0 for k in _REFERENCE_KEYS}


def test_all_zero_returns_hard_delete() -> None:
    assert decide_delete_mode(_ALL_ZERO) == "hard_delete"


def test_empty_dict_returns_hard_delete() -> None:
    assert decide_delete_mode({}) == "hard_delete"


@pytest.mark.parametrize("key", _REFERENCE_KEYS)
def test_single_nonzero_returns_retire_only(key: str) -> None:
    counts = {**_ALL_ZERO, key: 1}
    assert decide_delete_mode(counts) == "retire_only"


@pytest.mark.parametrize("key", _REFERENCE_KEYS)
def test_large_count_returns_retire_only(key: str) -> None:
    counts = {**_ALL_ZERO, key: 100}
    assert decide_delete_mode(counts) == "retire_only"


def test_multi_nonzero_returns_retire_only() -> None:
    counts = {**_ALL_ZERO, "test_procedure_instances": 3, "deviations": 1}
    assert decide_delete_mode(counts) == "retire_only"


def test_all_nonzero_returns_retire_only() -> None:
    counts = {k: 1 for k in _REFERENCE_KEYS}
    assert decide_delete_mode(counts) == "retire_only"


def test_negative_treated_as_nonzero() -> None:
    counts = {**_ALL_ZERO, "points": -1}
    assert decide_delete_mode(counts) == "retire_only"


def test_extra_keys_ignored() -> None:
    counts = {**_ALL_ZERO, "unrelated_table": 99}
    assert decide_delete_mode(counts) == "hard_delete"
