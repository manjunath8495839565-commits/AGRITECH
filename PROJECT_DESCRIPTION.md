# AgriN Connect v2 — Distributed Agricultural Intelligence Platform

## 1. Executive Summary
AgriN Connect v2 is an enterprise-grade, distributed agro-climatic intelligence platform engineered to bridge the digital divide for smallholder farmers, regional cooperatives, and agricultural research institutions worldwide. By unifying real-time Earth observation satellite data, hyper-localized microclimate weather forecasting, multimodal foliar computer vision pathology, ISRIC soil composition profiling, and zero-trust cryptographic data exchange, AgriN Connect provides farmers and agronomists with deterministic, evidence-backed decision support directly from the field.

---

## 2. Problem Statement & Mission
Smallholder agriculture globally is vulnerable to three compounding challenges:
- **Diagnostic Latency**: Foliar fungal and bacterial diseases are detected late, causing up to 40% preventable crop losses.
- **Microclimate Volatility**: Macro-scale regional weather models fail to predict high-humidity spore germination windows.
- **Data Asymmetry & Fragmentation**: Smallholders lack access to soil physical-chemical profiles and transparent market rates.

AgriN Connect resolves these challenges through a lightweight, privacy-conscious, edge-compatible web platform that runs on standard mobile and desktop browsers with zero app-store friction.

---

## 3. High-Level System Architecture

```text
[ Smallholder Camera / Field Sensor ]
               │
               ▼
[ Client-Side Laplacian Blur Quality Gate ] ── (Fails) ──► [ Instant Retake Advisory ]
               │ (Passes)
               ▼
   [ FastAPI Async ASGI Gateway ]
   ├──► [ Vision Transformer (ViT) Foliar Classifier ]
   ├──► [ Multimodal Vision-LLM Pathologist ]
   ├──► [ Open-Meteo Microclimate Engine (Temp / RH / Spore Risk) ]
   ├──► [ ISRIC SoilGrids Ingestion (pH / CEC / Texture) ]
   ├──► [ Element84 Sentinel-2 L2A STAC (NDVI Series) ]
   └──► [ HMAC-SHA256 Interoperability Mesh Protocol ]
               │
               ▼
[ Responsive High-Density Web Workspace (React + Canvas 3D) ]
```

---

## 4. Core Functional Modules

### 4.1. Multimodal Foliar Pathology & Clinical Prescription Pipeline
- **Quality Gatekeeper**: Pre-inference OpenCV Laplacian variance gate intercepts blurred, underexposed, or occluded captures before dispatching neural inference requests.
- **ViT Feature Extraction**: Evaluates lesion morphology, yellow halos, chlorosis, and necrosis patterns against cataloged crop disease taxonomies.
- **Microclimate Correlation**: Fuses image analysis with live Open-Meteo relative humidity and ambient temperature to assess active spore germination pressure.
- **Dual-Tier Interventions**:
  - *Tier 1 (Organic & Bio-Control)*: Recommends botanical extracts (e.g. 1500 ppm neem oil formulations, copper hydroxide protectants, Trichoderma bio-antagonists).
  - *Tier 2 (Targeted Chemical Controls)*: Prescribes calibrated active ingredients with explicit Personal Protective Equipment (PPE) instructions and mandatory pre-harvest intervals (PHI).

### 4.2. Satellite Earth Observation & Interactive 3D Canopy Simulation
- **Sentinel-2 L2A STAC Integration**: Queries cloud-optimized GeoTIFFs via Element84 Earth Search with rigorous filtering (cloud coverage < 30%).
- **60-Day NDVI Historical Curve**: Computes Normalized Difference Vegetation Index:
  $$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
- **Canvas-Based 3D Field Engine**: Real-time canvas simulation rendering dynamic daylight angles, precipitation particles, and crop canopy stress response based on live telemetry.

### 4.3. Hyper-Local Agro-Ecological Telemetry
- **Batched Open-Meteo Fetching**: Concurrent non-blocking requests retrieve surface temperature, 2m relative humidity, 10m wind speed, and precipitation forecasts.
- **Spore Germination Risk Heuristic**: Integrates leaf wetness duration proxies and sustained humidity thresholds (RH > 85% at 18°C–28°C) to quantify disease spread probability.
- **ISRIC SoilGrids Profiling**: Pulls standardized depth profiles (0–5cm, 5–15cm) for pH (H2O), cation exchange capacity (CEC), soil organic carbon (SOC), and soil texture (sand, silt, clay fractions) to classify soil according to USDA texture classes.

### 4.4. Cryptographic Multi-Node Interoperability Mesh
- **HMAC-SHA256 Packet Verification**: Inter-node telemetry transfers (India Node Alpha, Kenya Node Beta, Nigeria Node Gamma) are encapsulated in cryptographically signed packet envelopes.
- **Tamper Rejection Engine**: Automatically detects payload alteration, invalid digital signatures, and replayed packets.
- **3D Celestial Telemetry Mesh**: An interactive rotating 3D spherical mesh on the command dashboard projecting active geographic nodes, packet relays, and real-time connectivity health.

### 4.5. Multi-Country Smallholder Onboarding & Dynamic Dossier
- **Six Primary Agricultural Regions**: Comprehensive localization for India, Brazil, Russia, China, South Africa, and Ethiopia.
- **Dual-Unit Converter**: Real-time bidirectional area translation between metric hectares (ha) and imperial acres (ac).
- **Client-Side Session Persistence**: Secure local caching of active farmer profiles with zero-latency switching and catalog autocompletion.

### 4.7. AI Crop Suitability & Optimization Engine (Local Ollama)
- **Deterministic Agro-Ecological Compatibility**: Evaluates user-chosen crops (Rice, Soybean, Maize, etc.) against live ISRIC SoilGrids pH, nitrogen, and SOC, fused with Open-Meteo ambient temperature, humidity, and rainfall.
- **Local Neural Synthesis (Ollama)**: Employs local `qwen2.5:0.5b` inference to generate deep agronomic reports comparing candidate crops, quantifying water needs (e.g. Rice ~1200mm vs Soybean ~450mm), and prescribing soil management plans.
- **Interactive Farmer Workspace Card**: Radial match gauge, condition matrix, comparative alternative cards, instant what-if simulations, and one-click farm profile updating.

---

## 5. Primary REST API Surface

| Endpoint | Method | Functionality |
|---|---|---|
| `/api/health` | `GET` | Health status and operational readiness of upstream telemetry providers. |
| `/api/weather/current` | `GET` | Real-time Open-Meteo weather telemetry for specified coordinates. |
| `/api/weather/forecast` | `GET` | Multi-day horizon weather projection and precipitation likelihood. |
| `/api/soil/report` | `GET` | Multi-depth physical-chemical soil profile from ISRIC SoilGrids. |
| `/api/satellite/ndvi` | `GET` | Sentinel-2 L2A STAC satellite NDVI time-series history. |
| `/api/farms/adhoc` | `POST` | Validated smallholder farm registration with coordinate assignment. |
| `/api/plant-scan` | `POST` | Laplacian blur gate, ViT inference, and clinical treatment prescription. |
| `/api/interop/send` | `POST` | Verifies and ingests HMAC-SHA256 cryptographically signed mesh packets. |
| `/api/advisory/ask` | `POST` | Context-aware agronomic advisory response engine. |
| `/api/advisory/crop-suitability` | `POST` | AI crop suitability evaluation and alternative optimization via local Ollama. |

---

## 6. Complete Technology Stack

### Frontend Architecture
- **Framework**: React 18 SPA bundled via Vite 6.
- **State Management**: Zustand lightweight reactive stores.
- **Design System**: Human-crafted micro-tokens, dark/light theme engine, zero-dependency SVG vector icon library.
- **Visualization**: HTML5 Canvas 2D/3D projections, CSS 3D spherical transforms.

### Backend & AI Infrastructure
- **Server Framework**: Python 3.13, FastAPI (Async ASGI), Uvicorn.
- **Data Layer**: SQLAlchemy ORM, SQLite / PostgreSQL compatibility, Pydantic v2 schemas.
- **Computer Vision & Inference**: PyTorch, Torchvision, ONNX Runtime, OpenCV Laplacian variance.
- **Testing & Verification**: Pytest, Asyncio test runner, Respx external HTTP mocking.

---

## 7. Data Provenance & Trust Chain
All observational data rendered within AgriN Connect is accompanied by cryptographic hash verification and source attribution:
- **Satellite Data**: European Space Agency (ESA) Sentinel-2 L2A via Element84 STAC.
- **Weather Telemetry**: Open-Meteo High-Resolution Numerical Weather Prediction APIs.
- **Soil Composition**: International Soil Reference and Information Centre (ISRIC) SoilGrids 250m v2.0.
- **Commodity Pricing**: Open Exchange Rates & FAO/USDA agricultural reference indices.

---

## 8. Strategic Value & Impact
AgriN Connect equips agricultural field workers, smallholder farming families, and regional extension officers with actionable, verified, and accessible agronomic tools to optimize fertilizer inputs, protect soil biomes, prevent crop losses, and strengthen global food security across changing climate frontiers.

---

## 9. Quickstart & Operational Workflow

### Local Development Setup
1. **Backend Environment**:
   ```bash
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn backend.app.main:app --reload --port 8000
   ```
2. **Frontend Environment**:
   ```bash
   cd frontend
   npm install
   npm run dev  # Dev server starts on http://localhost:5173
   ```
3. **Automated Verification**:
   ```bash
   pytest backend/tests/unit/
   npm run build
   ```

---

## 10. Future Architectural Roadmap
- **Offline Edge Inference**: WebAssembly (WASM) / ONNX Runtime Web execution for zero-connectivity foliar disease diagnosis.
- **LoRaWAN Gateway Integration**: Direct edge sensor ingestion for low-power soil moisture and leaf wetness probes.
- **Decentralized Agronomic Identity**: Verifiable Credentials (W3C VC) for smallholder organic practice certification and carbon credit verification.
