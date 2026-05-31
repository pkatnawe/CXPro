"""
Deep module: TestProcedureTemplate CRUD + AssetType link management.
Public API: create_template, get_template, list_templates, update_template, delete_template,
            link_template_to_asset_type, unlink_template_from_asset_type.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

import asyncpg
from fastapi import HTTPException

VALID_LEVELS = frozenset({"L1", "L2", "L3", "L4", "L5"})


async def create_template(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    name: str,
    level: str,
    description: str | None = None,
    steps: list[Any] | None = None,
) -> dict[str, Any]:
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(VALID_LEVELS)}")
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO test_procedure_templates (id, project_id, name, level, description, steps)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
            RETURNING id, project_id, name, level, description, steps, created_at
            """,
            uuid.UUID(project_id),
            name,
            level,
            description,
            json.dumps(steps if steps is not None else []),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A template with this name already exists in the project",
        )
    return dict(row)


async def get_template(
    conn: asyncpg.Connection,
    *,
    template_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        "SELECT id, project_id, name, level, description, steps, created_at FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return dict(row)


async def list_templates(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    level: str | None = None,
    asset_type_id: str | None = None,
) -> list[dict[str, Any]]:
    if asset_type_id is not None:
        rows = await conn.fetch(
            """
            SELECT tpt.id, tpt.project_id, tpt.name, tpt.level, tpt.description, tpt.steps, tpt.created_at
            FROM test_procedure_templates tpt
            JOIN asset_type_template_links attl ON attl.test_procedure_template_id = tpt.id
            WHERE tpt.project_id = $1 AND attl.asset_type_id = $2
            ORDER BY tpt.name
            """,
            uuid.UUID(project_id),
            uuid.UUID(asset_type_id),
        )
    elif level is not None:
        rows = await conn.fetch(
            "SELECT id, project_id, name, level, description, steps, created_at FROM test_procedure_templates WHERE project_id = $1 AND level = $2 ORDER BY name",
            uuid.UUID(project_id),
            level,
        )
    else:
        rows = await conn.fetch(
            "SELECT id, project_id, name, level, description, steps, created_at FROM test_procedure_templates WHERE project_id = $1 ORDER BY name",
            uuid.UUID(project_id),
        )
    return [dict(r) for r in rows]


async def update_template(
    conn: asyncpg.Connection,
    *,
    template_id: str,
    project_id: str,
    name: str | None = None,
    level: str | None = None,
    description: str | None = ...,  # type: ignore[assignment]
    steps: list[Any] | None = ...,  # type: ignore[assignment]
) -> dict[str, Any]:
    existing = await conn.fetchrow(
        "SELECT id, project_id, name, level, description, steps, created_at FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Template not found")

    new_name = name if name is not None else existing["name"]
    new_level = level if level is not None else existing["level"]
    if new_level not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(VALID_LEVELS)}")
    new_description = existing["description"] if description is ... else description
    new_steps = existing["steps"] if steps is ... else steps

    try:
        row = await conn.fetchrow(
            """
            UPDATE test_procedure_templates
            SET name = $1, level = $2, description = $3, steps = $4
            WHERE id = $5 AND project_id = $6
            RETURNING id, project_id, name, level, description, steps, created_at
            """,
            new_name,
            new_level,
            new_description,
            json.dumps(new_steps if new_steps is not None else []),
            uuid.UUID(template_id),
            uuid.UUID(project_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A template with this name already exists in the project",
        )
    return dict(row)


async def delete_template(
    conn: asyncpg.Connection,
    *,
    template_id: str,
    project_id: str,
) -> None:
    existing = await conn.fetchrow(
        "SELECT id FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Template not found")

    instance_count = await conn.fetchval(
        "SELECT COUNT(*) FROM test_procedure_instances WHERE template_id = $1",
        uuid.UUID(template_id),
    )
    if instance_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a template that is referenced by test procedure instances",
        )

    await conn.execute(
        "DELETE FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )


async def link_template_to_asset_type(
    conn: asyncpg.Connection,
    *,
    template_id: str,
    asset_type_id: str,
    project_id: str,
) -> dict[str, Any]:
    template = await conn.fetchrow(
        "SELECT id FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    asset_type = await conn.fetchrow(
        "SELECT id FROM asset_types WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )
    if asset_type is None:
        raise HTTPException(status_code=404, detail="Asset type not found")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO asset_type_template_links (asset_type_id, test_procedure_template_id)
            VALUES ($1, $2)
            RETURNING asset_type_id, test_procedure_template_id, created_at
            """,
            uuid.UUID(asset_type_id),
            uuid.UUID(template_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="This template is already linked to the asset type",
        )
    return dict(row)


async def unlink_template_from_asset_type(
    conn: asyncpg.Connection,
    *,
    template_id: str,
    asset_type_id: str,
    project_id: str,
) -> None:
    template = await conn.fetchrow(
        "SELECT id FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    result = await conn.execute(
        "DELETE FROM asset_type_template_links WHERE asset_type_id = $1 AND test_procedure_template_id = $2",
        uuid.UUID(asset_type_id),
        uuid.UUID(template_id),
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Link not found")
