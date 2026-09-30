# AgriN Connect v2 — System Status & Patch Report

## 1. Live Data Providers Status Matrix
| Provider | Status | Latency (ms) | Key Present | Mode |
|---|---|---|---|---|
| ✅ open_meteo_forecast | 200 | ~1199ms | True | Live Open-Meteo API |
| ✅ open_meteo_archive | 200 | ~985ms | True | Live Open-Meteo API |
| ✅ open_meteo_flood | 200 | ~4553ms | True | Live Open-Meteo API |
| ✅ open_meteo_geocoding | 200 | ~1383ms | True | Live Open-Meteo API |
| ✅ open_meteo_batch | 200 | ~980ms | True | Single multi-point live batch call |
| ✅ soilgrids | 200 | ~15598ms | True | Live ISRIC SoilGrids v2 |
| ✅ nasa_power | 200 | ~962ms | True | Live NASA POWER API |
| ✅ element84_stac | 200 | ~800ms | True | Live Sentinel-2 STAC |
| ✅ planetary_computer_stac | 200 | ~588ms | True | Live Microsoft PC STAC |
| ✅ fx_rates | 200 | ~76ms | True | Live open.er-api.com |
| 🛡️ hf_vision (plant disease) | Active | ~200ms | Config / Fallback | Local ViT Fallback + HF Router |
| 🛡️ hf_llm (advisory review) | Active | ~150ms | Config / Fallback | Local Deterministic Pathologist (Digits Rejected) |

---

## 2. One-Shot Patch Deliverables

### Part A: Ad-Hoc Farmer Creation & Profile Retention
- **Form Design**: Exactly 4 intuitive inputs:
  1. **Full Name**: Text input with trimming.
  2. **Phone**: Optional, with country-aware validation (India 10 digits starting 6–9 formatted to `+91-XXXXX-XXXXX`).
  3. **Land Area**: Float between 0.1 and 500 ha with an interactive bi-directional toggle switch between **Hectares (ha)** and **Acres (ac)** (1 ha = 2.47105 ac).
  4. **Main Crop**: Autocomplete input searching over **45 crops** (`data/crops/crops_db.json`) with scientific names, categories, and "generic parameters" fallback warning for custom crops.
- **Data Layer**:
  - `POST /api/farms/adhoc` creates farm records tagged with region centroid coordinates without requiring pre-seeded farmer profiles.
  - Zero pre-made farmers seeded in database (`farms` table initialized clean).
  - Profile persisted in `localStorage` under `agrin_farmer_profile` with persistent "✏️ Edit Details" and "👤 Not me (Switch)" controls.

### Part B: 3 Agro-Ecological Regions per Country
- **Country Coverage**: Exactly 6 countries with exactly 3 regions each (18 total):
  - 🇮🇳 **India**: Karnataka, Maharashtra, Punjab (PB) (accepts PJ alias)
  - 🇧🇷 **Brazil**: Mato Grosso, Rio Grande do Sul, Minas Gerais
  - 🇷🇺 **Russia**: Krasnodar, Kursk, Altai
  - 🇨🇳 **China**: Heilongjiang, Guangxi, Anhui
  - 🇿🇦 **South Africa**: Gauteng, Western Cape, KwaZulu-Natal
  - 🇪🇹 **Ethiopia**: Amhara, Sidama, Oromia
- **Live Weather Batching**: Single Open-Meteo call `GET /api/weather/batch?coords=...` fetches temperature, humidity, and wind speed for all 3 regions in a single round-trip.
- **Terminology & Routing**: Renamed all "zone" occurrences to "region" in UI strings, safe alias `/api/zones` $\to$ `/api/regions`.

### Part C: Plant Infection Scan Pipeline (5 Action Cards)
- **Image Input**: Drag-and-drop, camera input (`capture="environment"`), and quick sample specimen loader.
- **Quality Gate**:
  - Maximum 8 MB file size check, magic byte validation (JPEG, PNG, WEBP, HEIC).
  - Blur check using Laplacian variance ($\ge 20.0$).
  - Exposure check: underexposed ($< 32$) and overexposed ($> 232$) rejection with actionable retake guidance.
- **Classifier & Review**:
  - Plant foliar disease classifier with PlantVillage 38-class support.
  - Vision-LLM pathologist review rejecting all digits from text output (verbalized as word equivalents).
  - Deterministic fusion with confidence strictly driven by classifier probability.
- **Two-Tier Treatment Protocol**:
  - 🟢 **Tier 1 (Organic)**: Bio-controls, neem formulations, microbial antagonists.
  - 🟡 **Tier 2 (Chemical)**: Active ingredients, withholding intervals, PPE advisories.
  - 🛡️ **Cultural Management**: Pruning, spacing, irrigation hygiene.
- **Live Microclimate Risk Correlation**:
  - Integrates current Open-Meteo temperature and relative humidity with disease epidemiology models to compute live spore pressure score.
- **Cryptographic Mesh Interop**:
  - Hashes leaf bytes via SHA-256 (`image_hash`).
  - Generates HMAC-SHA256 signed `InteropPacket` dispatched to Node B with sequence tracking and acknowledgement stamp.

---

## 3. Verification Test Results
- **Unit Tests**: `pytest backend/tests/unit` — **41 / 41 passed** (100%)
- **System Verification**: `python3 scripts/verify.py` — **10 / 10 passed** (100%)
- **Patch Verification**: `python3 scripts/verify_patch.py` — **11 / 11 passed** (100%)
- **Frontend Production Build**: `npm run build` — **Built in 511ms** without errors.
