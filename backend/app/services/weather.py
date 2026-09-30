"""P1 – Weather service using Open-Meteo (no API key required)."""

from __future__ import annotations
from datetime import datetime
from app.services.base import fetch_with_retry, SimpleCache, LiveResponse
from app.schemas.models import WeatherCurrent, WeatherForecastDay

_cache = SimpleCache(ttl_seconds=600)  # 10-min cache

BASE = "https://api.open-meteo.com/v1/forecast"
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"


async def get_current(lat: float, lon: float) -> LiveResponse[WeatherCurrent]:
    key = f"current:{lat:.4f}:{lon:.4f}"
    if cached := _cache.get(key):
        return cached

    url = (
        f"{BASE}?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
    )
    data, ms, src = await fetch_with_retry(url)
    c = data["current"]
    result = LiveResponse[WeatherCurrent](
        data=WeatherCurrent(
            temperature_2m=c.get("temperature_2m", 0),
            relative_humidity_2m=c.get("relative_humidity_2m", 0),
            wind_speed_10m=c.get("wind_speed_10m", 0),
            precipitation=c.get("precipitation", 0),
            weather_code=c.get("weather_code", 0),
        ),
        provider="open_meteo",
        fetched_at=datetime.utcnow(),
        latency_ms=ms,
        cached=False,
        source_url=src,
    )
    _cache.set(key, result)
    return result


async def get_forecast(lat: float, lon: float, days: int = 7) -> LiveResponse[list[WeatherForecastDay]]:
    key = f"forecast:{lat:.4f}:{lon:.4f}:{days}"
    if cached := _cache.get(key):
        return cached

    url = (
        f"{BASE}?latitude={lat}&longitude={lon}"
        f"&forecast_days={days}"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
    )
    data, ms, src = await fetch_with_retry(url)
    daily = data["daily"]
    days_list = [
        WeatherForecastDay(
            date=daily["time"][i],
            temperature_max=daily["temperature_2m_max"][i],
            temperature_min=daily["temperature_2m_min"][i],
            precipitation_sum=daily["precipitation_sum"][i] or 0,
            wind_speed_max=daily["wind_speed_10m_max"][i] or 0,
        )
        for i in range(len(daily["time"]))
    ]
    result = LiveResponse[list[WeatherForecastDay]](
        data=days_list,
        provider="open_meteo",
        fetched_at=datetime.utcnow(),
        latency_ms=ms,
        cached=False,
        source_url=src,
    )
    _cache.set(key, result)
    return result


async def get_batch_current(coords: list[tuple[float, float]]) -> list[dict]:
    """Fetch current weather for multiple coordinates in ONE single batched Open-Meteo call."""
    if not coords:
        return []
    lats = ",".join(f"{lat:.2f}" for lat, _ in coords)
    lons = ",".join(f"{lon:.2f}" for _, lon in coords)
    url = f"{BASE}?latitude={lats}&longitude={lons}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
    data, ms, src = await fetch_with_retry(url)
    items = data if isinstance(data, list) else [data]
    results = []
    for item in items:
        c = item.get("current", {})
        results.append({
            "temperature_2m": c.get("temperature_2m", 0),
            "relative_humidity_2m": c.get("relative_humidity_2m", 0),
            "wind_speed_10m": c.get("wind_speed_10m", 0),
            "precipitation": c.get("precipitation", 0),
            "weather_code": c.get("weather_code", 0),
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
        })
    return results

