"""Unit tests for Regions and Ad-hoc Farm creation endpoints (Section A & B)."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_get_regions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/regions")
        assert res.status_code == 200
        body = res.json()
        data = body.get("regions", body)
        assert len(data) == 18  # Exactly 6 countries x 3 regions
        countries = set(r["country"] for r in data)
        assert countries == {"India", "Brazil", "Russia", "China", "South Africa", "Ethiopia"}

        # Check India regions
        res_in = await ac.get("/api/regions?country=India")
        body_in = res_in.json()
        data_in = body_in.get("regions", body_in)
        assert len(data_in) == 3
        names = {r["name"] for r in data_in}
        assert names == {"Karnataka", "Maharashtra", "Punjab (PB)"}


@pytest.mark.asyncio
async def test_adhoc_farm_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Invalid phone for India
        bad_phone_payload = {
            "name": "Rajesh Kumar",
            "phone": "12345",  # Invalid
            "area_ha": 3.5,
            "crop": "rice",
            "region_id": "IN-KAR",
        }
        res = await ac.post("/api/farms/adhoc", json=bad_phone_payload)
        assert res.status_code == 422

        # Invalid area (too large > 500)
        bad_area_payload = {
            "name": "Rajesh Kumar",
            "phone": "9876543210",
            "area_ha": 999.0,
            "crop": "rice",
            "region_id": "IN-KAR",
        }
        res = await ac.post("/api/farms/adhoc", json=bad_area_payload)
        assert res.status_code == 422

        # Valid payload with phone formatting
        valid_payload = {
            "name": "Rajesh Kumar",
            "phone": "9876543210",
            "area_ha": 3.5,
            "crop": "rice",
            "region_id": "IN-KAR",
        }
        res = await ac.post("/api/farms/adhoc", json=valid_payload)
        assert res.status_code == 200
        res_json = res.json()
        farm = res_json["farm"]
        assert farm["farmer_name"] == "Rajesh Kumar"
        assert farm["phone"] == "+91-98765-43210"
        assert isinstance(farm["latitude"], float)
        assert isinstance(farm["longitude"], float)
        assert farm["crop"] == "rice"
        assert farm["crop_tag"] == "catalog"



