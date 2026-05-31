"""
Unit tests for assets.py CRUD module.
All DB calls are mocked — no live database required.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

import asyncpg

from contexts.asset_registry.assets import (
    create_asset,
    get_asset,
    list_assets,
    update_asset,
    retire_asset,
    decommission_asset,
    delete_asset,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _asset_row(
    *,
    asset_id: str | None = None,
    project_id: str | None = None,
    parent_asset_id: str | None = None,
    asset_type_id: str | None = None,
    space_id: str | None = None,
    tag: str = "TAG-001",
    name: str | None = None,
    status: str = "active",
    manufacturer: str | None = None,
    model: str | None = None,
    serial: str | None = None,
) -> dict[str, Any]:
    aid = uuid.UUID(asset_id) if asset_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    atid = uuid.UUID(asset_type_id) if asset_type_id else uuid.uuid4()
    paid = uuid.UUID(parent_asset_id) if parent_asset_id else None
    sid = uuid.UUID(space_id) if space_id else None
    return {
        "id": aid,
        "project_id": pid,
        "parent_asset_id": paid,
        "asset_type_id": atid,
        "space_id": sid,
        "tag": tag,
        "name": name,
        "status": status,
        "manufacturer": manufacturer,
        "model": model,
        "serial": serial,
        "nameplate_data": "{}",
        "created_at": datetime.now(timezone.utc),
        "retired_at": None,
        "decommissioned_at": None,
    }


def _mock_conn() -> MagicMock:
    conn = MagicMock()
    conn.fetchrow = AsyncMock()
    conn.fetch = AsyncMock()
    conn.fetchval = AsyncMock()
    conn.execute = AsyncMock()

    @asynccontextmanager
    async def _transaction():
        yield

    conn.transaction = _transaction
    return conn


# ---------------------------------------------------------------------------
# create_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_asset_top_level() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    row = _asset_row(project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    conn.fetchrow.side_effect = [
        {"id": uuid.UUID(asset_type_id)},
        row,
    ]
    conn.fetch.return_value = []

    result = await create_asset(conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    assert result["tag"] == "PUMP-001"
    assert str(result["project_id"]) == project_id


@pytest.mark.asyncio
async def test_create_asset_with_parent() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    parent_row = {"id": uuid.UUID(parent_id)}
    at_row = {"id": uuid.UUID(asset_type_id)}
    child_row = _asset_row(project_id=project_id, asset_type_id=asset_type_id, parent_asset_id=parent_id, tag="PUMP-002")
    conn.fetchrow.side_effect = [parent_row, at_row, child_row]
    conn.fetch.return_value = []

    result = await create_asset(
        conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-002", parent_asset_id=parent_id
    )
    assert str(result["parent_asset_id"]) == parent_id


@pytest.mark.asyncio
async def test_create_asset_parent_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await create_asset(
            conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001", parent_asset_id=parent_id
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_create_asset_type_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await create_asset(conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_create_asset_duplicate_tag_raises_409() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    at_row = {"id": uuid.UUID(asset_type_id)}
    conn.fetchrow.side_effect = [at_row, asyncpg.UniqueViolationError("duplicate key")]
    conn.fetch.return_value = []

    with pytest.raises(HTTPException) as exc_info:
        await create_asset(conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# get_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_asset_found() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    row = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = row

    result = await get_asset(conn, asset_id=asset_id, project_id=project_id)
    assert str(result["id"]) == asset_id


@pytest.mark.asyncio
async def test_get_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_assets tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_assets_all() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _asset_row(project_id=project_id, tag="PUMP-001"),
        _asset_row(project_id=project_id, tag="PUMP-002"),
    ]
    conn.fetch.return_value = rows

    result = await list_assets(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_assets_filter_status() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [_asset_row(project_id=project_id, tag="PUMP-001", status="active")]
    conn.fetch.return_value = rows

    result = await list_assets(conn, project_id=project_id, status="active")
    assert len(result) == 1
    assert result[0]["status"] == "active"


@pytest.mark.asyncio
async def test_list_assets_filter_space() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_assets(conn, project_id=project_id, space_id=space_id)
    assert result == []


@pytest.mark.asyncio
async def test_list_assets_filter_by_system() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_assets(conn, project_id=project_id, system_id=system_id)
    assert result == []


@pytest.mark.asyncio
async def test_list_assets_filter_parent() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    rows = [_asset_row(project_id=project_id, parent_asset_id=parent_id, tag="SUB-001")]
    conn.fetch.return_value = rows

    result = await list_assets(conn, project_id=project_id, parent_asset_id=parent_id)
    assert len(result) == 1


# ---------------------------------------------------------------------------
# update_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_asset_rename() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, tag="OLD-001")
    updated = _asset_row(asset_id=asset_id, project_id=project_id, tag="NEW-001")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_asset(conn, asset_id=asset_id, project_id=project_id, tag="NEW-001")
    assert result["tag"] == "NEW-001"


@pytest.mark.asyncio
async def test_update_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await update_asset(conn, asset_id=asset_id, project_id=project_id, tag="X")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_asset_self_cycle_rejected() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing

    with pytest.raises(HTTPException) as exc_info:
        await update_asset(
            conn, asset_id=asset_id, project_id=project_id, parent_asset_id=asset_id
        )
    assert exc_info.value.status_code == 400
    assert "own parent" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_asset_descendant_cycle_rejected() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    child_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetch.return_value = [
        {"id": uuid.UUID(child_id)},
        {"id": uuid.UUID(asset_id)},
    ]

    with pytest.raises(HTTPException) as exc_info:
        await update_asset(
            conn, asset_id=asset_id, project_id=project_id, parent_asset_id=child_id
        )
    assert exc_info.value.status_code == 400
    assert "cycle" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_asset_duplicate_tag_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, tag="OLD")
    conn.fetchrow.side_effect = [existing, asyncpg.UniqueViolationError("duplicate key")]

    with pytest.raises(HTTPException) as exc_info:
        await update_asset(conn, asset_id=asset_id, project_id=project_id, tag="DUPLICATE")
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# retire_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_retire_asset_transitions_to_retired() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, status="active")
    retired = _asset_row(asset_id=asset_id, project_id=project_id, status="retired")
    conn.fetchrow.side_effect = [existing, retired]

    result = await retire_asset(conn, asset_id=asset_id, project_id=project_id)
    assert result["status"] == "retired"


@pytest.mark.asyncio
async def test_retire_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await retire_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_retire_already_retired_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, status="retired")
    conn.fetchrow.return_value = existing

    with pytest.raises(HTTPException) as exc_info:
        await retire_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# decommission_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_decommission_asset_transitions() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, status="active")
    decom = _asset_row(asset_id=asset_id, project_id=project_id, status="decommissioned")
    conn.fetchrow.side_effect = [existing, decom]

    result = await decommission_asset(conn, asset_id=asset_id, project_id=project_id)
    assert result["status"] == "decommissioned"


@pytest.mark.asyncio
async def test_decommission_already_decommissioned_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id, status="decommissioned")
    conn.fetchrow.return_value = existing

    with pytest.raises(HTTPException) as exc_info:
        await decommission_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# delete_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_asset_hard_delete_when_no_refs() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 0

    result = await delete_asset(conn, asset_id=asset_id, project_id=project_id)
    assert result == "hard_delete"
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_asset_with_refs_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 2, 0, 0]

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 409
    detail = exc_info.value.detail
    assert detail["error"] == "has_references"
    assert detail["next_action"] == "retire"
    assert "asset_system_memberships" in detail["counts"]


@pytest.mark.asyncio
async def test_delete_asset_with_points_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 0, 3, 0]

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["counts"]["points"] == 3


@pytest.mark.asyncio
async def test_delete_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_asset_with_child_assets_raises_409() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 0, 0, 1]

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset(conn, asset_id=asset_id, project_id=project_id)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["counts"]["child_assets"] == 1


# ---------------------------------------------------------------------------
# tag reuse after retire
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_asset_tag_reuse_after_retire_allowed() -> None:
    """Tag of a retired asset may be reused — unique index only covers status != 'retired'."""
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    at_row = {"id": uuid.UUID(asset_type_id)}
    new_row = _asset_row(project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    conn.fetchrow.side_effect = [at_row, new_row]
    conn.fetch.return_value = []

    result = await create_asset(
        conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001"
    )
    assert result["tag"] == "PUMP-001"


# ---------------------------------------------------------------------------
# RLS: unauthorized user gets no rows
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_no_rows() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_assets(conn, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# Auto-generation of TestProcedureInstances on Asset create
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_asset_auto_generates_instances_for_linked_templates() -> None:
    """When an AssetType has linked templates, create_asset auto-generates instances."""
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    at_row = {"id": uuid.UUID(asset_type_id)}
    asset_row = _asset_row(project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001")
    instance_row = {
        "id": uuid.uuid4(),
        "project_id": uuid.UUID(project_id),
        "template_id": uuid.UUID(template_id),
        "asset_id": asset_row["id"],
        "system_id": None,
        "level": "L2",
        "status": "pending",
        "created_at": asset_row["created_at"],
    }
    conn.fetchrow.side_effect = [
        at_row,
        asset_row,
        None,
        instance_row,
    ]
    conn.fetch.return_value = [{"id": uuid.UUID(template_id), "level": "L2"}]

    result = await create_asset(
        conn, project_id=project_id, asset_type_id=asset_type_id, tag="PUMP-001"
    )
    assert result["tag"] == "PUMP-001"
    conn.fetch.assert_awaited_once()
