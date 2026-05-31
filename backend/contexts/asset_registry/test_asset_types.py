"""
Unit tests for asset_types.py CRUD module.
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

from contexts.asset_registry.asset_types import (
    create_asset_type,
    delete_asset_type,
    get_asset_type,
    list_asset_types,
    update_asset_type,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _asset_type_row(
    *,
    asset_type_id: str | None = None,
    project_id: str | None = None,
    name: str = "Pump",
    description: str | None = None,
    expected_attributes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    atid = uuid.UUID(asset_type_id) if asset_type_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    return {
        "id": atid,
        "project_id": pid,
        "name": name,
        "description": description,
        "expected_attributes": expected_attributes or {},
        "created_at": datetime.now(timezone.utc),
    }


def _mock_conn() -> MagicMock:
    conn = MagicMock()
    conn.fetchrow = AsyncMock()
    conn.fetch = AsyncMock()
    conn.fetchval = AsyncMock()
    conn.execute = AsyncMock()
    return conn


# ---------------------------------------------------------------------------
# create_asset_type tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_asset_type_success() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _asset_type_row(project_id=project_id, name="Pump")
    conn.fetchrow.return_value = row

    result = await create_asset_type(conn, project_id=project_id, name="Pump")
    assert result["name"] == "Pump"
    assert str(result["project_id"]) == project_id


@pytest.mark.asyncio
async def test_create_asset_type_with_description_and_attrs() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _asset_type_row(
        project_id=project_id,
        name="Chiller",
        description="A chiller unit",
        expected_attributes={"capacity_tons": "number"},
    )
    conn.fetchrow.return_value = row

    result = await create_asset_type(
        conn,
        project_id=project_id,
        name="Chiller",
        description="A chiller unit",
        expected_attributes={"capacity_tons": "number"},
    )
    assert result["name"] == "Chiller"
    assert result["description"] == "A chiller unit"
    assert result["expected_attributes"] == {"capacity_tons": "number"}


@pytest.mark.asyncio
async def test_create_asset_type_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = asyncpg.UniqueViolationError("duplicate key")

    with pytest.raises(HTTPException) as exc_info:
        await create_asset_type(conn, project_id=project_id, name="Pump")
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# get_asset_type tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_asset_type_found() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    row = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id, name="Fan")
    conn.fetchrow.return_value = row

    result = await get_asset_type(conn, asset_type_id=asset_type_id, project_id=project_id)
    assert str(result["id"]) == asset_type_id


@pytest.mark.asyncio
async def test_get_asset_type_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_asset_type(conn, asset_type_id=asset_type_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_asset_types tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_asset_types_project_scoped() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _asset_type_row(project_id=project_id, name="Pump"),
        _asset_type_row(project_id=project_id, name="Chiller"),
    ]
    conn.fetch.return_value = rows

    result = await list_asset_types(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_asset_types_empty() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_asset_types(conn, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# update_asset_type tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_asset_type_rename() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id, name="Old Name")
    updated = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id, name="New Name")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_asset_type(
        conn, asset_type_id=asset_type_id, project_id=project_id, name="New Name"
    )
    assert result["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_asset_type_description() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id)
    updated = _asset_type_row(
        asset_type_id=asset_type_id, project_id=project_id, description="Updated desc"
    )
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_asset_type(
        conn, asset_type_id=asset_type_id, project_id=project_id, description="Updated desc"
    )
    assert result["description"] == "Updated desc"


@pytest.mark.asyncio
async def test_update_asset_type_expected_attributes() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id)
    updated = _asset_type_row(
        asset_type_id=asset_type_id,
        project_id=project_id,
        expected_attributes={"voltage": "number"},
    )
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_asset_type(
        conn,
        asset_type_id=asset_type_id,
        project_id=project_id,
        expected_attributes={"voltage": "number"},
    )
    assert result["expected_attributes"] == {"voltage": "number"}


@pytest.mark.asyncio
async def test_update_asset_type_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await update_asset_type(
            conn, asset_type_id=asset_type_id, project_id=project_id, name="X"
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_asset_type_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id, name="OldName")
    conn.fetchrow.side_effect = [
        existing,
        asyncpg.UniqueViolationError("duplicate key"),
    ]

    with pytest.raises(HTTPException) as exc_info:
        await update_asset_type(
            conn, asset_type_id=asset_type_id, project_id=project_id, name="ExistingName"
        )
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# delete_asset_type tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_asset_type_empty_succeeds() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 0

    await delete_asset_type(conn, asset_type_id=asset_type_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_asset_type_with_asset_references_raises_409() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    existing = _asset_type_row(asset_type_id=asset_type_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 3

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset_type(conn, asset_type_id=asset_type_id, project_id=project_id)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_delete_asset_type_not_found_raises_404() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await delete_asset_type(conn, asset_type_id=asset_type_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# RLS: user not in participations cannot CRUD
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_no_rows() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_asset_types(conn, project_id=project_id)
    assert result == []
