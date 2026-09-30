"""Farms API – handles ad-hoc user farm creation."""

from __future__ import annotations
import json
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db, Farm, RegionDB

router = APIRouter(prefix="/farms", tags=["farms"])

CROPS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "crops", "crops_db.json")
REGIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "regions", "regions.json")


class AdhocFarmRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60, description="Farmer name")
    phone: Optional[str] = Field(None, max_length=25, description="Optional contact number")
    area_ha: float = Field(..., ge=0.1, le=500.0, description="Land area in hectares (0.1–500)")
    crop: str = Field(..., min_length=1, max_length=60, description="Main crop name")
    region_id: str = Field(..., description="Selected region ID e.g. IN-KA, IN-PB")
    country: str = Field("India", description="Selected country")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2 or len(clean) > 60:
            raise ValueError("Name must be between 2 and 60 characters")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str], info) -> Optional[str]:
        if not v or not v.strip():
            return None
        raw = v.strip()
        country = info.data.get("country", "India") if hasattr(info, "data") else "India"
        if country.lower() == "india":
            # Extract digits
            digits = re.sub(r"\D", "", raw)
            if digits.startswith("91") and len(digits) == 12:
                digits = digits[2:]
            elif digits.startswith("0") and len(digits) == 11:
                digits = digits[1:]
            if len(digits) != 10 or not digits[0] in "6789":
                raise ValueError("Indian phone number must be 10 digits starting with 6, 7, 8, or 9")
            return f"+91-{digits[:5]}-{digits[5:]}"
        # Other international phones: at least 7 digits
        digits = re.sub(r"\D", "", raw)
        if len(digits) < 7:
            raise ValueError("Phone number must have at least 7 digits")
        return raw


def _find_region(region_id: str) -> Optional[dict]:
    if os.path.exists(REGIONS_FILE):
        with open(REGIONS_FILE) as f:
            for r in json.load(f):
                if r.get("id", "").upper() == region_id.upper() or region_id.upper() in [a.upper() for a in r.get("aliases", [])]:
                    return r
    return None


def _check_crop(crop_name: str) -> tuple[str, str]:
    """Check if crop is in catalog; return canonical name and tag."""
    c_clean = crop_name.strip().lower()
    if os.path.exists(CROPS_FILE):
        with open(CROPS_FILE) as f:
            catalog = json.load(f).get("crops", [])
            for c in catalog:
                if c["name"].lower() == c_clean:
                    return c["name"], "catalog"
                # Check multilingual translations
                for lang_code, trans in c.get("i18n", {}).items():
                    if trans.lower() == c_clean:
                        return c["name"], "catalog"
    return crop_name.strip(), "generic parameters"


@router.post("/adhoc")
async def create_adhoc_farm(req: AdhocFarmRequest, db: AsyncSession = Depends(get_db)):
    """Create a farm profile ad-hoc from user input."""
    # Find region centroid
    region = _find_region(req.region_id)
    if not region:
        # Fallback coordinates if region is unknown
        lat, lon = 12.97, 77.59
        region_name = req.region_id
    else:
        lat = region["latitude"]
        lon = region["longitude"]
        region_name = region["name"]

    canonical_crop, crop_tag = _check_crop(req.crop)
    farm_id = f"farm_{uuid.uuid4().hex[:8]}"

    # Sensible default planting date (35 days ago in current cycle)
    planting_date = (datetime.utcnow() - timedelta(days=35)).strftime("%Y-%m-%d")

    farm = Farm(
        id=farm_id,
        name=f"{req.name}'s Field",
        farmer_name=req.name,
        phone=req.phone,
        area_ha=round(req.area_ha, 2),
        crop=canonical_crop,
        zone_id=req.region_id,
        country=req.country,
        latitude=lat,
        longitude=lon,
    )
    db.add(farm)
    await db.commit()

    return {
        "status": "success",
        "farm": {
            "id": farm_id,
            "name": farm.name,
            "farmer_name": req.name,
            "phone": req.phone,
            "area_ha": farm.area_ha,
            "crop": canonical_crop,
            "crop_tag": crop_tag,
            "region_id": req.region_id,
            "region_name": region_name,
            "country": req.country,
            "latitude": lat,
            "longitude": lon,
            "planting_date": planting_date,
            "created_at": datetime.utcnow().isoformat(),
        }
    }
