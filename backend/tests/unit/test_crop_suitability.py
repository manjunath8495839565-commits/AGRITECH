"""Unit tests for Crop Suitability & Optimization Service."""

import pytest
from app.services.crop_suitability import calculate_suitability, evaluate_crop_suitability, _load_crops_db
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_crops_db_loaded():
    db = _load_crops_db()
    assert len(db) >= 10
    assert "rice" in db
    assert "soybean" in db
    assert "maize" in db


def test_calculate_suitability_optimal_conditions():
    crops_db = _load_crops_db()
    score, level, diag = calculate_suitability(
        crop_name="rice",
        soil_ph=6.0,
        temp_c=26.0,
        humidity_pct=75.0,
        typical_crops=["rice", "sugarcane"],
        crops_db=crops_db,
    )
    assert score >= 88
    assert level == "Optimal Choice"
    assert "Optimal" in diag["ph_status"]
    assert "Optimal" in diag["temp_status"]


def test_calculate_suitability_suboptimal_conditions():
    crops_db = _load_crops_db()
    score, level, diag = calculate_suitability(
        crop_name="rice",
        soil_ph=8.8,  # Highly alkaline
        temp_c=42.0,  # Extreme heat
        humidity_pct=20.0,
        typical_crops=["barley", "dates"],
        crops_db=crops_db,
    )
    assert score < 75
    assert level in ["Sub-optimal Choice", "Moderate Fit"]


@pytest.mark.asyncio
async def test_evaluate_crop_suitability_service():
    res = await evaluate_crop_suitability(
        crop="Soybean",
        region_name="Madhya Pradesh",
        country="India",
        lat=23.25,
        lon=77.41,
        farmer_name="Deepak",
        typical_crops=["soybean", "wheat", "gram"],
        soil_ph=6.8,
        temp_c=27.0,
        humidity_pct=60.0,
    )
    assert res["crop"] == "Soybean"
    assert res["suitability_score"] > 70
    assert len(res["alternative_crops"]) >= 1
    assert "report_markdown" in res
    assert len(res["report_markdown"]) > 50
    assert "metrics" in res


def test_crop_suitability_api_endpoint():
    payload = {
        "crop": "Rice",
        "farmer_name": "Ramesh Patel",
        "region_name": "Karnataka",
        "country": "India",
        "lat": 12.30,
        "lon": 76.65,
        "typical_crops": ["rice", "soybean", "maize"],
        "soil_ph": 6.2,
        "temp_c": 28.5,
        "humidity_pct": 70.0,
    }
    response = client.post("/api/advisory/crop-suitability", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Rice"
    assert "suitability_score" in data
    assert "suitability_level" in data
    assert "report_markdown" in data
    assert "alternative_crops" in data
    assert isinstance(data["alternative_crops"], list)
    assert len(data["alternative_crops"]) > 0
    # Check that alternatives don't include Rice itself
    alt_names = [a["name"].lower() for a in data["alternative_crops"]]
    assert "rice" not in alt_names
