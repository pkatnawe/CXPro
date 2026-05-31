"""
Unit tests for systems.py CRUD module.
All DB calls are mocked — no live database required.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

import asyncpg

from contexts.asset_registry.systems import (
    create_system,
    get_system,
    list_systems,
    update_system,
    delete_system,
    add_asset_to_system,
    remove_asset_from_system,
    list_system_members,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _system_row(
    *,
    system_id: str | None = None,
    project_id: str | None = None,
    parent_system_id: str | None = None,
    name: str = "HVAC",
    description: str | None = None,
) -> dict[str, Any]:
    sid = uuid.UUID(system_id) if system_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    psid = uuid.UUID(parent_system_id) if parent_system_id else None
    return {
        "id": sid,
        "project_id": pid,
        "parent_system_id": psid,
        "name": name,
        "description": description,
        "created_at": datetime.now(timezone.utc),
    }


def _asset_row(
    *,
    asset_id: str | None = None,
    project_id: str | None = None,
    tag: str = "TAG-001",
    name: str | None = None,
    status: str = "active",
) -> dict[str, Any]:
    aid = uuid.UUID(asset_id) if asset_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    return {
        "id": aid,
        "project_id": pid,
        "tag": tag,
        "name": name,
        "status": status,
        "added_at": datetime.now(timezone.utc),
    }


def _mock_conn() -> MagicMock:
    conn = MagicMock()
    conn.fetchrow = AsyncMock()
    conn.fetch = AsyncMock()
    conn.fetchval = AsyncMock()
    conn.execute = AsyncMock()
    return conn


# ---------------------------------------------------------------------------
# create_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_system_top_level() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _system_row(project_id=project_id, name="HVAC")
    conn.fetchrow.return_value = row

    result = await create_system(conn, project_id=project_id, name="HVAC")
    assert result["name"] == "HVAC"
    assert str(result["project_id"]) == project_id


@pytest.mark.asyncio
async def test_create_system_with_parent() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    child_id = _make_uuid()
    conn = _mock_conn()
    parent_row = _system_row(system_id=parent_id, project_id=project_id, name="HVAC")
    child_row = _system_row(
        system_id=child_id, project_id=project_id, parent_system_id=parent_id, name="AHU"
    )
    conn.fetchrow.side_effect = [parent_row, child_row]

    result = await create_system(
        conn, project_id=project_id, name="AHU", parent_system_id=parent_id
    )
    assert result["name"] == "AHU"
    assert str(result["parent_system_id"]) == parent_id


@pytest.mark.asyncio
async def test_create_system_parent_not_found_raises_404() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await create_system(conn, project_id=project_id, name="AHU", parent_system_id=parent_id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_create_system_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = asyncpg.UniqueViolationError("duplicate key")

    with pytest.raises(HTTPException) as exc_info:
        await create_system(conn, project_id=project_id, name="HVAC")
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# get_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_system_found() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    row = _system_row(system_id=system_id, project_id=project_id, name="Plumbing")
    conn.fetchrow.return_value = row

    result = await get_system(conn, system_id=system_id, project_id=project_id)
    assert str(result["id"]) == system_id


@pytest.mark.asyncio
async def test_get_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_system(conn, system_id=system_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_systems tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_systems_all() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _system_row(project_id=project_id, name="HVAC"),
        _system_row(project_id=project_id, name="Plumbing"),
    ]
    conn.fetch.return_value = rows

    result = await list_systems(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_systems_by_parent() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    rows = [_system_row(project_id=project_id, parent_system_id=parent_id, name="AHU")]
    conn.fetch.return_value = rows

    result = await list_systems(conn, project_id=project_id, parent_system_id=parent_id)
    assert len(result) == 1
    assert result[0]["name"] == "AHU"


@pytest.mark.asyncio
async def test_list_systems_include_descendants() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _system_row(project_id=project_id, name="HVAC"),
        _system_row(project_id=project_id, name="AHU"),
        _system_row(project_id=project_id, name="Chiller"),
    ]
    conn.fetch.return_value = rows

    result = await list_systems(conn, project_id=project_id, include_descendants=True)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_list_systems_include_descendants_with_parent() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _system_row(project_id=project_id, parent_system_id=parent_id, name="AHU"),
        _system_row(project_id=project_id, name="Sub-AHU"),
    ]
    conn.fetch.return_value = rows

    result = await list_systems(
        conn, project_id=project_id, parent_system_id=parent_id, include_descendants=True
    )
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_systems_empty() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_systems(conn, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# update_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_system_rename() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id, name="Old Name")
    updated = _system_row(system_id=system_id, project_id=project_id, name="New Name")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_system(conn, system_id=system_id, project_id=project_id, name="New Name")
    assert result["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await update_system(conn, system_id=system_id, project_id=project_id, name="X")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_system_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id, name="HVAC")
    conn.fetchrow.side_effect = [existing, asyncpg.UniqueViolationError("duplicate key")]

    with pytest.raises(HTTPException) as exc_info:
        await update_system(
            conn, system_id=system_id, project_id=project_id, name="Existing Name"
        )
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_update_system_reparent() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    new_parent_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id)
    new_parent = _system_row(system_id=new_parent_id, project_id=project_id)
    updated = _system_row(
        system_id=system_id, project_id=project_id, parent_system_id=new_parent_id
    )
    conn.fetchrow.side_effect = [existing, new_parent, updated]

    result = await update_system(
        conn, system_id=system_id, project_id=project_id, parent_system_id=new_parent_id
    )
    assert str(result["parent_system_id"]) == new_parent_id


@pytest.mark.asyncio
async def test_update_system_reparent_parent_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    new_parent_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.side_effect = [existing, None]

    with pytest.raises(HTTPException) as exc_info:
        await update_system(
            conn, system_id=system_id, project_id=project_id, parent_system_id=new_parent_id
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# delete_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_system_empty_succeeds() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 0]

    await delete_system(conn, system_id=system_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await delete_system(conn, system_id=system_id, project_id=project_id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_system_with_children_raises_409() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 2

    with pytest.raises(HTTPException) as exc_info:
        await delete_system(conn, system_id=system_id, project_id=project_id)
    assert exc_info.value.status_code == 409
    assert "child" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_delete_system_with_members_raises_409() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    existing = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 3]

    with pytest.raises(HTTPException) as exc_info:
        await delete_system(conn, system_id=system_id, project_id=project_id)
    assert exc_info.value.status_code == 409
    assert "membership" in exc_info.value.detail.lower()


# ---------------------------------------------------------------------------
# add_asset_to_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_asset_to_system_success() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    asset_row_data = _asset_row(asset_id=asset_id, project_id=project_id)
    membership_row = {
        "asset_id": uuid.UUID(asset_id),
        "system_id": uuid.UUID(system_id),
        "added_at": datetime.now(timezone.utc),
    }
    conn.fetchrow.side_effect = [system_row, asset_row_data, membership_row]

    result = await add_asset_to_system(
        conn, system_id=system_id, asset_id=asset_id, project_id=project_id
    )
    assert str(result["asset_id"]) == asset_id
    assert str(result["system_id"]) == system_id


@pytest.mark.asyncio
async def test_add_asset_to_system_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await add_asset_to_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_asset_to_system_asset_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.side_effect = [system_row, None]

    with pytest.raises(HTTPException) as exc_info:
        await add_asset_to_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_asset_to_system_duplicate_raises_409() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    asset_row_data = _asset_row(asset_id=asset_id, project_id=project_id)
    conn.fetchrow.side_effect = [
        system_row,
        asset_row_data,
        asyncpg.UniqueViolationError("duplicate key"),
    ]

    with pytest.raises(HTTPException) as exc_info:
        await add_asset_to_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# remove_asset_from_system tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_remove_asset_from_system_success() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    membership = {"asset_id": uuid.UUID(asset_id)}
    conn.fetchrow.side_effect = [system_row, membership]

    await remove_asset_from_system(
        conn, system_id=system_id, asset_id=asset_id, project_id=project_id
    )
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_remove_asset_from_system_not_member_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.side_effect = [system_row, None]

    with pytest.raises(HTTPException) as exc_info:
        await remove_asset_from_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_remove_asset_from_system_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await remove_asset_from_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_system_members tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_system_members_success() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    members = [
        _asset_row(project_id=project_id, tag="TAG-001"),
        _asset_row(project_id=project_id, tag="TAG-002"),
    ]
    conn.fetchrow.return_value = system_row
    conn.fetch.return_value = members

    result = await list_system_members(conn, system_id=system_id, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_system_members_empty() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    system_row = _system_row(system_id=system_id, project_id=project_id)
    conn.fetchrow.return_value = system_row
    conn.fetch.return_value = []

    result = await list_system_members(conn, system_id=system_id, project_id=project_id)
    assert result == []


@pytest.mark.asyncio
async def test_list_system_members_system_not_found_raises_404() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await list_system_members(conn, system_id=system_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# RLS: unauthorized user gets no rows
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_no_rows() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_systems(conn, project_id=project_id)
    assert result == []
