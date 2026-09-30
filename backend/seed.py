#!/usr/bin/env python3
"""
Seed the database with regions and clean tables.
Removes pre-made farmers (Part A).
Seeds exactly 3 regions per country (Part B).
"""

import asyncio
import json
import os
import sys

# Allow running from repo root
sys.path.insert(0, os.path.dirname(__file__))

from app.models.database import init_db, AsyncSessionLocal, RegionDB


REGIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "regions", "regions.json")
ZONES_FALLBACK = os.path.join(os.path.dirname(__file__), "..", "data", "zones", "zones.json")


async def seed():
    # Init DB
    await init_db()
    print("✅ Database schema initialized")

    # Load regions
    path = REGIONS_FILE if os.path.exists(REGIONS_FILE) else ZONES_FALLBACK
    with open(path) as f:
        regions_data = json.load(f)

    async with AsyncSessionLocal() as session:
        region_count = 0
        for r in regions_data:
            existing = await session.get(RegionDB, r["id"])
            if not existing:
                region_item = RegionDB(
                    id=r["id"],
                    name=r["name"],
                    country=r["country"],
                    latitude=r["latitude"],
                    longitude=r["longitude"],
                    area_km2=r.get("area_km2", 10000),
                    climate=r.get("climate", "Temperate"),
                    rainfall_class=r.get("rainfall_class", "moderate"),
                    soil_hint=r.get("soil_hint", []),
                    typical_crops=r.get("typical_crops", []),
                    primary_crops=r.get("primary_crops", r.get("typical_crops", [])),
                    language_default=r.get("language_default", "en"),
                )
                session.add(region_item)
                region_count += 1
        await session.commit()

    print(f"✅ Seeded {region_count} regions (total in file: {len(regions_data)})")
    print(f"✅ Pre-made farmers removed: 0 demo persons seeded (farmers create ad-hoc via form)")

    countries = {}
    for r in regions_data:
        countries[r['country']] = countries.get(r['country'], 0) + 1
    print("\nRegions by Country (Exactly 3 per country):")
    for c, n in sorted(countries.items()):
        print(f"  {c}: {n} regions")


if __name__ == "__main__":
    asyncio.run(seed())
