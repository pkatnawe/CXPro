"""
Deep module: AssetType CRUD.
Public API: create_asset_type, get_asset_type, list_asset_types, update_asset_type, delete_asset_type.
"""

from __future__ import annotations

import uuid
from typing import Any

import asyncpg
from fastapi import HTTPException


async def create_asset_type(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    name: str,
    description: str | None = None,
    expected_attributes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO asset_types (id, project_id, name, description, expected_attributes)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            RETURNING id, project_id, name, description, expected_attributes, created_at
            """,
            uuid.UUID(project_id),
            name,
            description,
            expected_attributes if expected_attributes is not None else {},
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="An asset type with this name already exists in the project",
        )
    return dict(row)


async def get_asset_type(
    conn: asyncpg.Connection,
    *,
    asset_type_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, project_id, name, description, expected_attributes, created_at FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Asset type not found")
    return dict(row)


async def list_asset_types(
    conn: asyncpg.Connection,
    *,
    project_id: str,
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        "SELECT id, project_id, name, description, expected_attributes, created_at FROM asset_types WHERE project_id = $1 ORDER BY name",
        uuid.UUID(project_id),
    )
    return [dict(r) for r in rows]


async def update_asset_type(
    conn: asyncpg.Connection,
    *,
    asset_type_id: str,
    project_id: str,
    name: str | None = None,
    description: str | None = ...,  # type: ignore[assignment]
    expected_attributes: dict[str, Any] | None = ...,  # type: ignore[assignment]
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        "SELECT id, project_id, name, description, expected_attributes, created_at FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset type not found")

    new_name = name if name is not None else existing["name"]
    new_description = existing["description"] if description is ... else description
    new_expected_attributes = existing["expected_attributes"] if expected_attributes is ... else expected_attributes

    try:
        row = await conn.fetchrow(
            """
            UPDATE asset_types
            SET name = $1, description = $2, expected_attributes = $3
            WHERE id = $4 AND project_id = $5
            RETURNING id, project_id, name, description, expected_attributes, created_at
            """,
            new_name,
            new_description,
            new_expected_attributes if new_expected_attributes is not None else {},
            uuid.UUID(asset_type_id),
            uuid.UUID(project_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="An asset type with this name already exists in the project",
        )
    return dict(row)


async def delete_asset_type(
    conn: asyncpg.Connection,
    *,
    asset_type_id: str,
    project_id: str,
) -> None:
    existing = await conn.fetchrow(
        "SELECT id FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Asset type not found")

    asset_count = await conn.fetchval(
        "SELECT COUNT(*) FROM assets WHERE asset_type_id = $1",
        uuid.UUID(asset_type_id),
    )
    if asset_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete an asset type that is referenced by assets",
        )

    await conn.execute(
        "DELETE FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
