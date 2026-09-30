"""Crop price service – combines hardcoded market data with FX conversion."""

from __future__ import annotations
from datetime import date
from app.services.base import SimpleCache, LiveResponse
from app.services.fx import convert
from app.schemas.models import CropPrice

_cache = SimpleCache(ttl_seconds=1800)

# Base prices in USD/tonne from USDA/FAO reference (updated periodically)
BASE_PRICES_USD: dict[str, float] = {
    "wheat": 210,
    "rice": 430,
    "maize": 175,
    "soybean": 390,
    "cotton": 1800,
    "sugarcane": 35,
    "potato": 280,
    "tomato": 450,
    "onion": 320,
    "coffee": 4200,
    "cocoa": 7500,
    "groundnut": 1100,
    "sorghum": 190,
    "millet": 220,
    "cassava": 180,
    "banana": 550,
}

CURRENCY_BY_COUNTRY: dict[str, str] = {
    "India": "INR", "Kenya": "KES", "Nigeria": "NGN",
    "Ghana": "GHS", "Tanzania": "TZS", "Brazil": "BRL",
    "Mexico": "MXN", "USA": "USD", "UK": "GBP",
    "Ethiopia": "ETB", "Uganda": "UGX", "Zambia": "ZMW",
}


async def get_prices(
    crop: str,
    country: str = "India",
    market: str = "local",
) -> LiveResponse[CropPrice]:
    key = f"price:{crop}:{country}"
    if cached := _cache.get(key):
        return cached

    crop_lower = crop.lower()
    price_usd = BASE_PRICES_USD.get(crop_lower, 300)
    currency = CURRENCY_BY_COUNTRY.get(country, "USD")
    price_local = await convert(price_usd, "USD", currency)

    cp = CropPrice(
        crop=crop,
        price_usd=round(price_usd, 2),
        price_local=round(price_local, 2),
        currency=currency,
        market=market,
        date=date.today().isoformat(),
    )
    result = LiveResponse[CropPrice](
        data=cp,
        provider="usda_fao_reference",
        fetched_at=__import__("datetime").datetime.utcnow(),
        latency_ms=0,
        cached=False,
        source_url="https://open.er-api.com/v6/latest/USD",
    )
    _cache.set(key, result)
    return result
