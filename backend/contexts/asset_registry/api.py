"""
Thin HTTP router for Asset Registry context.
Delegates all business logic to spaces.py (and future modules).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel

from auth import security, get_current_user
from db import get_db_connection
from contexts.asset_registry import spaces as spaces_mod
from contexts.asset_registry import asset_types as asset_types_mod
from contexts.asset_registry import systems as systems_mod
from contexts.asset_registry import assets as assets_mod
from contexts.asset_registry import points as points_mod

router = APIRouter(prefix="/projects/{project_id}")


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class CreateSpaceRequest(BaseModel):
    kind: str
    name: str
    parent_space_id: str | None = None
    ordinal: int | None = None


class UpdateSpaceRequest(BaseModel):
    name: str | None = None
    parent_space_id: str | None = None
    ordinal: int | None = None


class CreateAssetTypeRequest(BaseModel):
    name: str
    description: str | None = None
    expected_attributes: dict[str, Any] | None = None


class UpdateAssetTypeRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    expected_attributes: dict[str, Any] | None = None


class CreateSystemRequest(BaseModel):
    name: str
    description: str | None = None
    parent_system_id: str | None = None


class UpdateSystemRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_system_id: str | None = None


class AddMemberRequest(BaseModel):
    asset_id: str


class CreateAssetRequest(BaseModel):
    asset_type_id: str
    tag: str
    name: str | None = None
    parent_asset_id: str | None = None
    space_id: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    nameplate_data: dict[str, Any] | None = None


class UpdateAssetRequest(BaseModel):
    tag: str | None = None
    name: str | None = None
    parent_asset_id: str | None = None
    space_id: str | None = None
    asset_type_id: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    nameplate_data: dict[str, Any] | None = None


class CreatePointRequest(BaseModel):
    tag: str
    description: str | None = None
    signal_type: str | None = None
    range_low: float | None = None
    range_high: float | None = None
    engineering_units: str | None = None
    last_cal_date: str | None = None
    cal_due_date: str | None = None


class UpdatePointRequest(BaseModel):
    tag: str | None = None
    description: str | None = None
    signal_type: str | None = None
    range_low: float | None = None
    range_high: float | None = None
    engineering_units: str | None = None
    last_cal_date: str | None = None
    cal_due_date: str | None = None


# ---------------------------------------------------------------------------
# Space routes
# ---------------------------------------------------------------------------


@router.post("/spaces", status_code=201)
async def create_space(
    project_id: str,
    body: CreateSpaceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await spaces_mod.create_space(
            conn,
            project_id=project_id,
            kind=body.kind,
            name=body.name,
            parent_space_id=body.parent_space_id,
            ordinal=body.ordinal,
        )
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/spaces/{space_id}")
async def get_space(
    project_id: str,
    space_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await spaces_mod.get_space(conn, space_id=space_id, project_id=project_id)
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/spaces")
async def list_spaces(
    project_id: str,
    parent_space_id: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await spaces_mod.list_spaces(
            conn,
            project_id=project_id,
            parent_space_id=parent_space_id,
        )
        return [{k: str(v) if hasattr(v, "hex") else v for k, v in r.items()} for r in rows]
    finally:
        await conn.close()


@router.patch("/spaces/{space_id}")
async def update_space(
    project_id: str,
    space_id: str,
    body: UpdateSpaceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {"space_id": space_id, "project_id": project_id}
        if body.name is not None:
            kwargs["name"] = body.name
        if body.parent_space_id is not None:
            kwargs["parent_space_id"] = body.parent_space_id
        if body.ordinal is not None:
            kwargs["ordinal"] = body.ordinal
        result = await spaces_mod.update_space(conn, **kwargs)
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.delete("/spaces/{space_id}", status_code=204)
async def delete_space(
    project_id: str,
    space_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await spaces_mod.delete_space(conn, space_id=space_id, project_id=project_id)
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# AssetType routes
# ---------------------------------------------------------------------------


@router.post("/asset-types", status_code=201)
async def create_asset_type(
    project_id: str,
    body: CreateAssetTypeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await asset_types_mod.create_asset_type(
            conn,
            project_id=project_id,
            name=body.name,
            description=body.description,
            expected_attributes=body.expected_attributes,
        )
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/asset-types/{asset_type_id}")
async def get_asset_type(
    project_id: str,
    asset_type_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await asset_types_mod.get_asset_type(
            conn, asset_type_id=asset_type_id, project_id=project_id
        )
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/asset-types")
async def list_asset_types(
    project_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await asset_types_mod.list_asset_types(conn, project_id=project_id)
        return [{k: str(v) if hasattr(v, "hex") else v for k, v in r.items()} for r in rows]
    finally:
        await conn.close()


@router.patch("/asset-types/{asset_type_id}")
async def update_asset_type(
    project_id: str,
    asset_type_id: str,
    body: UpdateAssetTypeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {"asset_type_id": asset_type_id, "project_id": project_id}
        if body.name is not None:
            kwargs["name"] = body.name
        if body.description is not None:
            kwargs["description"] = body.description
        if body.expected_attributes is not None:
            kwargs["expected_attributes"] = body.expected_attributes
        result = await asset_types_mod.update_asset_type(conn, **kwargs)
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.delete("/asset-types/{asset_type_id}", status_code=204)
async def delete_asset_type(
    project_id: str,
    asset_type_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await asset_types_mod.delete_asset_type(
            conn, asset_type_id=asset_type_id, project_id=project_id
        )
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# System routes
# ---------------------------------------------------------------------------


@router.post("/systems", status_code=201)
async def create_system(
    project_id: str,
    body: CreateSystemRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await systems_mod.create_system(
            conn,
            project_id=project_id,
            name=body.name,
            description=body.description,
            parent_system_id=body.parent_system_id,
        )
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/systems/{system_id}")
async def get_system(
    project_id: str,
    system_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await systems_mod.get_system(conn, system_id=system_id, project_id=project_id)
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.get("/systems")
async def list_systems(
    project_id: str,
    parent_system_id: str | None = Query(default=None),
    include_descendants: bool = Query(default=False),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await systems_mod.list_systems(
            conn,
            project_id=project_id,
            parent_system_id=parent_system_id,
            include_descendants=include_descendants,
        )
        return [{k: str(v) if hasattr(v, "hex") else v for k, v in r.items()} for r in rows]
    finally:
        await conn.close()


@router.patch("/systems/{system_id}")
async def update_system(
    project_id: str,
    system_id: str,
    body: UpdateSystemRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {"system_id": system_id, "project_id": project_id}
        if body.name is not None:
            kwargs["name"] = body.name
        if body.description is not None:
            kwargs["description"] = body.description
        if body.parent_system_id is not None:
            kwargs["parent_system_id"] = body.parent_system_id
        result = await systems_mod.update_system(conn, **kwargs)
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.delete("/systems/{system_id}", status_code=204)
async def delete_system(
    project_id: str,
    system_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await systems_mod.delete_system(conn, system_id=system_id, project_id=project_id)
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# System membership routes
# ---------------------------------------------------------------------------


@router.post("/systems/{system_id}/members", status_code=201)
async def add_system_member(
    project_id: str,
    system_id: str,
    body: AddMemberRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await systems_mod.add_asset_to_system(
            conn, system_id=system_id, asset_id=body.asset_id, project_id=project_id
        )
        return {k: str(v) if hasattr(v, "hex") else v for k, v in result.items()}
    finally:
        await conn.close()


@router.delete("/systems/{system_id}/members/{asset_id}", status_code=204)
async def remove_system_member(
    project_id: str,
    system_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await systems_mod.remove_asset_from_system(
            conn, system_id=system_id, asset_id=asset_id, project_id=project_id
        )
    finally:
        await conn.close()


@router.get("/systems/{system_id}/members")
async def list_system_members(
    project_id: str,
    system_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await systems_mod.list_system_members(
            conn, system_id=system_id, project_id=project_id
        )
        return [{k: str(v) if hasattr(v, "hex") else v for k, v in r.items()} for r in rows]
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Asset routes
# ---------------------------------------------------------------------------


def _serialize(row: dict[str, Any]) -> dict[str, Any]:
    return {k: str(v) if hasattr(v, "hex") else v for k, v in row.items()}


@router.post("/assets", status_code=201)
async def create_asset(
    project_id: str,
    body: CreateAssetRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await assets_mod.create_asset(
            conn,
            project_id=project_id,
            asset_type_id=body.asset_type_id,
            tag=body.tag,
            name=body.name,
            parent_asset_id=body.parent_asset_id,
            space_id=body.space_id,
            manufacturer=body.manufacturer,
            model=body.model,
            serial=body.serial,
            nameplate_data=body.nameplate_data,
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/assets/{asset_id}")
async def get_asset(
    project_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await assets_mod.get_asset(conn, asset_id=asset_id, project_id=project_id)
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/assets")
async def list_assets(
    project_id: str,
    status: str | None = Query(default=None),
    space_id: str | None = Query(default=None),
    system_id: str | None = Query(default=None),
    parent_asset_id: str | None = Query(default=None),
    asset_type_id: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await assets_mod.list_assets(
            conn,
            project_id=project_id,
            status=status,
            space_id=space_id,
            system_id=system_id,
            parent_asset_id=parent_asset_id,
            asset_type_id=asset_type_id,
        )
        return [_serialize(r) for r in rows]
    finally:
        await conn.close()


@router.patch("/assets/{asset_id}")
async def update_asset(
    project_id: str,
    asset_id: str,
    body: UpdateAssetRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {"asset_id": asset_id, "project_id": project_id}
        if body.tag is not None:
            kwargs["tag"] = body.tag
        if body.name is not None:
            kwargs["name"] = body.name
        if body.parent_asset_id is not None:
            kwargs["parent_asset_id"] = body.parent_asset_id
        if body.space_id is not None:
            kwargs["space_id"] = body.space_id
        if body.asset_type_id is not None:
            kwargs["asset_type_id"] = body.asset_type_id
        if body.manufacturer is not None:
            kwargs["manufacturer"] = body.manufacturer
        if body.model is not None:
            kwargs["model"] = body.model
        if body.serial is not None:
            kwargs["serial"] = body.serial
        if body.nameplate_data is not None:
            kwargs["nameplate_data"] = body.nameplate_data
        result = await assets_mod.update_asset(conn, **kwargs)
        return _serialize(result)
    finally:
        await conn.close()


@router.post("/assets/{asset_id}/retire", status_code=200)
async def retire_asset(
    project_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await assets_mod.retire_asset(conn, asset_id=asset_id, project_id=project_id)
        return _serialize(result)
    finally:
        await conn.close()


@router.post("/assets/{asset_id}/decommission", status_code=200)
async def decommission_asset(
    project_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await assets_mod.decommission_asset(
            conn, asset_id=asset_id, project_id=project_id
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.delete("/assets/{asset_id}", status_code=204)
async def delete_asset(
    project_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await assets_mod.delete_asset(conn, asset_id=asset_id, project_id=project_id)
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Point routes
# ---------------------------------------------------------------------------


def _parse_date(value: str | None):
    if value is None:
        return None
    from datetime import date as _date
    return _date.fromisoformat(value)


@router.post("/assets/{asset_id}/points", status_code=201)
async def create_point(
    project_id: str,
    asset_id: str,
    body: CreatePointRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await points_mod.create_point(
            conn,
            asset_id=asset_id,
            project_id=project_id,
            tag=body.tag,
            description=body.description,
            signal_type=body.signal_type,
            range_low=body.range_low,
            range_high=body.range_high,
            engineering_units=body.engineering_units,
            last_cal_date=_parse_date(body.last_cal_date),
            cal_due_date=_parse_date(body.cal_due_date),
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/assets/{asset_id}/points/{point_id}")
async def get_point(
    project_id: str,
    asset_id: str,
    point_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await points_mod.get_point(
            conn, point_id=point_id, asset_id=asset_id, project_id=project_id
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/assets/{asset_id}/points")
async def list_points(
    project_id: str,
    asset_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await points_mod.list_points_for_asset(
            conn, asset_id=asset_id, project_id=project_id
        )
        return [_serialize(r) for r in rows]
    finally:
        await conn.close()


@router.patch("/assets/{asset_id}/points/{point_id}")
async def update_point(
    project_id: str,
    asset_id: str,
    point_id: str,
    body: UpdatePointRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {
            "point_id": point_id,
            "asset_id": asset_id,
            "project_id": project_id,
        }
        if body.tag is not None:
            kwargs["tag"] = body.tag
        if body.description is not None:
            kwargs["description"] = body.description
        if body.signal_type is not None:
            kwargs["signal_type"] = body.signal_type
        if body.range_low is not None:
            kwargs["range_low"] = body.range_low
        if body.range_high is not None:
            kwargs["range_high"] = body.range_high
        if body.engineering_units is not None:
            kwargs["engineering_units"] = body.engineering_units
        if body.last_cal_date is not None:
            kwargs["last_cal_date"] = _parse_date(body.last_cal_date)
        if body.cal_due_date is not None:
            kwargs["cal_due_date"] = _parse_date(body.cal_due_date)
        result = await points_mod.update_point(conn, **kwargs)
        return _serialize(result)
    finally:
        await conn.close()


@router.delete("/assets/{asset_id}/points/{point_id}", status_code=204)
async def delete_point(
    project_id: str,
    asset_id: str,
    point_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await points_mod.delete_point(
            conn, point_id=point_id, asset_id=asset_id, project_id=project_id
        )
    finally:
        await conn.close()
