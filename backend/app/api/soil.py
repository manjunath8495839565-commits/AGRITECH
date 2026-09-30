"""Soil API router."""

from fastapi import APIRouter, Query
from app.services import soil as svc

router = APIRouter(tags=["soil"])


@router.get("/report")
async def soil_report(
    lat: float = Query(...),
    lon: float = Query(...),
):
    return await svc.get_soil(lat, lon)
