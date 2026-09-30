# API Examples – AgriN Connect v2

## Base URLs
- **Backend**: `http://localhost:8000/api`
- **Frontend**: `http://localhost:5173`
- **Docs (Swagger)**: `http://localhost:8000/docs`

---

## Health Check
```bash
curl http://localhost:8000/api/health
```
**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "node": "A",
  "providers": {
    "open_meteo": "live",
    "soilgrids": "live",
    "nasa_power": "live",
    "element84_stac": "live",
    "fx_rates": "live",
    "hf_llm": "config_required"
  }
}
```

---

## Weather – Current Conditions
```bash
curl "http://localhost:8000/api/weather/current?lat=12.97&lon=77.59"
```
**Response:**
```json
{
  "data": {
    "temperature_2m": 27.9,
    "relative_humidity_2m": 84.0,
    "wind_speed_10m": 11.4,
    "precipitation": 0.2,
    "weather_code": 61
  },
  "provider": "open_meteo",
  "latency_ms": 1047,
  "cached": false
}
```

---

## Weather – 7-Day Forecast
```bash
curl "http://localhost:8000/api/weather/forecast?lat=12.97&lon=77.59&days=7"
```

---

## Soil Report (SoilGrids)
```bash
curl "http://localhost:8000/api/soil/report?lat=12.97&lon=77.59"
```
**Response excerpt:**
```json
{
  "data": {
    "latitude": 12.97,
    "longitude": 77.59,
    "properties": [
      {"name": "phh2o", "depth": "0-5cm", "value": 56.0, "unit": "pHx10"},
      {"name": "nitrogen", "depth": "0-5cm", "value": 412.0, "unit": "cg/kg"},
      {"name": "soc",      "depth": "0-5cm", "value": 78.0, "unit": "dg/kg"}
    ]
  },
  "provider": "soilgrids"
}
```

---

## NDVI Time Series (Sentinel-2)
```bash
curl "http://localhost:8000/api/satellite/ndvi?lat=12.97&lon=77.59&days=60"
```

---

## Crop Price (with live FX)
```bash
curl "http://localhost:8000/api/prices/crop?crop=wheat&country=India"
```
**Response:**
```json
{
  "data": {
    "crop": "wheat",
    "price_usd": 210.0,
    "price_local": 20173.33,
    "currency": "INR",
    "market": "local",
    "date": "2026-09-30"
  }
}
```

---

## Farm Analysis (All Engines)
```bash
curl -X POST "http://localhost:8000/api/advisory/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": "F001",
    "lat": 12.97,
    "lon": 77.59,
    "crop": "wheat",
    "area_ha": 4.5,
    "soil_moisture_pct": 45,
    "season_month": 6
  }'
```
**Response:**
```json
{
  "farm_id": "F001",
  "crop": "wheat",
  "irrigation": {
    "water_needed_mm": 25.6,
    "urgency": "low",
    "next_irrigation_days": 4
  },
  "disease_risks": [
    {"disease": "Leaf Rust", "risk_level": "moderate", "risk_score": 0.55}
  ],
  "yield_estimate": {
    "attainable_yield_t_ha": 3.24,
    "potential_yield_t_ha": 6.0,
    "limiting_factor": "NDVI/vegetation (0.57 efficiency)"
  },
  "market_advice": {
    "sell_now": true,
    "expected_price_trend": "stable"
  },
  "data_sources": ["open_meteo", "soilgrids"]
}
```

---

## Interop – Sign & Send Packet (Module A→B)

### Step 1: Get a packet template
```bash
curl "http://localhost:8000/api/interop/new-packet"
```

### Step 2: Sign it
```bash
curl -X POST "http://localhost:8000/api/interop/sign" \
  -H "Content-Type: application/json" \
  -d '<packet-json-from-step-1>'
```

### Step 3: Send signed packet (should be ACCEPTED)
```bash
curl -X POST "http://localhost:8000/api/interop/send" \
  -H "Content-Type: application/json" \
  -d '<packet-with-signature>'
```
**Response:** `{"packet_id": "...", "accepted": true, "reason": "Packet accepted by Node A"}`

### Step 4: Send tampered packet (should be REJECTED)
Replace `signature` with `"tampered-sig"` and re-send.
**Response:** `{"packet_id": "...", "accepted": false, "reason": "Invalid or missing signature"}`
