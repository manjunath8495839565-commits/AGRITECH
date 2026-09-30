"""Satellite API router."""

from fastapi import APIRouter, Query
from app.services import satellite_live as svc

router = APIRouter(tags=["satellite"])


@router.get("/ndvi")
async def ndvi_series(
    lat: float = Query(...),
    lon: float = Query(...),
    days: int = Query(60, ge=7, le=365),
):
    return await svc.get_ndvi_series(lat, lon, days)


@router.get("/thumbnail")
async def latest_thumbnail(
    lat: float = Query(...),
    lon: float = Query(...),
):
    url = await svc.get_latest_thumbnail(lat, lon)
    return {"thumbnail_url": url}
