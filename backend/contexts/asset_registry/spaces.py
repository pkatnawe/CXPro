"""
Deep module: Space CRUD with tree-validation enforcement.
Public API: create_space, get_space, list_spaces, update_space, delete_space.
"""

from __future__ import annotations

import uuid
from typing import Any

import asyncpg
from fastapi import HTTPException

from contexts.asset_registry.tree_validation import is_allowed_space_parent


async def create_space(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    kind: str,
    name: str,
    parent_space_id: str | None = None,
    ordinal: int | None = None,
) -> dict[str, Any]:
    if parent_space_id is not None:
        parent = await conn.fetchrow(
            "SELECT kind FROM spaces WHERE id = $1 AND project_id = $2",
            uuid.UUID(parent_space_id),
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent space not found")
        parent_kind: str | None = parent["kind"]
    else:
        parent_kind = None

    if not is_allowed_space_parent(parent_kind, kind):
        raise HTTPException(
            status_code=400,
            detail=f"Kind '{kind}' is not allowed under parent kind '{parent_kind}'",
        )

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO spaces (id, project_id, parent_space_id, kind, name, ordinal)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
            RETURNING id, project_id, parent_space_id, kind, name, ordinal, created_at
            """,
            uuid.UUID(project_id),
            uuid.UUID(parent_space_id) if parent_space_id else None,
            kind,
            name,
            ordinal,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A space with this name already exists under the same parent",
        )

    return dict(row)


async def get_space(
    conn: asyncpg.Connection,
    *,
    space_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, project_id, parent_space_id, kind, name, ordinal, created_at FROM spaces WHERE id = $1 AND project_id = $2",
        uuid.UUID(space_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Space not found")
    return dict(row)


async def list_spaces(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    parent_space_id: str | None = None,
) -> list[dict[str, Any]]:
    if parent_space_id is not None:
        rows = await conn.fetch(
            "SELECT id, project_id, parent_space_id, kind, name, ordinal, created_at FROM spaces WHERE project_id = $1 AND parent_space_id = $2 ORDER BY ordinal NULLS LAST, name",
            uuid.UUID(project_id),
            uuid.UUID(parent_space_id),
        )
    else:
        rows = await conn.fetch(
            "SELECT id, project_id, parent_space_id, kind, name, ordinal, created_at FROM spaces WHERE project_id = $1 ORDER BY ordinal NULLS LAST, name",
            uuid.UUID(project_id),
        )
    return [dict(r) for r in rows]


async def update_space(
    conn: asyncpg.Connection,
    *,
    space_id: str,
    project_id: str,
    name: str | None = None,
    parent_space_id: str | None = ...,  # type: ignore[assignment]
    ordinal: int | None = ...,  # type: ignore[assignment]
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        "SELECT id, project_id, parent_space_id, kind, name, ordinal, created_at FROM spaces WHERE id = $1 AND project_id = $2",
        uuid.UUID(space_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Space not found")

    new_name = name if name is not None else existing["name"]
    new_parent_id = (
        existing["parent_space_id"]
        if parent_space_id is ...
        else (uuid.UUID(parent_space_id) if parent_space_id is not None else None)
    )
    new_ordinal = existing["ordinal"] if ordinal is ... else ordinal

    if new_parent_id is not None and str(new_parent_id) != str(existing["parent_space_id"]):
        parent = await conn.fetchrow(
            "SELECT kind FROM spaces WHERE id = $1 AND project_id = $2",
            new_parent_id,
            uuid.UUID(project_id),
        )
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent space not found")
        parent_kind: str | None = parent["kind"]
        if not is_allowed_space_parent(parent_kind, existing["kind"]):
            raise HTTPException(
                status_code=400,
                detail=f"Kind '{existing['kind']}' is not allowed under parent kind '{parent_kind}'",
            )
    elif new_parent_id is None and existing["parent_space_id"] is not None:
        if not is_allowed_space_parent(None, existing["kind"]):
            raise HTTPException(
                status_code=400,
                detail=f"Kind '{existing['kind']}' cannot be a top-level space",
            )

    try:
        row = await conn.fetchrow(
            """
            UPDATE spaces
            SET name = $1, parent_space_id = $2, ordinal = $3
            WHERE id = $4 AND project_id = $5
            RETURNING id, project_id, parent_space_id, kind, name, ordinal, created_at
            """,
            new_name,
            new_parent_id,
            new_ordinal,
            uuid.UUID(space_id),
            uuid.UUID(project_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A space with this name already exists under the same parent",
        )

    return dict(row)


async def delete_space(
    conn: asyncpg.Connection,
    *,
    space_id: str,
    project_id: str,
) -> None:
    existing = await conn.fetchrow(
        "SELECT id FROM spaces WHERE id = $1 AND project_id = $2",
        uuid.UUID(space_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Space not found")

    child_count = await conn.fetchval(
        "SELECT COUNT(*) FROM spaces WHERE parent_space_id = $1",
        uuid.UUID(space_id),
    )
    if child_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a space that has child spaces",
        )

    asset_count = await conn.fetchval(
        "SELECT COUNT(*) FROM assets WHERE space_id = $1",
        uuid.UUID(space_id),
    )
    if asset_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a space that has asset references",
        )

    await conn.execute(
        "DELETE FROM spaces WHERE id = $1 AND project_id = $2",
        uuid.UUID(space_id),
        uuid.UUID(project_id),
    )
