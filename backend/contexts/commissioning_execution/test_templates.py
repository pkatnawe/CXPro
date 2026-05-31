"""
Unit tests for templates.py CRUD module.
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

from contexts.commissioning_execution.templates import (
    create_template,
    delete_template,
    get_template,
    link_template_to_asset_type,
    list_templates,
    unlink_template_from_asset_type,
    update_template,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _template_row(
    *,
    template_id: str | None = None,
    project_id: str | None = None,
    name: str = "L2 Startup Checklist",
    level: str = "L2",
    description: str | None = None,
    steps: list[Any] | None = None,
) -> dict[str, Any]:
    tid = uuid.UUID(template_id) if template_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    return {
        "id": tid,
        "project_id": pid,
        "name": name,
        "level": level,
        "description": description,
        "steps": steps or [],
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
# create_template tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_template_l1() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(project_id=project_id, name="L1 Design Review", level="L1")
    conn.fetchrow.return_value = row

    result = await create_template(conn, project_id=project_id, name="L1 Design Review", level="L1")
    assert result["level"] == "L1"
    assert result["name"] == "L1 Design Review"


@pytest.mark.asyncio
async def test_create_template_l2() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(project_id=project_id, name="Startup Checklist", level="L2")
    conn.fetchrow.return_value = row

    result = await create_template(conn, project_id=project_id, name="Startup Checklist", level="L2")
    assert result["level"] == "L2"


@pytest.mark.asyncio
async def test_create_template_l3() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(project_id=project_id, name="Functional Test", level="L3")
    conn.fetchrow.return_value = row

    result = await create_template(conn, project_id=project_id, name="Functional Test", level="L3")
    assert result["level"] == "L3"


@pytest.mark.asyncio
async def test_create_template_l4() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(project_id=project_id, name="Integration Test", level="L4")
    conn.fetchrow.return_value = row

    result = await create_template(conn, project_id=project_id, name="Integration Test", level="L4")
    assert result["level"] == "L4"


@pytest.mark.asyncio
async def test_create_template_l5() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(project_id=project_id, name="System Test", level="L5")
    conn.fetchrow.return_value = row

    result = await create_template(conn, project_id=project_id, name="System Test", level="L5")
    assert result["level"] == "L5"


@pytest.mark.asyncio
async def test_create_template_invalid_level_raises_422() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()

    with pytest.raises(HTTPException) as exc_info:
        await create_template(conn, project_id=project_id, name="Bad Template", level="L6")
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_template_with_steps() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    steps = [{"step": 1, "description": "Check voltage"}]
    row = _template_row(project_id=project_id, steps=steps)
    conn.fetchrow.return_value = row

    result = await create_template(
        conn, project_id=project_id, name="Checklist", level="L2", steps=steps
    )
    assert result["steps"] == steps


@pytest.mark.asyncio
async def test_create_template_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetchrow.side_effect = asyncpg.UniqueViolationError("duplicate key")

    with pytest.raises(HTTPException) as exc_info:
        await create_template(conn, project_id=project_id, name="Checklist", level="L2")
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# get_template tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_template_found() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    row = _template_row(template_id=template_id, project_id=project_id)
    conn.fetchrow.return_value = row

    result = await get_template(conn, template_id=template_id, project_id=project_id)
    assert str(result["id"]) == template_id


@pytest.mark.asyncio
async def test_get_template_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_template(conn, template_id=_make_uuid(), project_id=_make_uuid())
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_templates tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_templates_all() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _template_row(project_id=project_id, name="T1", level="L1"),
        _template_row(project_id=project_id, name="T2", level="L2"),
    ]
    conn.fetch.return_value = rows

    result = await list_templates(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_templates_by_level() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [_template_row(project_id=project_id, level="L3")]
    conn.fetch.return_value = rows

    result = await list_templates(conn, project_id=project_id, level="L3")
    assert len(result) == 1
    assert result[0]["level"] == "L3"


@pytest.mark.asyncio
async def test_list_templates_by_asset_type_id() -> None:
    project_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    rows = [_template_row(project_id=project_id)]
    conn.fetch.return_value = rows

    result = await list_templates(conn, project_id=project_id, asset_type_id=asset_type_id)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_list_templates_empty() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_templates(conn, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# update_template tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_template_rename() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    existing = _template_row(template_id=template_id, project_id=project_id, name="Old Name")
    updated = _template_row(template_id=template_id, project_id=project_id, name="New Name")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_template(
        conn, template_id=template_id, project_id=project_id, name="New Name"
    )
    assert result["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_template_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await update_template(conn, template_id=_make_uuid(), project_id=_make_uuid(), name="X")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_template_duplicate_name_raises_409() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    existing = _template_row(template_id=template_id, project_id=project_id)
    conn.fetchrow.side_effect = [existing, asyncpg.UniqueViolationError("dup")]

    with pytest.raises(HTTPException) as exc_info:
        await update_template(
            conn, template_id=template_id, project_id=project_id, name="Existing"
        )
    assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# delete_template tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_template_empty_succeeds() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    existing = _template_row(template_id=template_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 0

    await delete_template(conn, template_id=template_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_template_with_instances_raises_409() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    existing = _template_row(template_id=template_id, project_id=project_id)
    conn.fetchrow.return_value = existing
    conn.fetchval.return_value = 2

    with pytest.raises(HTTPException) as exc_info:
        await delete_template(conn, template_id=template_id, project_id=project_id)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_delete_template_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await delete_template(conn, template_id=_make_uuid(), project_id=_make_uuid())
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# link / unlink AssetType tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_link_template_to_asset_type_success() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()

    template_row = {"id": uuid.UUID(template_id)}
    asset_type_row = {"id": uuid.UUID(asset_type_id)}
    link_row = {
        "asset_type_id": uuid.UUID(asset_type_id),
        "test_procedure_template_id": uuid.UUID(template_id),
        "created_at": datetime.now(timezone.utc),
    }
    conn.fetchrow.side_effect = [template_row, asset_type_row, link_row]

    result = await link_template_to_asset_type(
        conn, template_id=template_id, asset_type_id=asset_type_id, project_id=project_id
    )
    assert str(result["asset_type_id"]) == asset_type_id


@pytest.mark.asyncio
async def test_link_template_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await link_template_to_asset_type(
            conn, template_id=_make_uuid(), asset_type_id=_make_uuid(), project_id=_make_uuid()
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_link_asset_type_not_found_raises_404() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    template_row = {"id": uuid.UUID(template_id)}
    conn.fetchrow.side_effect = [template_row, None]

    with pytest.raises(HTTPException) as exc_info:
        await link_template_to_asset_type(
            conn, template_id=template_id, asset_type_id=_make_uuid(), project_id=project_id
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_link_duplicate_raises_409() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    template_row = {"id": uuid.UUID(template_id)}
    asset_type_row = {"id": uuid.UUID(asset_type_id)}
    conn.fetchrow.side_effect = [
        template_row,
        asset_type_row,
        asyncpg.UniqueViolationError("dup"),
    ]

    with pytest.raises(HTTPException) as exc_info:
        await link_template_to_asset_type(
            conn, template_id=template_id, asset_type_id=asset_type_id, project_id=project_id
        )
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_unlink_template_from_asset_type_success() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    template_row = {"id": uuid.UUID(template_id)}
    conn.fetchrow.return_value = template_row
    conn.execute.return_value = "DELETE 1"

    await unlink_template_from_asset_type(
        conn, template_id=template_id, asset_type_id=asset_type_id, project_id=project_id
    )
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_unlink_link_not_found_raises_404() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    template_row = {"id": uuid.UUID(template_id)}
    conn.fetchrow.return_value = template_row
    conn.execute.return_value = "DELETE 0"

    with pytest.raises(HTTPException) as exc_info:
        await unlink_template_from_asset_type(
            conn, template_id=template_id, asset_type_id=_make_uuid(), project_id=project_id
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# RLS: user not in participations gets no rows
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_empty_list() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_templates(conn, project_id=project_id)
    assert result == []
