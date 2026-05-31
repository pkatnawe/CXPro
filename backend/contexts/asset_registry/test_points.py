"""
Unit tests for points.py CRUD module.
All DB calls are mocked — no live database required.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

import asyncpg

from contexts.asset_registry.points import (
    create_point,
    get_point,
    list_points_for_asset,
    update_point,
    delete_point,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _point_row(
    *,
    point_id: str | None = None,
    asset_id: str | None = None,
    tag: str = "PT-001",
    description: str | None = None,
    signal_type: str | None = "4-20mA",
    range_low: float | None = None,
    range_high: float | None = None,
    engineering_units: str | None = None,
    last_cal_date: date | None = None,
    cal_due_date: date | None = None,
) -> dict[str, Any]:
    pid = uuid.UUID(point_id) if point_id else uuid.uuid4()
    aid = uuid.UUID(asset_id) if asset_id else uuid.uuid4()
    return {
        "id": pid,
        "asset_id": aid,
        "tag": tag,
        "description": description,
        "signal_type": signal_type,
        "range_low": range_low,
        "range_high": range_high,
        "engineering_units": engineering_units,
        "last_cal_date": last_cal_date,
        "cal_due_date": cal_due_date,
        "created_at": datetime.now(timezone.utc),
    }


def _mock_conn() -> MagicMock:
    conn = MagicMock()
    conn.fetchrow = AsyncMock()
    conn.fetch = AsyncMock()
    conn.fetchval = AsyncMock()
    conn.execute = AsyncMock()
    return conn


def _asset_exists_row(asset_id: str) -> dict[str, Any]:
    return {"id": uuid.UUID(asset_id)}


# ---------------------------------------------------------------------------
# create_point tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_point_basic() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    row = _point_row(asset_id=asset_id, tag="PT-001", signal_type="4-20mA")
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), row]

    result = await create_point(
        conn, asset_id=asset_id, project_id=project_id, tag="PT-001", signal_type="4-20mA"
    )
    assert result["tag"] == "PT-001"
    assert result["signal_type"] == "4-20mA"


@pytest.mark.asyncio
async def test_create_point_all_signal_types() -> None:
    valid_types = ["4-20mA", "0-10V", "RTD", "thermocouple", "discrete", "modbus"]
    for sig in valid_types:
        project_id = _make_uuid()
        asset_id = _make_uuid()
        conn = _mock_conn()
        row = _point_row(asset_id=asset_id, signal_type=sig)
        conn.fetchrow.side_effect = [_asset_exists_row(asset_id), row]
        result = await create_point(
            conn, asset_id=asset_id, project_id=project_id, tag="PT-001", signal_type=sig
        )
        assert result["signal_type"] == sig


@pytest.mark.asyncio
async def test_create_point_invalid_signal_type_raises_422() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()

    with pytest.raises(HTTPException) as exc_info:
        await create_point(
            conn, asset_id=asset_id, project_id=project_id, tag="PT-001", signal_type="INVALID"
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_point_range_low_gt_high_raises_422() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()

    with pytest.raises(HTTPException) as exc_info:
        await create_point(
            conn,
            asset_id=asset_id,
            project_id=project_id,
            tag="PT-001",
            range_low=100.0,
            range_high=0.0,
        )
    assert exc_info.value.status_code == 422
    assert "range_low" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_point_range_equal_ok() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    row = _point_row(asset_id=asset_id, range_low=5.0, range_high=5.0)
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), row]

    result = await create_point(
        conn, asset_id=asset_id, project_id=project_id, tag="PT-001", range_low=5.0, range_high=5.0
    )
    assert result["range_low"] == 5.0


@pytest.mark.asyncio
async def test_create_point_duplicate_tag_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = [
        _asset_exists_row(asset_id),
        asyncpg.UniqueViolationError("duplicate key"),
    ]

    with pytest.raises(HTTPException) as exc_info:
        await create_point(conn, asset_id=asset_id, project_id=project_id, tag="PT-001")
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_create_point_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await create_point(conn, asset_id=asset_id, project_id=project_id, tag="PT-001")
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# get_point tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_point_found() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    row = _point_row(point_id=point_id, asset_id=asset_id)
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), row]

    result = await get_point(conn, point_id=point_id, asset_id=asset_id, project_id=project_id)
    assert str(result["id"]) == point_id


@pytest.mark.asyncio
async def test_get_point_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), None]

    with pytest.raises(HTTPException) as exc_info:
        await get_point(conn, point_id=point_id, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_points_for_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_points_for_asset() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _point_row(asset_id=asset_id, tag="PT-001"),
        _point_row(asset_id=asset_id, tag="PT-002"),
    ]
    conn.fetchrow.return_value = _asset_exists_row(asset_id)
    conn.fetch.return_value = rows

    result = await list_points_for_asset(conn, asset_id=asset_id, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_points_for_asset_empty() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = _asset_exists_row(asset_id)
    conn.fetch.return_value = []

    result = await list_points_for_asset(conn, asset_id=asset_id, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# update_point tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_point_rename() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    existing = _point_row(point_id=point_id, asset_id=asset_id, tag="OLD")
    updated = _point_row(point_id=point_id, asset_id=asset_id, tag="NEW")
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), existing, updated]

    result = await update_point(
        conn, point_id=point_id, asset_id=asset_id, project_id=project_id, tag="NEW"
    )
    assert result["tag"] == "NEW"


@pytest.mark.asyncio
async def test_update_point_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), None]

    with pytest.raises(HTTPException) as exc_info:
        await update_point(conn, point_id=point_id, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_point_invalid_signal_type_raises_422() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()

    with pytest.raises(HTTPException) as exc_info:
        await update_point(
            conn,
            point_id=point_id,
            asset_id=asset_id,
            project_id=project_id,
            signal_type="BOGUS",
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_update_point_invalid_range_raises_422() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    existing = _point_row(point_id=point_id, asset_id=asset_id)
    conn.fetchrow.side_effect = [_asset_exists_row(asset_id), existing]

    with pytest.raises(HTTPException) as exc_info:
        await update_point(
            conn,
            point_id=point_id,
            asset_id=asset_id,
            project_id=project_id,
            range_low=100.0,
            range_high=0.0,
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_update_point_duplicate_tag_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    existing = _point_row(point_id=point_id, asset_id=asset_id, tag="OLD")
    conn.fetchrow.side_effect = [
        _asset_exists_row(asset_id),
        existing,
        asyncpg.UniqueViolationError("duplicate key"),
    ]

    with pytest.raises(HTTPException) as exc_info:
        await update_point(
            conn, point_id=point_id, asset_id=asset_id, project_id=project_id, tag="DUPLICATE"
        )
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# delete_point tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_point_success() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = _asset_exists_row(asset_id)
    conn.execute.return_value = "DELETE 1"

    await delete_point(conn, point_id=point_id, asset_id=asset_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_point_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    point_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = _asset_exists_row(asset_id)
    conn.execute.return_value = "DELETE 0"

    with pytest.raises(HTTPException) as exc_info:
        await delete_point(conn, point_id=point_id, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Parent asset cascade test (documented behavior from schema)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_parent_asset_not_found_raises_404_on_list() -> None:
    """When parent asset doesn't exist, list_points raises 404 (RLS via parent)."""
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await list_points_for_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# RLS: unauthorized user gets 404 (asset not visible)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await list_points_for_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404
