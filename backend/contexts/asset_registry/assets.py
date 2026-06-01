"""
Deep module: Asset CRUD with recursive parent model, retire/delete lifecycle.
Public API: create_asset, get_asset, list_assets, update_asset,
            retire_asset, decommission_asset, delete_asset.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Literal

import asyncpg
from fastapi import HTTPException

from contexts.asset_registry.asset_lifecycle import decide_delete_mode
from contexts.commissioning_execution import instances as instances_mod

_ASSET_COLUMNS = (
    "id, project_id, parent_asset_id, asset_type_id, space_id, tag, name, status, "
    "manufacturer, model, serial, vendor_name, nameplate_data, created_at, retired_at, decommissioned_at"
)


async def _resolve_parent_chain(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> set[str]:
    """Return all ancestor IDs for the given asset (used for cycle detection)."""
    rows = await conn.fetch(
        """
        WITH RECURSIVE ancestors AS (
            SELECT id, parent_asset_id
            FROM assets
            WHERE id = $1 AND project_id = $2
            UNION ALL
            SELECT a.id, a.parent_asset_id
            FROM assets a
            INNER JOIN ancestors anc ON a.id = anc.parent_asset_id
        )
        SELECT id FROM ancestors
        """,
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    return {str(r["id"]) for r in rows}


async def create_asset(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    asset_type_id: str,
    tag: str,
    name: str | None = None,
    parent_asset_id: str | None = None,
    space_id: str | None = None,
    manufacturer: str | None = None,
    model: str | None = None,
    serial: str | None = None,
    vendor_name: str | None = None,
    nameplate_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if parent_asset_id is not None:
        parent = await conn.fetchrow(
            "SELECT id FROM assets WHERE id = $1 AND project_id = $2",
            uuid.UUID(parent_asset_id),
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent asset not found")

    asset_type = await conn.fetchrow(
        "SELECT id FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
    if asset_type is None:
        raise HTTPException(status_code=404, detail="Asset type not found")

    if space_id is not None:
        space = await conn.fetchrow(
            "SELECT id FROM spaces WHERE id = $1 AND project_id = $2",
            uuid.UUID(space_id),
            uuid.UUID(project_id),
        )
        if space is None:
            raise HTTPException(status_code=404, detail="Space not found")

    import json

    async with conn.transaction():
        try:
            row = await conn.fetchrow(
                f"""
                INSERT INTO assets (
                    id, project_id, parent_asset_id, asset_type_id, space_id,
                    tag, name, manufacturer, model, serial, vendor_name, nameplate_data
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING {_ASSET_COLUMNS}
                """,
                uuid.UUID(project_id),
                uuid.UUID(parent_asset_id) if parent_asset_id else None,
                uuid.UUID(asset_type_id),
                uuid.UUID(space_id) if space_id else None,
                tag,
                name,
                manufacturer,
                model,
                serial,
                vendor_name,
                json.dumps(nameplate_data or {}),
            )
        except asyncpg.UniqueViolationError:
            raise HTTPException(
                status_code=409,
                detail="An active asset with this tag already exists in the project",
            )

        asset_id = str(row["id"])
        await instances_mod.generate_instances_for_asset(
            conn,
            asset_id=asset_id,
            asset_type_id=asset_type_id,
            project_id=project_id,
        )

    return dict(row)


async def get_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        f"SELECT {_ASSET_COLUMNS} FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return dict(row)


async def list_assets(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    status: str | None = None,
    space_id: str | None = None,
    system_id: str | None = None,
    parent_asset_id: str | None = None,
    asset_type_id: str | None = None,
) -> list[dict[str, Any]]:
    conditions = ["a.project_id = $1"]
    params: list[Any] = [uuid.UUID(project_id)]
    idx = 2

    if status is not None:
        conditions.append(f"a.status = ${idx}")
        params.append(status)
        idx += 1

    if space_id is not None:
        conditions.append(f"a.space_id = ${idx}")
        params.append(uuid.UUID(space_id))
        idx += 1

    if parent_asset_id is not None:
        conditions.append(f"a.parent_asset_id = ${idx}")
        params.append(uuid.UUID(parent_asset_id))
        idx += 1

    if asset_type_id is not None:
        conditions.append(f"a.asset_type_id = ${idx}")
        params.append(uuid.UUID(asset_type_id))
        idx += 1

    where = " AND ".join(conditions)

    if system_id is not None:
        join = f"JOIN asset_system_memberships asm ON asm.asset_id = a.id AND asm.system_id = ${idx}"
        params.append(uuid.UUID(system_id))
        idx += 1
        query = f"SELECT {', '.join('a.' + c.strip() for c in _ASSET_COLUMNS.split(','))} FROM assets a {join} WHERE {where} ORDER BY a.tag"
    else:
        query = f"SELECT {_ASSET_COLUMNS} FROM assets a WHERE {where} ORDER BY a.tag"

    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


async def update_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
    name: str | None = ...,  # type: ignore[assignment]
    tag: str | None = None,
    parent_asset_id: str | None = ...,  # type: ignore[assignment]
    space_id: str | None = ...,  # type: ignore[assignment]
    asset_type_id: str | None = None,
    manufacturer: str | None = ...,  # type: ignore[assignment]
    model: str | None = ...,  # type: ignore[assignment]
    serial: str | None = ...,  # type: ignore[assignment]
    vendor_name: str | None = ...,  # type: ignore[assignment]
    nameplate_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        f"SELECT {_ASSET_COLUMNS} FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    new_name = existing["name"] if name is ... else name
    new_tag = tag if tag is not None else existing["tag"]
    new_parent_id = (
        existing["parent_asset_id"]
        if parent_asset_id is ...
        else (uuid.UUID(parent_asset_id) if parent_asset_id is not None else None)
    )
    new_space_id = (
        existing["space_id"]
        if space_id is ...
        else (uuid.UUID(space_id) if space_id is not None else None)
    )
    new_asset_type_id = uuid.UUID(asset_type_id) if asset_type_id is not None else existing["asset_type_id"]
    new_manufacturer = existing["manufacturer"] if manufacturer is ... else manufacturer
    new_model = existing["model"] if model is ... else model
    new_serial = existing["serial"] if serial is ... else serial
    new_vendor_name = existing["vendor_name"] if vendor_name is ... else vendor_name
    new_nameplate_data = nameplate_data if nameplate_data is not None else existing["nameplate_data"]

    if new_parent_id is not None:
        if str(new_parent_id) == asset_id:
            raise HTTPException(status_code=400, detail="Asset cannot be its own parent")

        ancestors = await _resolve_parent_chain(conn, asset_id=str(new_parent_id), project_id=project_id)
        if asset_id in ancestors:
            raise HTTPException(status_code=400, detail="Reparenting would create a cycle")

        parent = await conn.fetchrow(
            "SELECT id FROM assets WHERE id = $1 AND project_id = $2",
            new_parent_id,
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent asset not found")

    if new_space_id is not None and (existing["space_id"] is None or str(new_space_id) != str(existing["space_id"])):
        space = await conn.fetchrow(
            "SELECT id FROM spaces WHERE id = $1 AND project_id = $2",
            new_space_id,
            uuid.UUID(project_id),
        )
        if space is None:
            raise HTTPException(status_code=404, detail="Space not found")

    if asset_type_id is not None:
        at = await conn.fetchrow(
            "SELECT id FROM asset_types WHERE id = $1 AND project_id = $2",
            new_asset_type_id,
            uuid.UUID(project_id),
        )
        if at is None:
            raise HTTPException(status_code=404, detail="Asset type not found")

    import json

    try:
        row = await conn.fetchrow(
            f"""
            UPDATE assets
            SET tag = $1, name = $2, parent_asset_id = $3, space_id = $4,
                asset_type_id = $5, manufacturer = $6, model = $7, serial = $8,
                vendor_name = $9, nameplate_data = $10
            WHERE id = $11 AND project_id = $12
            RETURNING {_ASSET_COLUMNS}
            """,
            new_tag,
            new_name,
            new_parent_id,
            new_space_id,
            new_asset_type_id,
            new_manufacturer,
            new_model,
            new_serial,
            new_vendor_name,
            json.dumps(new_nameplate_data) if isinstance(new_nameplate_data, dict) else new_nameplate_data,
            uuid.UUID(asset_id),
            uuid.UUID(project_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="An active asset with this tag already exists in the project",
        )

    return dict(row)


async def retire_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        f"SELECT {_ASSET_COLUMNS} FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    if existing["status"] != "active":
        raise HTTPException(
            status_code=409,
            detail=f"Asset is already '{existing['status']}' and cannot be retired",
        )

    now = datetime.now(timezone.utc)
    row = await conn.fetchrow(
        f"""
        UPDATE assets
        SET status = 'retired', retired_at = $1
        WHERE id = $2 AND project_id = $3
        RETURNING {_ASSET_COLUMNS}
        """,
        now,
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    return dict(row)


async def decommission_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        f"SELECT {_ASSET_COLUMNS} FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    if existing["status"] == "decommissioned":
        raise HTTPException(
            status_code=409,
            detail="Asset is already decommissioned",
        )

    now = datetime.now(timezone.utc)
    row = await conn.fetchrow(
        f"""
        UPDATE assets
        SET status = 'decommissioned', decommissioned_at = $1
        WHERE id = $2 AND project_id = $3
        RETURNING {_ASSET_COLUMNS}
        """,
        now,
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    return dict(row)


async def delete_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> Literal["hard_delete"] | dict[str, Any]:
    """
    Attempt to delete an asset.
    Returns "hard_delete" string on success (204).
    Raises HTTPException 409 with body {error, next_action, counts} when references exist.
    """
    existing = await conn.fetchrow(
        f"SELECT {_ASSET_COLUMNS} FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    aid = uuid.UUID(asset_id)

    counts: dict[str, int] = {}
    counts["test_procedure_instances"] = await conn.fetchval(
        "SELECT COUNT(*) FROM test_procedure_instances WHERE asset_id = $1", aid
    ) or 0
    counts["deviations"] = 0
    counts["punch_items"] = 0
    counts["documents"] = 0
    counts["asset_system_memberships"] = await conn.fetchval(
        "SELECT COUNT(*) FROM asset_system_memberships WHERE asset_id = $1", aid
    ) or 0
    counts["points"] = await conn.fetchval(
        "SELECT COUNT(*) FROM points WHERE asset_id = $1", aid
    ) or 0
    counts["child_assets"] = await conn.fetchval(
        "SELECT COUNT(*) FROM assets WHERE parent_asset_id = $1", aid
    ) or 0

    mode = decide_delete_mode(counts)
    if mode == "retire_only":
        raise HTTPException(
            status_code=409,
            detail={
                "error": "has_references",
                "next_action": "retire",
                "counts": counts,
            },
        )

    await conn.execute(
        "DELETE FROM assets WHERE id = $1 AND project_id = $2",
        aid,
        uuid.UUID(project_id),
    )
    return "hard_delete"
