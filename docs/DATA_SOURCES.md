# AgriN Connect v2 — Data Sources & Ingestion Guide

AgriN Connect v2 orchestrates multiple live scientific and public environmental data providers. All external sources are wrapped in a resilient `Live[T]` envelope with automatic fallback, response caching, and provenance tracking.

---

## 1. Summary of Data Providers

| Provider | Purpose | Rate Limit / Tier | Base URL | Fallback Strategy |
|---|---|---|---|---|
| **Open-Meteo Weather** | Hourly & 7-day weather forecast, rainfall, temp, relative humidity | Free non-commercial (10k calls/day) | `https://api.open-meteo.com/v1/forecast` | Cached recent readings |
| **Open-Meteo Flood** | 7-day river discharge & flood risk indicators | Free tier | `https://flood-api.open-meteo.com/v1/flood` | Local historical flood baseline |
| **ISRIC SoilGrids** | Soil pH, Nitrogen, SOC, Sand/Silt/Clay fractions at depths 0-30cm | Open Public REST API | `https://rest.isric.org/soilgrids/v2.0/properties/query` | Regional agro-zone default soil profiles |
| **NASA POWER** | Climatological solar radiation, surface temperature, precipitation | Public API | `https://power.larc.nasa.gov/api/temporal/climatology/point` | Climatological zone averages |
| **Element84 STAC** | Sentinel-2 L2A optical imagery & NDVI calculation | Public AWS STAC API | `https://earth-search.aws.element84.com/v1` | Microsoft Planetary Computer STAC backup |
| **open.er-api.com** | Live Foreign Exchange rates (USD, INR, KES, NGN, GHS) | Free open tier | `https://open.er-api.com/v6/latest/USD` | Hardcoded benchmark FX table |
| **Hugging Face Inference** | Agricultural advisory reasoning & crop pest vision diagnosis | Free token (or simulated offline fallback) | `https://api-inference.huggingface.co/models/` | Deterministic offline advisory engine |

---

## 2. Ingestion & Provenance Envelope

Every external service response is tagged with full provenance metadata:

```json
{
  "provider": "open_meteo",
  "fetched_at": "2026-09-30T12:22:00Z",
  "source_url": "https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59...",
  "status": "LIVE",
  "cached": false,
  "data": { ... }
}
```

This guarantees transparency for farmers, agronomists, and judges.
