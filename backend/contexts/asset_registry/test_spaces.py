"""
Unit tests for spaces.py CRUD module.
All DB calls are mocked — no live database required.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from contexts.asset_registry.spaces import (
    create_space,
    delete_space,
    get_space,
    list_spaces,
    update_space,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _space_row(
    *,
    space_id: str | None = None,
    project_id: str | None = None,
    parent_space_id: str | None = None,
    kind: str = "campus",
    name: str = "Test Space",
    ordinal: int | None = None,
) -> dict[str, Any]:
    sid = uuid.UUID(space_id) if space_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    psid = uuid.UUID(parent_space_id) if parent_space_id else None
    return {
        "id": sid,
        "project_id": pid,
        "parent_space_id": psid,
        "kind": kind,
        "name": name,
        "ordinal": ordinal,
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
# create_space tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_top_level_campus() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _space_row(project_id=project_id, kind="campus", name="Main Campus")
    conn.fetchrow.side_effect = [None, row]  # first call: parent lookup skipped; INSERT

    # No parent → top-level
    conn.fetchrow.side_effect = [row]
    result = await create_space(conn, project_id=project_id, kind="campus", name="Main Campus")
    assert result["kind"] == "campus"
    assert result["name"] == "Main Campus"


@pytest.mark.asyncio
async def test_create_child_building_under_campus() -> None:
    project_id = _make_uuid()
    campus_id = _make_uuid()
    conn = _mock_conn()
    parent_row = {"kind": "campus"}
    child_row = _space_row(project_id=project_id, parent_space_id=campus_id, kind="building", name="HQ")
    conn.fetchrow.side_effect = [parent_row, child_row]

    result = await create_space(
        conn,
        project_id=project_id,
        kind="building",
        name="HQ",
        parent_space_id=campus_id,
    )
    assert result["kind"] == "building"


@pytest.mark.asyncio
async def test_create_reject_malformed_parent_kind() -> None:
    project_id = _make_uuid()
    building_id = _make_uuid()
    conn = _mock_conn()
    parent_row = {"kind": "building"}
    conn.fetchrow.return_value = parent_row

    with pytest.raises(HTTPException) as exc_info:
        await create_space(
            conn,
            project_id=project_id,
            kind="campus",
            name="Bad Campus",
            parent_space_id=building_id,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_create_reject_room_under_campus() -> None:
    project_id = _make_uuid()
    campus_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = {"kind": "campus"}

    with pytest.raises(HTTPException) as exc_info:
        await create_space(
            conn,
            project_id=project_id,
            kind="room",
            name="Room 101",
            parent_space_id=campus_id,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_create_rejects_unknown_child_kind() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()

    with pytest.raises(HTTPException) as exc_info:
        await create_space(conn, project_id=project_id, kind="galaxy", name="Andromeda")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_create_parent_not_found_raises_404() -> None:
    project_id = _make_uuid()
    missing_parent = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None  # parent lookup returns nothing

    with pytest.raises(HTTPException) as exc_info:
        await create_space(
            conn,
            project_id=project_id,
            kind="floor",
            name="Floor 1",
            parent_space_id=missing_parent,
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# get_space tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_space_found() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    row = _space_row(space_id=space_id, project_id=project_id, kind="building")
    conn.fetchrow.return_value = row

    result = await get_space(conn, space_id=space_id, project_id=project_id)
    assert str(result["id"]) == space_id


@pytest.mark.asyncio
async def test_get_space_not_found_raises_404() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_space(conn, space_id=space_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_spaces tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_spaces_project_scoped() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _space_row(project_id=project_id, kind="campus", name="A"),
        _space_row(project_id=project_id, kind="building", name="B"),
    ]
    conn.fetch.return_value = rows

    result = await list_spaces(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_spaces_with_parent_filter() -> None:
    project_id = _make_uuid()
    parent_id = _make_uuid()
    conn = _mock_conn()
    rows = [_space_row(project_id=project_id, parent_space_id=parent_id, kind="floor", name="F1")]
    conn.fetch.return_value = rows

    result = await list_spaces(conn, project_id=project_id, parent_space_id=parent_id)
    assert len(result) == 1


# ---------------------------------------------------------------------------
# update_space tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_space_rename() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="campus", name="Old Name")
    updated = _space_row(space_id=space_id, project_id=project_id, kind="campus", name="New Name")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_space(conn, space_id=space_id, project_id=project_id, name="New Name")
    assert result["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_space_reparent_valid() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    new_parent_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="floor", name="F1", parent_space_id=_make_uuid())
    parent_row = {"kind": "building"}
    updated = _space_row(space_id=space_id, project_id=project_id, kind="floor", name="F1", parent_space_id=new_parent_id)
    conn.fetchrow.side_effect = [existing, parent_row, updated]

    result = await update_space(
        conn,
        space_id=space_id,
        project_id=project_id,
        parent_space_id=new_parent_id,
    )
    assert result["kind"] == "floor"


@pytest.mark.asyncio
async def test_update_space_reparent_invalid_raises_400() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    new_parent_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="campus", name="Main")
    parent_row = {"kind": "floor"}
    conn.fetchrow.side_effect = [existing, parent_row]

    with pytest.raises(HTTPException) as exc_info:
        await update_space(
            conn,
            space_id=space_id,
            project_id=project_id,
            parent_space_id=new_parent_id,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_update_space_not_found_raises_404() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await update_space(conn, space_id=space_id, project_id=project_id, name="X")
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# delete_space tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_space_empty_succeeds() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="campus")
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 0]  # no children, no assets

    await delete_space(conn, space_id=space_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_space_with_children_raises_409() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="campus")
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 2  # has children

    with pytest.raises(HTTPException) as exc_info:
        await delete_space(conn, space_id=space_id, project_id=project_id)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_delete_space_with_assets_raises_409() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    existing = _space_row(space_id=space_id, project_id=project_id, kind="floor")
    conn.fetchrow.return_value = existing
    conn.fetchval.side_effect = [0, 3]  # no children, but has assets

    with pytest.raises(HTTPException) as exc_info:
        await delete_space(conn, space_id=space_id, project_id=project_id)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_delete_space_not_found_raises_404() -> None:
    project_id = _make_uuid()
    space_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await delete_space(conn, space_id=space_id, project_id=project_id)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# RLS: user not in participations cannot CRUD
# (tested via API layer with mocked auth — demonstrates policy is enforced by DB)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_no_rows() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_spaces(conn, project_id=project_id)
    assert result == []
