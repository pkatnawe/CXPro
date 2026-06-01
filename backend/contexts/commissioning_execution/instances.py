"""
Deep module: TestProcedureInstance CRUD + auto-generation from asset creation.
Public API: generate_instances_for_asset, create_instance, get_instance,
            list_instances, update_instance_status, delete_instance.
"""

from __future__ import annotations

import uuid
from typing import Any

import asyncpg
from fastapi import HTTPException

VALID_STATUSES = frozenset({"pending", "in_progress", "complete"})

_INSTANCE_COLUMNS = (
    "id, project_id, template_id, asset_id, system_id, level, status, created_at"
)


async def generate_instances_for_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    asset_type_id: str,
    project_id: str,
) -> list[dict[str, Any]]:
    """
    Create one test_procedure_instance per template linked to the asset_type.
    Idempotent: skips if (asset_id, template_id) already exists.
    Must be called within the same transaction as create_asset.
    """
    templates = await conn.fetch(
        """
        SELECT tpt.id, tpt.level
        FROM test_procedure_templates tpt
        JOIN asset_type_template_links attl ON attl.test_procedure_template_id = tpt.id
        WHERE attl.asset_type_id = $1 AND tpt.project_id = $2
        """,
        uuid.UUID(asset_type_id),
        uuid.UUID(project_id),
    )

    created: list[dict[str, Any]] = []
    for tmpl in templates:
        existing = await conn.fetchrow(
            "SELECT id FROM test_procedure_instances WHERE asset_id = $1 AND template_id = $2",
            uuid.UUID(asset_id),
            tmpl["id"],
        )
        if existing is not None:
            continue

        row = await conn.fetchrow(
            f"""
            INSERT INTO test_procedure_instances
                (id, project_id, template_id, asset_id, system_id, level, status)
            VALUES (gen_random_uuid(), $1, $2, $3, NULL, $4, 'pending')
            RETURNING {_INSTANCE_COLUMNS}
            """,
            uuid.UUID(project_id),
            tmpl["id"],
            uuid.UUID(asset_id),
            tmpl["level"],
        )
        created.append(dict(row))

    return created


async def create_instance(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    template_id: str,
    asset_id: str | None = None,
    system_id: str | None = None,
    level: str | None = None,
) -> dict[str, Any]:
    if asset_id is None and system_id is None:
        raise HTTPException(
            status_code=422, detail="Exactly one of asset_id or system_id must be set"
        )
    if asset_id is not None and system_id is not None:
        raise HTTPException(
            status_code=422, detail="Exactly one of asset_id or system_id must be set"
        )

    template = await conn.fetchrow(
        "SELECT id, level FROM test_procedure_templates WHERE id = $1 AND project_id = $2",
        uuid.UUID(template_id),
        uuid.UUID(project_id),
    )
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    instance_level = level if level is not None else template["level"]

    row = await conn.fetchrow(
        f"""
        INSERT INTO test_procedure_instances
            (id, project_id, template_id, asset_id, system_id, level, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending')
        RETURNING {_INSTANCE_COLUMNS}
        """,
        uuid.UUID(project_id),
        uuid.UUID(template_id),
        uuid.UUID(asset_id) if asset_id else None,
        uuid.UUID(system_id) if system_id else None,
        instance_level,
    )
    return dict(row)


async def get_instance(
    conn: asyncpg.Connection,
    *,
    instance_id: str,
    project_id: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        f"SELECT {_INSTANCE_COLUMNS} FROM test_procedure_instances WHERE id = $1 AND project_id = $2",
        uuid.UUID(instance_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Instance not found")
    return dict(row)


async def list_instances(
    conn: asyncpg.Connection,
    *,
    project_id: str,
    asset_id: str | None = None,
    system_id: str | None = None,
    level: str | None = None,
    status: str | None = None,
    template_id: str | None = None,
) -> list[dict[str, Any]]:
    conditions = ["project_id = $1"]
    params: list[Any] = [uuid.UUID(project_id)]
    idx = 2

    if asset_id is not None:
        conditions.append(f"asset_id = ${idx}")
        params.append(uuid.UUID(asset_id))
        idx += 1

    if system_id is not None:
        conditions.append(f"system_id = ${idx}")
        params.append(uuid.UUID(system_id))
        idx += 1

    if level is not None:
        conditions.append(f"level = ${idx}")
        params.append(level)
        idx += 1

    if status is not None:
        conditions.append(f"status = ${idx}")
        params.append(status)
        idx += 1

    if template_id is not None:
        conditions.append(f"template_id = ${idx}")
        params.append(uuid.UUID(template_id))
        idx += 1

    where = " AND ".join(conditions)
    rows = await conn.fetch(
        f"SELECT {_INSTANCE_COLUMNS} FROM test_procedure_instances WHERE {where} ORDER BY created_at",
        *params,
    )
    return [dict(r) for r in rows]


async def update_instance_status(
    conn: asyncpg.Connection,
    *,
    instance_id: str,
    project_id: str,
    status: str,
) -> dict[str, Any]:
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of {sorted(VALID_STATUSES)}",
        )

    existing = await conn.fetchrow(
        f"SELECT {_INSTANCE_COLUMNS} FROM test_procedure_instances WHERE id = $1 AND project_id = $2",
        uuid.UUID(instance_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Instance not found")

    row = await conn.fetchrow(
        f"""
        UPDATE test_procedure_instances
        SET status = $1
        WHERE id = $2 AND project_id = $3
        RETURNING {_INSTANCE_COLUMNS}
        """,
        status,
        uuid.UUID(instance_id),
        uuid.UUID(project_id),
    )
    return dict(row)


async def delete_instance(
    conn: asyncpg.Connection,
    *,
    instance_id: str,
    project_id: str,
) -> None:
    existing = await conn.fetchrow(
        "SELECT id FROM test_procedure_instances WHERE id = $1 AND project_id = $2",
        uuid.UUID(instance_id),
        uuid.UUID(project_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Instance not found")

    await conn.execute(
        "DELETE FROM test_procedure_instances WHERE id = $1 AND project_id = $2",
        uuid.UUID(instance_id),
        uuid.UUID(project_id),
    )
