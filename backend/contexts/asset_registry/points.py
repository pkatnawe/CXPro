"""
Deep module: Point CRUD as child of Asset.
Public API: create_point, get_point, list_points_for_asset, update_point, delete_point.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any

import asyncpg
from fastapi import HTTPException

_POINT_COLUMNS = (
    "id, asset_id, tag, description, signal_type, range_low, range_high, "
    "engineering_units, last_cal_date, cal_due_date, created_at"
)

_VALID_SIGNAL_TYPES = frozenset(
    {"4-20mA", "0-10V", "RTD", "thermocouple", "discrete", "modbus"}
)


def _validate_signal_type(signal_type: str | None) -> None:
    if signal_type is not None and signal_type not in _VALID_SIGNAL_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"signal_type must be one of {sorted(_VALID_SIGNAL_TYPES)}",
        )


def _validate_range(range_low: float | None, range_high: float | None) -> None:
    if range_low is not None and range_high is not None and range_low > range_high:
        raise HTTPException(
            status_code=422,
            detail="range_low must be <= range_high",
        )


async def _assert_asset_exists(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> None:
    row = await conn.fetchrow(
        "SELECT id FROM assets WHERE id = $1 AND project_id = $2",
        uuid.UUID(asset_id),
        uuid.UUID(project_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Asset not found")


async def create_point(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
    tag: str,
    description: str | None = None,
    signal_type: str | None = None,
    range_low: float | None = None,
    range_high: float | None = None,
    engineering_units: str | None = None,
    last_cal_date: date | None = None,
    cal_due_date: date | None = None,
) -> dict[str, Any]:
    _validate_signal_type(signal_type)
    _validate_range(range_low, range_high)
    await _assert_asset_exists(conn, asset_id=asset_id, project_id=project_id)

    try:
        row = await conn.fetchrow(
            f"""
            INSERT INTO points (
                id, asset_id, tag, description, signal_type,
                range_low, range_high, engineering_units,
                last_cal_date, cal_due_date
            )
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING {_POINT_COLUMNS}
            """,
            uuid.UUID(asset_id),
            tag,
            description,
            signal_type,
            range_low,
            range_high,
            engineering_units,
            last_cal_date,
            cal_due_date,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A point with this tag already exists on the asset",
        )

    return dict(row)


async def get_point(
    conn: asyncpg.Connection,
    *,
    point_id: str,
    asset_id: str,
    project_id: str,
) -> dict[str, Any]:
    await _assert_asset_exists(conn, asset_id=asset_id, project_id=project_id)
    row = await conn.fetchrow(
        f"SELECT {_POINT_COLUMNS} FROM points WHERE id = $1 AND asset_id = $2",
        uuid.UUID(point_id),
        uuid.UUID(asset_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Point not found")
    return dict(row)


async def list_points_for_asset(
    conn: asyncpg.Connection,
    *,
    asset_id: str,
    project_id: str,
) -> list[dict[str, Any]]:
    await _assert_asset_exists(conn, asset_id=asset_id, project_id=project_id)
    rows = await conn.fetch(
        f"SELECT {_POINT_COLUMNS} FROM points WHERE asset_id = $1 ORDER BY tag",
        uuid.UUID(asset_id),
    )
    return [dict(r) for r in rows]


async def update_point(
    conn: asyncpg.Connection,
    *,
    point_id: str,
    asset_id: str,
    project_id: str,
    tag: str | None = None,
    description: str | None = ...,  # type: ignore[assignment]
    signal_type: str | None = None,
    range_low: float | None = ...,  # type: ignore[assignment]
    range_high: float | None = ...,  # type: ignore[assignment]
    engineering_units: str | None = ...,  # type: ignore[assignment]
    last_cal_date: date | None = ...,  # type: ignore[assignment]
    cal_due_date: date | None = ...,  # type: ignore[assignment]
) -> dict[str, Any]:
    await _assert_asset_exists(conn, asset_id=asset_id, project_id=project_id)

    existing = await conn.fetchrow(
        f"SELECT {_POINT_COLUMNS} FROM points WHERE id = $1 AND asset_id = $2",
        uuid.UUID(point_id),
        uuid.UUID(asset_id),
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Point not found")

    new_tag = tag if tag is not None else existing["tag"]
    new_description = existing["description"] if description is ... else description
    new_signal_type = signal_type if signal_type is not None else existing["signal_type"]
    new_range_low = existing["range_low"] if range_low is ... else range_low
    new_range_high = existing["range_high"] if range_high is ... else range_high
    new_engineering_units = (
        existing["engineering_units"] if engineering_units is ... else engineering_units
    )
    new_last_cal_date = existing["last_cal_date"] if last_cal_date is ... else last_cal_date
    new_cal_due_date = existing["cal_due_date"] if cal_due_date is ... else cal_due_date

    _validate_signal_type(new_signal_type)
    _validate_range(new_range_low, new_range_high)

    try:
        row = await conn.fetchrow(
            f"""
            UPDATE points
            SET tag = $1, description = $2, signal_type = $3,
                range_low = $4, range_high = $5, engineering_units = $6,
                last_cal_date = $7, cal_due_date = $8
            WHERE id = $9 AND asset_id = $10
            RETURNING {_POINT_COLUMNS}
            """,
            new_tag,
            new_description,
            new_signal_type,
            new_range_low,
            new_range_high,
            new_engineering_units,
            new_last_cal_date,
            new_cal_due_date,
            uuid.UUID(point_id),
            uuid.UUID(asset_id),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=409,
            detail="A point with this tag already exists on the asset",
        )

    return dict(row)


async def delete_point(
    conn: asyncpg.Connection,
    *,
    point_id: str,
    asset_id: str,
    project_id: str,
) -> None:
    await _assert_asset_exists(conn, asset_id=asset_id, project_id=project_id)
    result = await conn.execute(
        "DELETE FROM points WHERE id = $1 AND asset_id = $2",
        uuid.UUID(point_id),
        uuid.UUID(asset_id),
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Point not found")
