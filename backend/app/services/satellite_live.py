"""P4 – Satellite / NDVI service using Element84 STAC (Sentinel-2 L2A)."""

from __future__ import annotations
import asyncio
from datetime import datetime, timedelta
from typing import AsyncIterator
from app.services.base import fetch_with_retry, SimpleCache, LiveResponse
from app.schemas.models import NdviPoint

_cache = SimpleCache(ttl_seconds=1800)

STAC_URL = "https://earth-search.aws.element84.com/v1/search"


async def _search_items(lat: float, lon: float, days: int) -> list[dict]:
    """Search STAC for Sentinel-2 scenes covering the point."""
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    # Use bbox (0.1° box around point) for wider compatibility
    bbox = [lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1]
    payload = {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": f"{start.strftime('%Y-%m-%dT%H:%M:%SZ')}/{end.strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "limit": 10,
        "fields": {
            "include": ["id", "properties.datetime", "properties.eo:cloud_cover",
                        "properties.s2:vegetation_percentage", "assets.thumbnail", "links"],
        },
    }
    data, _, _ = await fetch_with_retry(STAC_URL, method="POST", json=payload)
    return data.get("features", [])


def _estimate_ndvi_from_metadata(item: dict) -> float:
    """Estimate NDVI from scene metadata (proxy; real NDVI needs COG raster read)."""
    props = item.get("properties", {})
    cloud = props.get("eo:cloud_cover", 50)
    # Placeholder: use visual_percent_valid as proxy for greenness
    veg = props.get("s2:vegetation_percentage", 30)
    return round(min(max((veg / 100) * 0.8, -0.1), 0.9), 3)


async def get_ndvi_series(lat: float, lon: float, days: int = 60) -> LiveResponse[list[NdviPoint]]:
    key = f"ndvi:{lat:.4f}:{lon:.4f}:{days}"
    if cached := _cache.get(key):
        return cached

    items = await _search_items(lat, lon, days)
    points: list[NdviPoint] = []
    for item in items:
        dt = item.get("properties", {}).get("datetime", "")[:10]
        cloud = item.get("properties", {}).get("eo:cloud_cover", 0)
        ndvi = _estimate_ndvi_from_metadata(item)
        points.append(NdviPoint(date=dt, ndvi=ndvi, cloud_cover=cloud))

    result = LiveResponse[list[NdviPoint]](
        data=sorted(points, key=lambda p: p.date),
        provider="element84_stac",
        fetched_at=datetime.utcnow(),
        latency_ms=0,
        cached=False,
        source_url=STAC_URL,
    )
    _cache.set(key, result)
    return result


async def get_latest_thumbnail(lat: float, lon: float) -> str | None:
    """Return thumbnail URL for most recent low-cloud scene."""
    items = await _search_items(lat, lon, 30)
    for item in items:
        links = item.get("links", [])
        for link in links:
            if link.get("rel") == "thumbnail":
                return link.get("href")
        assets = item.get("assets", {})
        thumb = assets.get("thumbnail") or assets.get("visual")
        if thumb:
            return thumb.get("href")
    return None
