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


@router.get("/batch")
async def weather_batch(
    coords: str = Query(..., description="Format: lat,lon;lat,lon;lat,lon"),
):
    points = []
    for pair in coords.split(";"):
        if "," in pair:
            lat_str, lon_str = pair.split(",", 1)
            points.append((float(lat_str.strip()), float(lon_str.strip())))
    data = await svc.get_batch_current(points)
    return {"batch": data, "provider": "open_meteo", "count": len(data)}

