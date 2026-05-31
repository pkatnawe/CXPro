"""
Deep module: System CRUD with recursive parent model and Asset membership management.
Public API: create_system, get_system, list_systems, update_system, delete_system,
            add_asset_to_system, remove_asset_from_system, list_system_members.
"""

from __future__ import annotations

import uuid
from typing import Any

import asyncpg
from fastapi import HTTPException


async def create_system(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    name: str,
    description: str | None = None,
    parent_system_id: str | None = None,
) -> dict[str, Any]:
    if parent_system_id is not None:
        parent = await conn.fetchrow(
            "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
            uuid.UUID(parent_system_id),
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent system not found")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO systems (id, project_id, parent_system_id, name, description)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            RETURNING id, project_id, parent_system_id, name, description, created_at
            """,
            uuid.UUID(project_id),
            uuid.UUID(parent_system_id) if parent_system_id else None,
            name,
            description,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A system with this name already exists under the same parent",
        )
    return dict(row)


async def get_system(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, project_id, parent_system_id, name, description, created_at FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="System not found")
    return dict(row)


async def list_systems(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    parent_system_id: str | None = None,
    include_descendants: bool = False,
) -> list[dict[str, Any]]:
    if include_descendants:
        if parent_system_id is not None:
            rows = await conn.fetch(
                """
                WITH RECURSIVE descendants AS (
                    SELECT id, project_id, parent_system_id, name, description, created_at
                    FROM systems
                    WHERE parent_system_id = $1 AND project_id = $2
                    UNION ALL
                    SELECT s.id, s.project_id, s.parent_system_id, s.name, s.description, s.created_at
                    FROM systems s
                    INNER JOIN descendants d ON s.parent_system_id = d.id
                )
                SELECT * FROM descendants ORDER BY name
                """,
                uuid.UUID(parent_system_id),
                uuid.UUID(project_id),
            )
        else:
            rows = await conn.fetch(
                """
                WITH RECURSIVE descendants AS (
                    SELECT id, project_id, parent_system_id, name, description, created_at
                    FROM systems
                    WHERE parent_system_id IS NULL AND project_id = $1
                    UNION ALL
                    SELECT s.id, s.project_id, s.parent_system_id, s.name, s.description, s.created_at
                    FROM systems s
                    INNER JOIN descendants d ON s.parent_system_id = d.id
                )
                SELECT * FROM descendants ORDER BY name
                """,
                uuid.UUID(project_id),
            )
    elif parent_system_id is not None:
        rows = await conn.fetch(
            "SELECT id, project_id, parent_system_id, name, description, created_at FROM systems WHERE project_id = $1 AND parent_system_id = $2 ORDER BY name",
            uuid.UUID(project_id),
            uuid.UUID(parent_system_id),
        )
    else:
        rows = await conn.fetch(
            "SELECT id, project_id, parent_system_id, name, description, created_at FROM systems WHERE project_id = $1 ORDER BY name",
            uuid.UUID(project_id),
        )
    return [dict(r) for r in rows]


async def update_system(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    project_id: str,
    name: str | None = None,
    description: str | None = ...,  # type: ignore[assignment]
    parent_system_id: str | None = ...,  # type: ignore[assignment]
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        "SELECT id, project_id, parent_system_id, name, description, created_at FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="System not found")

    new_name = name if name is not None else existing["name"]
    new_description = existing["description"] if description is ... else description
    new_parent_id = (
        existing["parent_system_id"]
        if parent_system_id is ...
        else (uuid.UUID(parent_system_id) if parent_system_id is not None else None)
    )

    if new_parent_id is not None and str(new_parent_id) != str(existing.get("parent_system_id") or ""):
        parent = await conn.fetchrow(
            "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
            new_parent_id,
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent system not found")

    try:
        row = await conn.fetchrow(
            """
            UPDATE systems
            SET name = $1, description = $2, parent_system_id = $3
            WHERE id = $4 AND project_id = $5
            RETURNING id, project_id, parent_system_id, name, description, created_at
            """,
            new_name,
            new_description,
            new_parent_id,
            uuid.UUID(system_id),
            uuid.UUID(project_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A system with this name already exists under the same parent",
        )
    return dict(row)


async def delete_system(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    project_id: str,
) -> None:
    existing = await conn.fetchrow(
        "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="System not found")

    child_count = await conn.fetchval(
        "SELECT COUNT(*) FROM systems WHERE parent_system_id = $1",
        uuid.UUID(system_id),
    )
    if child_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a system that has child systems",
        )

    member_count = await conn.fetchval(
        "SELECT COUNT(*) FROM asset_system_memberships WHERE system_id = $1",
        uuid.UUID(system_id),
    )
    if member_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a system that has asset memberships",
        )

    await conn.execute(
        "DELETE FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )


async def add_asset_to_system(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    asset_id: str,
    project_id: str,
) -> dict[str, Any]:
    system = await conn.fetchrow(
        "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if system is None:
        raise HTTPException(status_code=404, detail="System not found")

    asset = await conn.fetchrow(
        "SELECT id FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO asset_system_memberships (asset_id, system_id, added_at)
            VALUES ($1, $2, NOW())
            RETURNING asset_id, system_id, added_at
            """,
            uuid.UUID(asset_id),
            uuid.UUID(system_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="Asset is already a member of this system",
        )
    return dict(row)


async def remove_asset_from_system(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    asset_id: str,
    project_id: str,
) -> None:
    system = await conn.fetchrow(
        "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if system is None:
        raise HTTPException(status_code=404, detail="System not found")

    membership = await conn.fetchrow(
        "SELECT asset_id FROM asset_system_memberships WHERE asset_id = $1 AND system_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(system_id),
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="Asset is not a member of this system")

    await conn.execute(
        "DELETE FROM asset_system_memberships WHERE asset_id = $1 AND system_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(system_id),
    )


async def list_system_members(
    conn: asyncpg.Connection,
    *,
    system_id: str,
    project_id: str,
) -> list[dict[str, Any]]:
    system = await conn.fetchrow(
        "SELECT id FROM systems WHERE id = $1 AND project_id = $2",
        uuid.UUID(system_id),
        uuid.UUID(project_id),
    )
    if system is None:
        raise HTTPException(status_code=404, detail="System not found")

    rows = await conn.fetch(
        """
        SELECT a.id, a.project_id, a.tag, a.name, a.status, asm.added_at
        FROM asset_system_memberships asm
        JOIN assets a ON a.id = asm.asset_id
        WHERE asm.system_id = $1
        ORDER BY a.tag
        """,
        uuid.UUID(system_id),
    )
    return [dict(r) for r in rows]
