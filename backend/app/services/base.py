"""
Services layer base – Live[T] envelope, HTTP client with retries,
caching, and health probes.
"""

from __future__ import annotations
import time, asyncio, ssl
from typing import TypeVar, Generic, Optional, Callable, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import httpx
import certifi

T = TypeVar("T")

# Shared async HTTP client with SSL + retries
_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


def make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        verify=certifi.where(),
        timeout=httpx.Timeout(20.0),
        follow_redirects=True,
    )


class LiveResponse(BaseModel, Generic[T]):
    data: T
    provider: str
    fetched_at: datetime
    latency_ms: int
    cached: bool
    source_url: str


class SimpleCache:
    def __init__(self, ttl_seconds: int = 300):
        self._store: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            val, expires = self._store[key]
            if time.time() < expires:
                return val
            del self._store[key]
        return None

    def set(self, key: str, value: Any):
        self._store[key] = (value, time.time() + self._ttl)


async def fetch_with_retry(
    url: str,
    *,
    method: str = "GET",
    json: Any = None,
    headers: dict | None = None,
    retries: int = 3,
    backoff: float = 1.0,
) -> tuple[dict | list, int, str]:
    """Fetch JSON with exponential-backoff retries. Returns (data, latency_ms, url)."""
    last_exc: Exception = RuntimeError("no attempts")
    async with make_client() as client:
        for attempt in range(retries):
            try:
                t0 = time.monotonic()
                if method == "POST":
                    resp = await client.post(url, json=json, headers=headers or {})
                else:
                    resp = await client.get(url, headers=headers or {})
                latency = int((time.monotonic() - t0) * 1000)
                resp.raise_for_status()
                return resp.json(), latency, url
            except Exception as exc:
                last_exc = exc
                if attempt < retries - 1:
                    await asyncio.sleep(backoff * (2 ** attempt))
    raise last_exc
