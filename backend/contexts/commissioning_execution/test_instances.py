"""
Unit tests for instances.py CRUD module.
All DB calls are mocked — no live database required.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from contexts.commissioning_execution.instances import (
    create_instance,
    delete_instance,
    generate_instances_for_asset,
    get_instance,
    list_instances,
    update_instance_status,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_uuid() -> str:
    return str(uuid.uuid4())


def _instance_row(
    *,
    instance_id: str | None = None,
    project_id: str | None = None,
    template_id: str | None = None,
    asset_id: str | None = None,
    system_id: str | None = None,
    level: str = "L2",
    status: str = "pending",
) -> dict[str, Any]:
    iid = uuid.UUID(instance_id) if instance_id else uuid.uuid4()
    pid = uuid.UUID(project_id) if project_id else uuid.uuid4()
    tid = uuid.UUID(template_id) if template_id else uuid.uuid4()
    aid = uuid.UUID(asset_id) if asset_id else None
    sid = uuid.UUID(system_id) if system_id else None
    return {
        "id": iid,
        "project_id": pid,
        "template_id": tid,
        "asset_id": aid,
        "system_id": sid,
        "level": level,
        "status": status,
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
# generate_instances_for_asset tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_instances_creates_one_per_linked_template() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    asset_type_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()

    tmpl_rows = [{"id": uuid.UUID(template_id), "level": "L2"}]
    instance_row = _instance_row(
        project_id=project_id, template_id=template_id, asset_id=asset_id
    )
    conn.fetch.return_value = tmpl_rows
    conn.fetchrow.side_effect = [None, instance_row]

    result = await generate_instances_for_asset(
        conn, asset_id=asset_id, asset_type_id=asset_type_id, project_id=project_id
    )
    assert len(result) == 1
    assert result[0]["level"] == "L2"


@pytest.mark.asyncio
async def test_generate_instances_idempotent_skips_existing() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    asset_type_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()

    tmpl_rows = [{"id": uuid.UUID(template_id), "level": "L3"}]
    existing_instance = {"id": uuid.uuid4()}
    conn.fetch.return_value = tmpl_rows
    conn.fetchrow.return_value = existing_instance

    result = await generate_instances_for_asset(
        conn, asset_id=asset_id, asset_type_id=asset_type_id, project_id=project_id
    )
    assert result == []


@pytest.mark.asyncio
async def test_generate_instances_no_templates_returns_empty() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    asset_type_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await generate_instances_for_asset(
        conn, asset_id=asset_id, asset_type_id=asset_type_id, project_id=project_id
    )
    assert result == []


@pytest.mark.asyncio
async def test_generate_instances_multiple_templates() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    asset_type_id = _make_uuid()
    t1, t2 = _make_uuid(), _make_uuid()
    conn = _mock_conn()

    tmpl_rows = [
        {"id": uuid.UUID(t1), "level": "L2"},
        {"id": uuid.UUID(t2), "level": "L3"},
    ]
    row1 = _instance_row(project_id=project_id, template_id=t1, asset_id=asset_id, level="L2")
    row2 = _instance_row(project_id=project_id, template_id=t2, asset_id=asset_id, level="L3")
    conn.fetch.return_value = tmpl_rows
    conn.fetchrow.side_effect = [None, row1, None, row2]

    result = await generate_instances_for_asset(
        conn, asset_id=asset_id, asset_type_id=asset_type_id, project_id=project_id
    )
    assert len(result) == 2


# ---------------------------------------------------------------------------
# create_instance tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_instance_with_asset_id() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()

    tmpl_row = {"id": uuid.UUID(template_id), "level": "L2"}
    inst_row = _instance_row(
        project_id=project_id, template_id=template_id, asset_id=asset_id
    )
    conn.fetchrow.side_effect = [tmpl_row, inst_row]

    result = await create_instance(
        conn, project_id=project_id, template_id=template_id, asset_id=asset_id
    )
    assert result["level"] == "L2"
    assert result["status"] == "pending"


@pytest.mark.asyncio
async def test_create_instance_with_system_id() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()

    tmpl_row = {"id": uuid.UUID(template_id), "level": "L4"}
    inst_row = _instance_row(
        project_id=project_id, template_id=template_id, system_id=system_id, level="L4"
    )
    conn.fetchrow.side_effect = [tmpl_row, inst_row]

    result = await create_instance(
        conn, project_id=project_id, template_id=template_id, system_id=system_id
    )
    assert result["level"] == "L4"


@pytest.mark.asyncio
async def test_create_instance_xor_neither_raises_422() -> None:
    conn = _mock_conn()
    with pytest.raises(HTTPException) as exc_info:
        await create_instance(
            conn, project_id=_make_uuid(), template_id=_make_uuid()
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_instance_xor_both_raises_422() -> None:
    conn = _mock_conn()
    with pytest.raises(HTTPException) as exc_info:
        await create_instance(
            conn,
            project_id=_make_uuid(),
            template_id=_make_uuid(),
            asset_id=_make_uuid(),
            system_id=_make_uuid(),
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_instance_template_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await create_instance(
            conn,
            project_id=_make_uuid(),
            template_id=_make_uuid(),
            asset_id=_make_uuid(),
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# get_instance tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_instance_found() -> None:
    project_id = _make_uuid()
    instance_id = _make_uuid()
    conn = _mock_conn()
    row = _instance_row(instance_id=instance_id, project_id=project_id)
    conn.fetchrow.return_value = row

    result = await get_instance(conn, instance_id=instance_id, project_id=project_id)
    assert str(result["id"]) == instance_id


@pytest.mark.asyncio
async def test_get_instance_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await get_instance(conn, instance_id=_make_uuid(), project_id=_make_uuid())
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_instances tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_instances_all() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [
        _instance_row(project_id=project_id, level="L2"),
        _instance_row(project_id=project_id, level="L3"),
    ]
    conn.fetch.return_value = rows

    result = await list_instances(conn, project_id=project_id)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_instances_filter_by_asset_id() -> None:
    project_id = _make_uuid()
    asset_id = _make_uuid()
    conn = _mock_conn()
    rows = [_instance_row(project_id=project_id, asset_id=asset_id)]
    conn.fetch.return_value = rows

    result = await list_instances(conn, project_id=project_id, asset_id=asset_id)
    assert len(result) == 1
    assert str(result[0]["asset_id"]) == asset_id


@pytest.mark.asyncio
async def test_list_instances_filter_by_system_id() -> None:
    project_id = _make_uuid()
    system_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_instances(conn, project_id=project_id, system_id=system_id)
    assert result == []


@pytest.mark.asyncio
async def test_list_instances_filter_by_level() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [_instance_row(project_id=project_id, level="L3")]
    conn.fetch.return_value = rows

    result = await list_instances(conn, project_id=project_id, level="L3")
    assert len(result) == 1
    assert result[0]["level"] == "L3"


@pytest.mark.asyncio
async def test_list_instances_filter_by_status() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    rows = [_instance_row(project_id=project_id, status="in_progress")]
    conn.fetch.return_value = rows

    result = await list_instances(conn, project_id=project_id, status="in_progress")
    assert len(result) == 1
    assert result[0]["status"] == "in_progress"


@pytest.mark.asyncio
async def test_list_instances_empty() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_instances(conn, project_id=project_id)
    assert result == []


# ---------------------------------------------------------------------------
# update_instance_status tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_instance_status_pending_to_in_progress() -> None:
    project_id = _make_uuid()
    instance_id = _make_uuid()
    conn = _mock_conn()
    existing = _instance_row(instance_id=instance_id, project_id=project_id, status="pending")
    updated = _instance_row(instance_id=instance_id, project_id=project_id, status="in_progress")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_instance_status(
        conn, instance_id=instance_id, project_id=project_id, status="in_progress"
    )
    assert result["status"] == "in_progress"


@pytest.mark.asyncio
async def test_update_instance_status_to_complete() -> None:
    project_id = _make_uuid()
    instance_id = _make_uuid()
    conn = _mock_conn()
    existing = _instance_row(instance_id=instance_id, project_id=project_id, status="in_progress")
    updated = _instance_row(instance_id=instance_id, project_id=project_id, status="complete")
    conn.fetchrow.side_effect = [existing, updated]

    result = await update_instance_status(
        conn, instance_id=instance_id, project_id=project_id, status="complete"
    )
    assert result["status"] == "complete"


@pytest.mark.asyncio
async def test_update_instance_status_invalid_raises_422() -> None:
    conn = _mock_conn()
    with pytest.raises(HTTPException) as exc_info:
        await update_instance_status(
            conn, instance_id=_make_uuid(), project_id=_make_uuid(), status="invalid"
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_update_instance_status_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await update_instance_status(
            conn, instance_id=_make_uuid(), project_id=_make_uuid(), status="complete"
        )
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# delete_instance tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_instance_success() -> None:
    project_id = _make_uuid()
    instance_id = _make_uuid()
    conn = _mock_conn()
    existing = _instance_row(instance_id=instance_id, project_id=project_id)
    conn.fetchrow.return_value = existing

    await delete_instance(conn, instance_id=instance_id, project_id=project_id)
    conn.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_instance_not_found_raises_404() -> None:
    conn = _mock_conn()
    conn.fetchrow.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await delete_instance(conn, instance_id=_make_uuid(), project_id=_make_uuid())
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# list_instances template_id filter tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_instances_filter_by_template_id_returns_matching() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    rows = [_instance_row(project_id=project_id, template_id=template_id)]
    conn.fetch.return_value = rows

    result = await list_instances(conn, project_id=project_id, template_id=template_id)
    assert len(result) == 1
    assert str(result[0]["template_id"]) == template_id


@pytest.mark.asyncio
async def test_list_instances_template_id_composes_with_status() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    rows = [_instance_row(project_id=project_id, template_id=template_id, status="complete")]
    conn.fetch.return_value = rows

    result = await list_instances(
        conn, project_id=project_id, template_id=template_id, status="complete"
    )
    assert len(result) == 1
    assert result[0]["status"] == "complete"
    call_args = conn.fetch.call_args
    query: str = call_args[0][0]
    assert "template_id" in query
    assert "status" in query


@pytest.mark.asyncio
async def test_list_instances_unknown_template_id_returns_empty() -> None:
    project_id = _make_uuid()
    unknown_template_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_instances(
        conn, project_id=project_id, template_id=unknown_template_id
    )
    assert result == []


# ---------------------------------------------------------------------------
# RLS: unauthorized user gets empty list
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rls_unauthorized_user_gets_empty_list() -> None:
    project_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_instances(conn, project_id=project_id)
    assert result == []


@pytest.mark.asyncio
async def test_rls_template_id_filter_unauthorized_gets_empty() -> None:
    project_id = _make_uuid()
    template_id = _make_uuid()
    conn = _mock_conn()
    conn.fetch.return_value = []

    result = await list_instances(
        conn, project_id=project_id, template_id=template_id
    )
    assert result == []
