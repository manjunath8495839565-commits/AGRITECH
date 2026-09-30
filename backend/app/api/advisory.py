"""Farm advisory engine API endpoint."""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field


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


@router.get("/engine-status")
async def get_advisory_engine_status():
    """Return status of local Ollama AI model and fallback knowledge engines."""
    from app.services import ollama_llm
    ollama_info = await ollama_llm.check_ollama_health()
    return {
        "status": "healthy",
        "primary_engine": "ollama" if ollama_info["connected"] else "expert_kb",
        "ollama": ollama_info,
        "hf_fallback_enabled": bool(hf_llm.HF_TOKEN),
        "expert_kb_ready": True,
    }


@router.post("/ask")
async def ask_advisory(req: AskRequest):
    """Ask AgriN AI an unprompted natural language farming or general question."""
    resp = await hf_llm.ask(req.question, req.language)
    if resp.provider.startswith("ollama:"):
        conf = 0.95
        sources = [f"Local Ollama Neural Engine ({resp.provider.split(':', 1)[-1]})", "AgriN Agro-Intelligence"]
    elif resp.provider == "agrin_expert_kb":
        conf = 0.91
        sources = ["AgriN Agronomic Knowledge Engine", "FAO Good Agricultural Practices"]
    else:
        conf = 0.88
        sources = [resp.source_url] if resp.source_url else ["AgriN Cloud AI"]

    return {
        "answer": resp.data,
        "confidence": conf,
        "sources": sources,
        "language": req.language,
        "provider": resp.provider,
        "latency_ms": resp.latency_ms,
    }


class CropSuitabilityRequest(BaseModel):
    crop: str
    farm_id: Optional[str] = "farm_local"
    farmer_name: Optional[str] = "Farmer"
    area_ha: Optional[float] = 2.0
    region_name: str
    country: str
    lat: float
    lon: float
    typical_crops: list[str] = Field(default_factory=list)
    climate: Optional[str] = None
    language: Optional[str] = "en"
    soil_ph: Optional[float] = None
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None


CropSuitabilityRequest.model_rebuild()


@router.post("/crop-suitability")
async def check_crop_suitability(req: CropSuitabilityRequest):
    """Evaluate whether the farmer has chosen the best crop and recommend optimal alternatives via local Ollama."""
    from app.services.crop_suitability import evaluate_crop_suitability
    return await evaluate_crop_suitability(
        crop=req.crop,
        region_name=req.region_name,
        country=req.country,
        lat=req.lat,
        lon=req.lon,
        farmer_name=req.farmer_name,
        area_ha=req.area_ha,
        typical_crops=req.typical_crops,
        climate=req.climate,
        language=req.language or "en",
        soil_ph=req.soil_ph,
        temp_c=req.temp_c,
        humidity_pct=req.humidity_pct,
    )

