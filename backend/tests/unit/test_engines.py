"""Unit tests for deterministic engines."""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.engines.advisory import (
    irrigation_engine, disease_risk_engine, yield_engine,
    market_engine, narrator_guard, narrate_farm_status,
    IrrigationAdvice, DiseaseRisk,
)


# ─── Irrigation Engine ─────────────────────────────────────────
class TestIrrigationEngine:
    def test_critical_low_moisture(self):
        r = irrigation_engine(soil_moisture_pct=15, crop="wheat", eto_mm_day=5.0, rain_7d_mm=0, temp_c=30)
        assert r.urgency == "critical"
        assert r.next_irrigation_days == 0

    def test_no_irrigation_needed(self):
        r = irrigation_engine(soil_moisture_pct=70, crop="rice", eto_mm_day=3.0, rain_7d_mm=80, temp_c=25)
        assert r.urgency == "none"
        assert r.water_needed_mm == 0.0

    def test_moderate_urgency(self):
        r = irrigation_engine(soil_moisture_pct=42, crop="maize", eto_mm_day=5.0, rain_7d_mm=10, temp_c=28)
        assert r.urgency in ("moderate", "high")
        assert r.water_needed_mm > 0

    def test_unknown_crop_defaults(self):
        r = irrigation_engine(soil_moisture_pct=30, crop="unknown_crop", eto_mm_day=4.0, rain_7d_mm=5, temp_c=25)
        assert r.urgency in ("low", "moderate", "high", "critical")

    def test_high_rain_reduces_need(self):
        r1 = irrigation_engine(soil_moisture_pct=50, crop="wheat", eto_mm_day=5.0, rain_7d_mm=0, temp_c=25)
        r2 = irrigation_engine(soil_moisture_pct=50, crop="wheat", eto_mm_day=5.0, rain_7d_mm=100, temp_c=25)
        assert r2.water_needed_mm < r1.water_needed_mm


# ─── Disease Risk Engine ────────────────────────────────────────
class TestDiseaseRiskEngine:
    def test_leaf_rust_wheat_high_risk(self):
        risks = disease_risk_engine(crop="wheat", temp_c=20, humidity_pct=85, rain_7d_mm=30, ndvi=0.3)
        names = [r.disease for r in risks]
        assert "Leaf Rust" in names

    def test_no_risk_dry_conditions(self):
        risks = disease_risk_engine(crop="wheat", temp_c=35, humidity_pct=30, rain_7d_mm=0, ndvi=0.6)
        assert all(r.risk_level == "low" for r in risks) or len(risks) == 0

    def test_blast_rice_humid(self):
        risks = disease_risk_engine(crop="rice", temp_c=27, humidity_pct=95, rain_7d_mm=50, ndvi=0.5)
        names = [r.disease for r in risks]
        assert "Blast (Pyricularia)" in names

    def test_returns_sorted_by_score(self):
        risks = disease_risk_engine(crop="wheat", temp_c=20, humidity_pct=90, rain_7d_mm=40, ndvi=0.2)
        if len(risks) > 1:
            for i in range(len(risks) - 1):
                assert risks[i].risk_score >= risks[i+1].risk_score

    def test_wrong_crop_no_risk(self):
        risks = disease_risk_engine(crop="banana", temp_c=20, humidity_pct=90, rain_7d_mm=40, ndvi=0.5)
        # Banana is not in any disease rule, so should be empty or low
        assert all(r.risk_level in ("low",) for r in risks) or len(risks) == 0


# ─── Yield Engine ─────────────────────────────────────────────
class TestYieldEngine:
    def test_optimal_conditions_high_yield(self):
        r = yield_engine(crop="wheat", ndvi=0.75, soil_ph=6.5, rain_season_mm=450, temp_avg_c=20, area_ha=1.0)
        assert r.attainable_yield_t_ha > 4.0
        assert r.attainable_yield_t_ha <= r.potential_yield_t_ha

    def test_poor_ndvi_low_yield(self):
        r = yield_engine(crop="wheat", ndvi=0.15, soil_ph=6.0, rain_season_mm=450, temp_avg_c=20, area_ha=1.0)
        assert r.attainable_yield_t_ha < 2.0
        assert r.confidence == 0.5

    def test_drought_stress(self):
        r = yield_engine(crop="maize", ndvi=0.55, soil_ph=6.5, rain_season_mm=100, temp_avg_c=28, area_ha=1.0)
        assert "Rainfall" in r.limiting_factor

    def test_yield_positive(self):
        r = yield_engine(crop="rice", ndvi=0.6, soil_ph=6.0, rain_season_mm=1200, temp_avg_c=28, area_ha=5.0)
        assert r.attainable_yield_t_ha > 0


# ─── Narrator Guardrails ────────────────────────────────────────
class TestNarratorGuard:
    def test_clean_text_unchanged(self):
        text = "Apply 50 kg/ha urea to improve yield."
        result, modified = narrator_guard(text)
        assert not modified
        assert result == text

    def test_detects_guaranteed_profit(self):
        text = "This product guarantees profit for every farmer."
        result, modified = narrator_guard(text)
        assert modified
        assert "⚠️" in result

    def test_detects_miracle(self):
        text = "This is a miracle solution for all crop diseases."
        result, modified = narrator_guard(text)
        assert modified

    def test_detects_no_risk(self):
        text = "There is absolutely no risk with this approach."
        _, modified = narrator_guard(text)
        assert modified

    def test_case_insensitive(self):
        text = "GUARANTEED PROFIT from this crop."
        _, modified = narrator_guard(text)
        assert modified


# ─── Market Engine ─────────────────────────────────────────────
class TestMarketEngine:
    def test_returns_advice(self):
        from app.engines.advisory import market_engine
        r = market_engine(crop="wheat", current_price_usd=210, season_month=4, yield_est_t_ha=5.0, area_ha=3.0)
        assert r.expected_price_trend in ("rising", "stable", "falling")
        assert isinstance(r.sell_now, bool)
        assert len(r.suggested_action) > 0

    def test_post_harvest_glut(self):
        # March/April is post-harvest for wheat – prices should be falling
        from app.engines.advisory import market_engine
        r = market_engine(crop="wheat", current_price_usd=210, season_month=4, yield_est_t_ha=5.0, area_ha=2.0)
        assert r.expected_price_trend == "falling"
        assert r.sell_now is False
