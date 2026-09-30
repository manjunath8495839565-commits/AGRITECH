"""Farm advisory engine API endpoint."""

from __future__ import annotations
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.engines.advisory import (
    irrigation_engine, disease_risk_engine, yield_engine,
    market_engine, narrate_farm_status,
)
from app.services import weather as weather_svc, soil as soil_svc
from app.services import hf_llm

router = APIRouter(tags=["advisory"])


class FarmAnalysisRequest(BaseModel):
    farm_id: str
    lat: float
    lon: float
    crop: str
    area_ha: float
    soil_moisture_pct: float = 50.0
    season_month: int = 6


@router.post("/analyze")
async def analyze_farm(req: FarmAnalysisRequest):
    """Run all deterministic engines for a farm and return full analysis."""
    # Fetch live data
    weather = await weather_svc.get_current(req.lat, req.lon)
    soil = await soil_svc.get_soil(req.lat, req.lon)

    w = weather.data
    # Extract soil properties
    soil_ph = next((p.value / 10 for p in soil.data.properties if p.name == "phh2o" and p.depth == "0-5cm"), 6.5)
    soil_n = next((p.value / 100 for p in soil.data.properties if p.name == "nitrogen" and p.depth == "0-5cm"), 2.0)
    soil_soc = next((p.value / 10 for p in soil.data.properties if p.name == "soc" and p.depth == "0-5cm"), 10.0)

    # Run engines
    irrigation = irrigation_engine(
        soil_moisture_pct=req.soil_moisture_pct,
        crop=req.crop,
        eto_mm_day=max(2.0, w.temperature_2m / 8),
        rain_7d_mm=w.precipitation * 24,
        temp_c=w.temperature_2m,
    )
    risks = disease_risk_engine(
        crop=req.crop,
        temp_c=w.temperature_2m,
        humidity_pct=w.relative_humidity_2m,
        rain_7d_mm=w.precipitation * 24,
        ndvi=0.5,
    )
    yield_est = yield_engine(
        crop=req.crop,
        ndvi=0.5,
        soil_ph=soil_ph,
        rain_season_mm=max(200.0, w.precipitation * 24 * 90),  # floor at 200mm
        temp_avg_c=w.temperature_2m,
        area_ha=req.area_ha,
    )
    market = market_engine(
        crop=req.crop,
        current_price_usd=300,
        season_month=req.season_month,
        yield_est_t_ha=yield_est.attainable_yield_t_ha,
        area_ha=req.area_ha,
    )
    narrative = narrate_farm_status(
        farm_name=req.farm_id,
        crop=req.crop,
        irrigation=irrigation,
        risks=risks,
        yield_est=yield_est,
    )

    return {
        "farm_id": req.farm_id,
        "crop": req.crop,
        "irrigation": irrigation.__dict__,
        "disease_risks": [r.__dict__ for r in risks],
        "yield_estimate": yield_est.__dict__,
        "market_advice": market.__dict__,
        "narrative": narrative,
        "weather_snapshot": {
            "temp_c": w.temperature_2m,
            "humidity_pct": w.relative_humidity_2m,
            "wind_kmh": w.wind_speed_10m,
        },
        "soil_snapshot": {
            "ph": round(soil_ph, 2),
            "nitrogen_g_kg": round(soil_n, 3),
            "soc_g_kg": round(soil_soc, 2),
        },
        "data_sources": [weather.provider, soil.provider],
    }


class AskRequest(BaseModel):
    farm_id: str
    question: str
    language: str = "en"


@router.post("/ask")
async def ask_advisory(req: AskRequest):
    """Ask AgriN AI a farming question."""
    resp = await hf_llm.ask(req.question, req.language)
    conf = 0.92 if resp.provider == "agrin_expert_kb" else (0.85 if not resp.provider.endswith("offline") else 0.0)
    sources = [resp.source_url] if resp.source_url else ["FAO Agronomic Guidelines", "AgriN Knowledge System"]
    return {
        "answer": resp.data,
        "confidence": conf,
        "sources": sources,
        "language": req.language,
        "provider": resp.provider,
    }

