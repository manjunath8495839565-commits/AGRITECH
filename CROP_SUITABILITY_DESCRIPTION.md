# AI Crop Suitability & Optimization Engine (Local Ollama)

## 1. Overview
The **AI Crop Suitability & Optimization Engine** in AgriN Connect v2 empowers smallholder farmers to evaluate whether their chosen crop (e.g., Rice, Soybean, Maize, Wheat, Cotton) is agro-ecologically optimal for their specific land parcel, or if an alternative crop would deliver superior yield, lower irrigation overhead, or greater climate resilience.

Positioned in the **Farmer Workspace** directly below the 5 Action Tabs (Plant Scan, Weather, Soil Health, Market Prices, Satellite NDVI), the engine leverages a **local, offline-capable Ollama neural engine** (`qwen2.5:0.5b` / `llama3.2`) fused with live ISRIC SoilGrids chemistry and Open-Meteo microclimate telemetry.

---

## 2. Quantitative Suitability Scoring Algorithm
Compatibility is calculated dynamically (0–100%) across three core agronomic dimensions:

1. **Soil Edaphic Alignment (40% Weight)**:
   - Evaluates topsoil pH (0–5 cm depth) against the species-specific optimal bracket cataloged in `data/crops/crops_db.json` (e.g., Rice: 5.5–6.5, Soybean: 6.0–7.0, Maize: 5.8–7.0).
   - Penalizes deviations linearly to reflect nutrient lock-up or aluminum toxicity risks.
2. **Thermal & Microclimate Compatibility (40% Weight)**:
   - Compares live 2m ambient temperature with crop-specific thermal windows (e.g., Rice: 20–35°C, Soybean: 20–30°C).
   - Flags thermal stress or chilling injury risks.
3. **Agro-Ecological & Historical Provenance (20% Weight)**:
   - Cross-checks regional farming records for the target province/state (e.g., Karnataka, India; Mato Grosso, Brazil).

### Classification Thresholds:
- **Optimal Choice (≥ 88%)**: Outstanding microclimate and edaphic synergy.
- **Strong Match (76–87%)**: Highly viable with standard nutrient and irrigation management.
- **Moderate Fit (65–75%)**: Sub-optimal parameters; viable alternatives exist.
- **Sub-optimal Choice (< 65%)**: High climatic or edaphic stress risk.

---

## 3. Local Neural LLM Pipeline (Ollama)
Unlike rigid rule engines or cloud-dependent APIs, AgriN Connect routes agronomic synthesis to a local **Ollama** daemon running on `localhost:11434`:
- **Active Model**: `qwen2.5:0.5b` (with auto-fallback to `llama3.2:latest` or rule-based heuristics).
- **Inference Latency**: 2.0–4.0 seconds on Apple Silicon Metal GPU.
- **Report Structure**:
  1. *Suitability Verdict & Rating*: Clear verdict and score explanation.
  2. *Soil & Microclimate Alignment*: Detailed root physiology impact based on live soil pH, nitrogen, and SOC.
  3. *Comparative Advantage Matrix*: In-depth comparison with alternative crops (e.g., Rice water need `~1200mm` vs. Soybean `~450mm`, biological nitrogen fixation benefits, and market margins).
  4. *Strategic Management Plan*: 3 actionable agronomic interventions (soil conditioning, irrigation scheduling, split-fertilizer application).

---

## 4. Farmer Workspace Interactive UI
The `CropSuitabilityCard` provides a high-density, glassmorphism interface:
- **Radial Score Dial & Verdict Banner**: Instant visual clarity on crop compatibility.
- **Live Diagnostics Matrix**:
  - *Soil pH Chemistry*: Current reading vs target bracket with status badge.
  - *Microclimate Temperature*: Current reading vs optimal thermal window.
  - *Soil Fertility*: Topsoil Nitrogen (g/kg) and Organic Carbon (SOC).
- **Comparative Alternative Chips**:
  - Clickable alternative cards (e.g., Soybean 95%, Maize 95%, Ragi 91%) with water requirements.
  - **What-If Simulation**: Clicking an alternative updates the analysis in real-time.
  - **One-Click Farm Update**: Button to switch the farmer's active profile crop directly from recommendations.
- **Collapsible Ollama Advisory**: Formatted markdown presentation of the neural model's findings.

---

## 5. API Reference
- **Endpoint**: `POST /api/advisory/crop-suitability`
- **Request Payload**:
  ```json
  {
    "crop": "Rice",
    "farmer_name": "Ramesh Patel",
    "region_name": "Karnataka",
    "country": "India",
    "lat": 12.30,
    "lon": 76.65,
    "typical_crops": ["rice", "soybean", "maize"],
    "soil_ph": 6.4,
    "temp_c": 28.0,
    "humidity_pct": 65.0
  }
  ```
- **Response**: Returns compatibility score, level verdict, diagnostic metrics, top 3 alternatives, Ollama model metadata, latency, and full markdown report.

---

## 6. Test Suite & Validation
- **Unit & Integration Suite**: 57 automated tests passing (`pytest backend/tests/unit/`).
- **Production Asset Build**: Verified with Vite (`npm run build` passing in 548ms).
