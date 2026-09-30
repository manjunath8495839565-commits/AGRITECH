"""Weather API router."""

from fastapi import APIRouter, Query
from app.services import weather as svc

router = APIRouter(tags=["weather"])


@router.get("/current")
async def current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    return await svc.get_current(lat, lon)


@router.get("/forecast")
async def weather_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
    days: int = Query(7, ge=1, le=16),
):
    return await svc.get_forecast(lat, lon, days)
