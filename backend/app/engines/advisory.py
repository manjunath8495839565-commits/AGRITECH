"""
Step 4 – Deterministic Engines (Section 8.1–8.6)
All engines are pure functions: given inputs → outputs, no side effects.
"""

from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Optional


# ─── 8.1  Irrigation Need Engine ──────────────────────────────
@dataclass
class IrrigationAdvice:
    water_needed_mm: float
    urgency: str        # "none" | "low" | "moderate" | "high" | "critical"
    reason: str
    next_irrigation_days: int


def irrigation_engine(
    *,
    soil_moisture_pct: float,   # 0-100
    crop: str,
    eto_mm_day: float,          # reference evapotranspiration
    rain_7d_mm: float,
    temp_c: float,
) -> IrrigationAdvice:
    """Calculate irrigation need based on crop water demand and soil moisture."""
    # Crop coefficients (Kc) by stage
    KC = {
        "wheat": 1.15, "rice": 1.20, "maize": 1.20, "soybean": 1.15,
        "sugarcane": 1.25, "cotton": 1.15, "groundnut": 1.10,
        "sorghum": 1.05, "millet": 1.00, "cassava": 1.00,
        "potato": 1.15, "tomato": 1.15, "onion": 1.05,
        "coffee": 1.05, "cocoa": 1.05, "tea": 1.05,
        "banana": 1.20, "yam": 1.05,
    }
    kc = KC.get(crop.lower(), 1.0)
    etc_mm_day = eto_mm_day * kc  # crop evapotranspiration
    demand_mm = etc_mm_day * 7 - rain_7d_mm

    if soil_moisture_pct < 20:
        urgency, days = "critical", 0
    elif soil_moisture_pct < 35:
        urgency, days = "high", 1
    elif soil_moisture_pct < 50 and demand_mm > 30:
        urgency, days = "moderate", 2
    elif demand_mm > 20:
        urgency, days = "low", 4
    else:
        urgency, days = "none", 7

    water_needed = max(0.0, demand_mm)
    reason = f"Soil at {soil_moisture_pct:.0f}% moisture; crop demand {etc_mm_day:.1f} mm/day; rain {rain_7d_mm:.0f}mm in 7d"
    return IrrigationAdvice(
        water_needed_mm=round(water_needed, 1),
        urgency=urgency,
        reason=reason,
        next_irrigation_days=days,
    )


# ─── 8.2  Fertilizer Recommendation Engine ─────────────────────
@dataclass
class FertilizerAdvice:
    n_kg_ha: float
    p_kg_ha: float
    k_kg_ha: float
    top_up_n: float
    top_up_p: float
    top_up_k: float
    recommendation: str


def fertilizer_engine(
    *,
    crop: str,
    soil_ph: float,
    soil_nitrogen_g_kg: float,  # g/kg (SoilGrids cg/kg ÷ 100)
    soil_soc_g_kg: float,       # soil organic carbon
    area_ha: float = 1.0,
) -> FertilizerAdvice:
    """Recommend NPK fertilizer based on soil analysis."""
    from data_sources import CROPS_DB
    crop_data = CROPS_DB.get(crop.lower(), {})
    target_n = crop_data.get("n_kg_ha", 100)
    target_p = crop_data.get("p_kg_ha", 50)
    target_k = crop_data.get("k_kg_ha", 60)

    # Current soil N supply estimate (rough)
    current_n = soil_nitrogen_g_kg * 10  # convert to approx kg/ha available
    current_p = 20  # default without P-test
    current_k = 40  # default without K-test

    # pH correction factor
    ph_factor = 1.0
    if soil_ph < 5.5:
        ph_factor = 1.3  # acidic soil reduces nutrient availability
    elif soil_ph > 7.5:
        ph_factor = 1.2  # alkaline

    top_n = max(0.0, (target_n - current_n) * ph_factor)
    top_p = max(0.0, target_p - current_p)
    top_k = max(0.0, target_k - current_k)

    recs = []
    if top_n > 30: recs.append(f"Apply {top_n:.0f} kg/ha N (e.g. urea)")
    if top_p > 10: recs.append(f"Apply {top_p:.0f} kg/ha P₂O₅ (e.g. DAP)")
    if top_k > 10: recs.append(f"Apply {top_k:.0f} kg/ha K₂O (e.g. MOP)")
    if soil_ph < 5.5: recs.append("Lime application recommended (pH low)")
    if soil_soc_g_kg < 10: recs.append("Add compost to improve organic matter")

    return FertilizerAdvice(
        n_kg_ha=target_n, p_kg_ha=target_p, k_kg_ha=target_k,
        top_up_n=round(top_n, 1), top_up_p=round(top_p, 1), top_up_k=round(top_k, 1),
        recommendation="; ".join(recs) if recs else "Soil nutrition adequate for this crop",
    )


# ─── 8.3  Crop Health / Disease Risk Engine ────────────────────
@dataclass
class DiseaseRisk:
    disease: str
    risk_level: str   # "low" | "moderate" | "high" | "very_high"
    risk_score: float # 0-1
    favourable_conditions: list[str]
    action: str


def disease_risk_engine(
    *,
    crop: str,
    temp_c: float,
    humidity_pct: float,
    rain_7d_mm: float,
    ndvi: float,
) -> list[DiseaseRisk]:
    """Identify disease risks based on weather and crop conditions."""
    risks: list[DiseaseRisk] = []
    crop = crop.lower()

    # Generic rules for major diseases
    disease_rules = [
        {
            "disease": "Leaf Rust", "crops": ["wheat", "maize", "sorghum"],
            "temp_range": (15, 25), "humidity_min": 70, "rain_min": 20,
            "action": "Apply triazole fungicide; improve air circulation",
        },
        {
            "disease": "Blast (Pyricularia)", "crops": ["rice"],
            "temp_range": (24, 30), "humidity_min": 90, "rain_min": 30,
            "action": "Apply tricyclazole; drain field periodically",
        },
        {
            "disease": "Downy Mildew", "crops": ["maize", "soybean", "groundnut"],
            "temp_range": (18, 24), "humidity_min": 85, "rain_min": 25,
            "action": "Use metalaxyl seed treatment; avoid overhead irrigation",
        },
        {
            "disease": "Root Rot", "crops": ["cotton", "soybean", "groundnut"],
            "temp_range": (25, 35), "humidity_min": 60, "rain_min": 0,
            "action": "Improve drainage; apply thiram seed treatment",
        },
        {
            "disease": "Anthracnose", "crops": ["cassava", "yam", "cocoa"],
            "temp_range": (20, 30), "humidity_min": 80, "rain_min": 40,
            "action": "Remove infected plant material; apply mancozeb",
        },
        {
            "disease": "Coffee Berry Disease", "crops": ["coffee"],
            "temp_range": (19, 25), "humidity_min": 80, "rain_min": 50,
            "action": "Apply copper fungicide; harvest ripe berries promptly",
        },
    ]

    for rule in disease_rules:
        if crop not in rule["crops"]:
            continue
        t_min, t_max = rule["temp_range"]
        temp_ok = t_min <= temp_c <= t_max
        humid_ok = humidity_pct >= rule["humidity_min"]
        rain_ok = rain_7d_mm >= rule["rain_min"]

        score = 0.0
        conditions = []
        if temp_ok: score += 0.35; conditions.append(f"Temp {temp_c:.1f}°C in disease-favourable range")
        if humid_ok: score += 0.35; conditions.append(f"Humidity {humidity_pct:.0f}% high")
        if rain_ok: score += 0.2; conditions.append(f"Recent rainfall {rain_7d_mm:.0f}mm")
        if ndvi < 0.4: score += 0.1; conditions.append("Vegetation stress detected")

        if score > 0.2:
            if score >= 0.8: level = "very_high"
            elif score >= 0.6: level = "high"
            elif score >= 0.4: level = "moderate"
            else: level = "low"
            risks.append(DiseaseRisk(
                disease=rule["disease"], risk_level=level,
                risk_score=round(score, 2), favourable_conditions=conditions,
                action=rule["action"],
            ))

    return sorted(risks, key=lambda r: -r.risk_score)


# ─── 8.4  Yield Estimation Engine ──────────────────────────────
@dataclass
class YieldEstimate:
    potential_yield_t_ha: float
    attainable_yield_t_ha: float
    limiting_factor: str
    confidence: float


def yield_engine(
    *,
    crop: str,
    ndvi: float,
    soil_ph: float,
    rain_season_mm: float,
    temp_avg_c: float,
    area_ha: float,
) -> YieldEstimate:
    """Estimate crop yield using NDVI + soil + climate factors."""
    # Reference potential yields (t/ha) under optimal conditions
    POTENTIAL = {
        "wheat": 6.0, "rice": 8.0, "maize": 10.0, "soybean": 4.0,
        "sugarcane": 80.0, "cotton": 3.5, "groundnut": 3.5,
        "sorghum": 5.0, "millet": 3.5, "cassava": 25.0,
        "potato": 30.0, "tomato": 50.0, "onion": 25.0,
        "coffee": 2.0, "cocoa": 1.5, "tea": 4.0,
        "banana": 30.0, "yam": 12.0,
    }
    potential = POTENTIAL.get(crop.lower(), 5.0)

    # NDVI factor (0.3 = bare soil, 0.8 = max green)
    ndvi_factor = max(0.1, min(1.0, (ndvi - 0.1) / 0.7))

    # Rainfall factor
    from data_sources import CROPS_DB
    water_req = CROPS_DB.get(crop.lower(), {}).get("water_mm_season", 600)
    rain_factor = min(1.0, rain_season_mm / water_req) if water_req else 1.0

    # pH factor
    opt_ph = CROPS_DB.get(crop.lower(), {}).get("optimal_ph", [6.0, 7.0])
    ph_mid = (opt_ph[0] + opt_ph[1]) / 2
    ph_factor = max(0.5, 1.0 - abs(soil_ph - ph_mid) * 0.15)

    attainable = potential * ndvi_factor * rain_factor * ph_factor

    # Limiting factor
    factors = {"NDVI/vegetation": ndvi_factor, "Rainfall": rain_factor, "Soil pH": ph_factor}
    limiting = min(factors, key=factors.get)

    return YieldEstimate(
        potential_yield_t_ha=round(potential, 1),
        attainable_yield_t_ha=round(attainable, 2),
        limiting_factor=f"{limiting} ({factors[limiting]:.2f} efficiency)",
        confidence=0.7 if ndvi > 0.3 else 0.5,
    )


# ─── 8.5  Market Price Advisory Engine ─────────────────────────
@dataclass
class MarketAdvice:
    sell_now: bool
    reason: str
    expected_price_trend: str  # "rising" | "stable" | "falling"
    suggested_action: str


def market_engine(
    *,
    crop: str,
    current_price_usd: float,
    season_month: int,  # 1-12
    yield_est_t_ha: float,
    area_ha: float,
) -> MarketAdvice:
    """Simple market timing advisory based on seasonal patterns."""
    # Simplified seasonal price patterns
    SEASONALITY = {
        "wheat": {3: 0.95, 4: 0.92, 10: 1.05, 11: 1.08},
        "rice": {10: 0.95, 11: 0.92, 5: 1.08, 6: 1.05},
        "maize": {3: 1.05, 4: 1.08, 10: 0.95, 11: 0.92},
    }
    seasonal = SEASONALITY.get(crop.lower(), {}).get(season_month, 1.0)
    total_value = current_price_usd * yield_est_t_ha * area_ha

    if seasonal < 0.95:
        trend, sell_now = "falling", False
        reason = f"Post-harvest glut period (seasonal factor {seasonal:.2f}). Prices typically 5-8% lower."
        action = "Consider storage for 2-3 months if facilities available"
    elif seasonal > 1.04:
        trend, sell_now = "rising", True
        reason = f"Pre-harvest scarcity period (seasonal factor {seasonal:.2f}). Good prices now."
        action = f"Sell now – estimated revenue USD {total_value:,.0f}"
    else:
        trend, sell_now = "stable", True
        reason = "Price stable. No major seasonal effect expected."
        action = f"Sell when ready – estimated revenue USD {total_value:,.0f}"

    return MarketAdvice(
        sell_now=sell_now, reason=reason,
        expected_price_trend=trend, suggested_action=action,
    )


# ─── 8.6  Narrator + Guardrails ────────────────────────────────
BANNED_PATTERNS = [
    "guaranteed profit", "guarantees profit", "100% effective", "no risk",
    "cure all", "miracle", "illegal pesticide",
]


def narrator_guard(text: str) -> tuple[str, bool]:
    """
    Check LLM output for harmful/misleading claims.
    Returns (cleaned_text, was_modified).
    """
    text_lower = text.lower()
    for pat in BANNED_PATTERNS:
        if pat in text_lower:
            text = text + "\n\n⚠️ Note: Agricultural outcomes vary. Always consult local extension services."
            return text, True
    return text, False


def narrate_farm_status(
    *,
    farm_name: str,
    crop: str,
    irrigation: IrrigationAdvice,
    risks: list[DiseaseRisk],
    yield_est: YieldEstimate,
) -> str:
    """Generate a plain-language farm status narrative."""
    parts = [f"📋 **Farm Status: {farm_name}** | Crop: {crop.title()}"]
    parts.append(f"\n💧 **Irrigation**: {irrigation.urgency.upper()} urgency — {irrigation.reason}. Need {irrigation.water_needed_mm}mm.")

    if risks:
        top = risks[0]
        parts.append(f"\n⚠️ **Disease Risk**: {top.disease} risk is {top.risk_level.replace('_', ' ')}. Action: {top.action}")
    else:
        parts.append("\n✅ **Disease Risk**: No significant risks detected.")

    parts.append(f"\n📈 **Yield Estimate**: {yield_est.attainable_yield_t_ha} t/ha attainable (potential {yield_est.potential_yield_t_ha} t/ha). Limiting factor: {yield_est.limiting_factor}")

    narrative = "\n".join(parts)
    narrative, _ = narrator_guard(narrative)
    return narrative
