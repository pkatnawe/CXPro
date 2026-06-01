"""
Thin HTTP router for Commissioning Execution context.
Delegates all business logic to templates.py (and future modules).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel

from auth import security, get_current_user
from db import get_db_connection
from contexts.commissioning_execution import templates as templates_mod
from contexts.commissioning_execution import instances as instances_mod

router = APIRouter(prefix="/projects/{project_id}")


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class CreateTemplateRequest(BaseModel):
    name: str
    level: str
    description: str | None = None
    steps: list[Any] | None = None


class UpdateTemplateRequest(BaseModel):
    name: str | None = None
    level: str | None = None
    description: str | None = None
    steps: list[Any] | None = None


class LinkAssetTypeRequest(BaseModel):
    asset_type_id: str


class CreateInstanceRequest(BaseModel):
    template_id: str
    asset_id: str | None = None
    system_id: str | None = None
    level: str | None = None


class UpdateInstanceStatusRequest(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _serialize(row: dict[str, Any]) -> dict[str, Any]:
    return {k: str(v) if hasattr(v, "hex") else v for k, v in row.items()}


# ---------------------------------------------------------------------------
# Template routes
# ---------------------------------------------------------------------------


@router.post("/test-procedure-templates", status_code=201)
async def create_template(
    project_id: str,
    body: CreateTemplateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await templates_mod.create_template(
            conn,
            project_id=project_id,
            name=body.name,
            level=body.level,
            description=body.description,
            steps=body.steps,
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/test-procedure-templates/{template_id}")
async def get_template(
    project_id: str,
    template_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await templates_mod.get_template(
            conn, template_id=template_id, project_id=project_id
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/test-procedure-templates")
async def list_templates(
    project_id: str,
    level: str | None = Query(default=None),
    asset_type_id: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await templates_mod.list_templates(
            conn,
            project_id=project_id,
            level=level,
            asset_type_id=asset_type_id,
        )
        return [_serialize(r) for r in rows]
    finally:
        await conn.close()


@router.patch("/test-procedure-templates/{template_id}")
async def update_template(
    project_id: str,
    template_id: str,
    body: UpdateTemplateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        kwargs: dict[str, Any] = {"template_id": template_id, "project_id": project_id}
        if body.name is not None:
            kwargs["name"] = body.name
        if body.level is not None:
            kwargs["level"] = body.level
        if body.description is not None:
            kwargs["description"] = body.description
        if body.steps is not None:
            kwargs["steps"] = body.steps
        result = await templates_mod.update_template(conn, **kwargs)
        return _serialize(result)
    finally:
        await conn.close()


@router.delete("/test-procedure-templates/{template_id}", status_code=204)
async def delete_template(
    project_id: str,
    template_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await templates_mod.delete_template(
            conn, template_id=template_id, project_id=project_id
        )
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Asset-type link routes
# ---------------------------------------------------------------------------


@router.post("/test-procedure-templates/{template_id}/asset-type-links", status_code=201)
async def link_template_to_asset_type(
    project_id: str,
    template_id: str,
    body: LinkAssetTypeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await templates_mod.link_template_to_asset_type(
            conn,
            template_id=template_id,
            asset_type_id=body.asset_type_id,
            project_id=project_id,
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.delete(
    "/test-procedure-templates/{template_id}/asset-type-links/{asset_type_id}",
    status_code=204,
)
async def unlink_template_from_asset_type(
    project_id: str,
    template_id: str,
    asset_type_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await templates_mod.unlink_template_from_asset_type(
            conn,
            template_id=template_id,
            asset_type_id=asset_type_id,
            project_id=project_id,
        )
    finally:
        await conn.close()


# ---------------------------------------------------------------------------
# Instance routes
# ---------------------------------------------------------------------------


@router.post("/test-procedure-instances", status_code=201)
async def create_instance(
    project_id: str,
    body: CreateInstanceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await instances_mod.create_instance(
            conn,
            project_id=project_id,
            template_id=body.template_id,
            asset_id=body.asset_id,
            system_id=body.system_id,
            level=body.level,
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/test-procedure-instances/{instance_id}")
async def get_instance(
    project_id: str,
    instance_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await instances_mod.get_instance(
            conn, instance_id=instance_id, project_id=project_id
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.get("/test-procedure-instances")
async def list_instances(
    project_id: str,
    asset_id: str | None = Query(default=None),
    system_id: str | None = Query(default=None),
    level: str | None = Query(default=None),
    status: str | None = Query(default=None),
    template_id: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> list[dict[str, Any]]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        rows = await instances_mod.list_instances(
            conn,
            project_id=project_id,
            asset_id=asset_id,
            system_id=system_id,
            level=level,
            status=status,
            template_id=template_id,
        )
        return [_serialize(r) for r in rows]
    finally:
        await conn.close()


@router.patch("/test-procedure-instances/{instance_id}")
async def update_instance_status(
    project_id: str,
    instance_id: str,
    body: UpdateInstanceStatusRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        result = await instances_mod.update_instance_status(
            conn,
            instance_id=instance_id,
            project_id=project_id,
            status=body.status,
        )
        return _serialize(result)
    finally:
        await conn.close()


@router.delete("/test-procedure-instances/{instance_id}", status_code=204)
async def delete_instance(
    project_id: str,
    instance_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    response: Response = None,
) -> None:
    await get_current_user(credentials)
    conn = await get_db_connection()
    try:
        await instances_mod.delete_instance(
            conn, instance_id=instance_id, project_id=project_id
        )
    finally:
        await conn.close()
