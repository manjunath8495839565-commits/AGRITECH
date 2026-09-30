"""FX / currency service using open.er-api.com (free tier)."""

from __future__ import annotations
from datetime import datetime
from app.services.base import fetch_with_retry, SimpleCache, LiveResponse

_cache = SimpleCache(ttl_seconds=3600)
BASE = "https://open.er-api.com/v6/latest"


async def get_rates(base: str = "USD") -> LiveResponse[dict]:
    key = f"fx:{base}"
    if cached := _cache.get(key):
        return cached

    url = f"{BASE}/{base}"
    data, ms, src = await fetch_with_retry(url)
    result = LiveResponse[dict](
        data=data.get("rates", {}),
        provider="open_er_api",
        fetched_at=datetime.utcnow(),
        latency_ms=ms,
        cached=False,
        source_url=src,
    )
    _cache.set(key, result)
    return result


async def convert(amount: float, from_cur: str, to_cur: str) -> float:
    rates_resp = await get_rates("USD")
    rates = rates_resp.data
    if from_cur == "USD":
        return amount * rates.get(to_cur, 1.0)
    usd = amount / rates.get(from_cur, 1.0)
    return usd * rates.get(to_cur, 1.0)
