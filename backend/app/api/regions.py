"""Regions and crops discovery API endpoints."""

from __future__ import annotations
import json
import os
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(tags=["regions"])

REGIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "regions", "regions.json")
CROPS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "crops", "crops_db.json")


def _load_regions() -> list[dict]:
    if os.path.exists(REGIONS_FILE):
        with open(REGIONS_FILE) as f:
            return json.load(f)
    return []


def _load_crops() -> list[dict]:
    if os.path.exists(CROPS_FILE):
        with open(CROPS_FILE) as f:
            return json.load(f).get("crops", [])
    return []


@router.get("/regions")
async def list_regions(country: Optional[str] = Query(None)):
    """List exactly 3 regions per country (or filter by country)."""
    regions = _load_regions()
    if country:
        c_lower = country.strip().lower()
        regions = [r for r in regions if r.get("country", "").lower() == c_lower]
    return {"regions": regions, "count": len(regions)}


# Deprecated alias keeping /api/zones working
@router.get("/zones", deprecated=True)
async def list_zones_deprecated(country: Optional[str] = Query(None)):
    """Deprecated: use /api/regions instead."""
    return await list_regions(country=country)


@router.get("/regions/{region_id}")
async def get_region(region_id: str):
    """Get region details by id or alias."""
    rid = region_id.strip().upper()
    for r in _load_regions():
        if r.get("id", "").upper() == rid:
            return r
        for alias in r.get("aliases", []):
            if alias.upper() == rid:
                return r
    raise HTTPException(status_code=404, detail=f"Region '{region_id}' not found")


@router.get("/crops")
async def list_crops(lang: Optional[str] = Query("en")):
    """List all supported crops (>40) with multilingual labels."""
    crops = _load_crops()
    formatted = []
    for c in crops:
        localized_name = c["name"]
        if lang and lang != "en" and "i18n" in c and lang in c["i18n"]:
            localized_name = c["i18n"][lang]
        formatted.append({
            **c,
            "display_name": localized_name,
        })
    return {"crops": formatted, "count": len(formatted)}
