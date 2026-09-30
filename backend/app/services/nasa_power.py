"""P3 – NASA POWER service for solar radiation, precip, temperature."""

from __future__ import annotations
from datetime import datetime, timedelta
from app.services.base import fetch_with_retry, SimpleCache, LiveResponse

_cache = SimpleCache(ttl_seconds=3600)

BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMS = "ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M,RH2M,WS2M,T2M_MAX,T2M_MIN"


async def get_nasa_power(lat: float, lon: float, days_back: int = 30) -> LiveResponse[dict]:
    key = f"nasa:{lat:.4f}:{lon:.4f}:{days_back}"
    if cached := _cache.get(key):
        return cached

    end = datetime.utcnow().date()
    start = end - timedelta(days=days_back)
    url = (
        f"{BASE}?start={start.strftime('%Y%m%d')}&end={end.strftime('%Y%m%d')}"
        f"&latitude={lat}&longitude={lon}&community=AG"
        f"&parameters={PARAMS}&format=JSON"
    )
    data, ms, src = await fetch_with_retry(url)
    param_data = data.get("properties", {}).get("parameter", {})

    result = LiveResponse[dict](
        data=param_data,
        provider="nasa_power",
        fetched_at=datetime.utcnow(),
        latency_ms=ms,
        cached=False,
        source_url=src,
    )
    _cache.set(key, result)
    return result
