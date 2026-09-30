# AgriN Connect v2 — Distributed Agricultural Intelligence Platform

> **An enterprise-grade, edge-resilient precision agriculture platform bridging satellite Earth observation, hyper-local microclimate telemetry, foliar computer vision pathology, and local neural agronomic advisory for smallholders and cooperatives worldwide.**

[![Live Prototype](https://img.shields.io/badge/Live_Prototype-HTTPS_Active-success?style=for-the-badge&logo=cloudflare)](https://harvey-slots-autumn-complexity.trycloudflare.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-AGRITECH-181717?style=for-the-badge&logo=github)](https://github.com/manjunath8495839565-commits/AGRITECH)
[![Tests Passing](https://img.shields.io/badge/Unit_Tests-57%2F57_Passing-brightgreen?style=for-the-badge&logo=pytest)](https://github.com/manjunath8495839565-commits/AGRITECH)
[![Python 3.13](https://img.shields.io/badge/Backend-Python_3.13_%7C_FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 18 + Vite 6](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_6-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Local Ollama](https://img.shields.io/badge/Local_AI-Ollama_Qwen2.5-black?style=for-the-badge&logo=ollama)](https://ollama.com)

---

## 🌐 Live Prototype & Evaluation Access

- **Public Live Application**: [https://harvey-slots-autumn-complexity.trycloudflare.com](https://harvey-slots-autumn-complexity.trycloudflare.com)
- **Direct Farmer Workspace**: [https://harvey-slots-autumn-complexity.trycloudflare.com/farmer](https://harvey-slots-autumn-complexity.trycloudflare.com/farmer)
- **Interactive 3D Field Scene**: [https://harvey-slots-autumn-complexity.trycloudflare.com/field](https://harvey-slots-autumn-complexity.trycloudflare.com/field)
- **Agronomic AI Advisory**: [https://harvey-slots-autumn-complexity.trycloudflare.com/advisory](https://harvey-slots-autumn-complexity.trycloudflare.com/advisory)
- **Repository**: [https://github.com/manjunath8495839565-commits/AGRITECH](https://github.com/manjunath8495839565-commits/AGRITECH)

---

## 📌 Executive Summary & Problem Statement

Smallholder agriculture represents over **80% of farmland in developing economies**, yet farmers routinely face three compounding failure modes:
1. **Sub-Optimal Crop Selection**: Planting traditional or trending crops that are physiologically mismatched with soil chemical properties (pH, organic carbon) or microclimate heat windows, resulting in up to 35% depressed yields.
2. **Diagnostic Latency & Chemical Over-Application**: Detecting foliar pests and fungal pathogens too late, or applying blanket synthetic fungicides without considering spore humidity thresholds.
3. **Data Fragmentation & Connectivity Blackouts**: Inability to synthesize disparate satellite, soil chemistry, and weather telemetry without expensive enterprise software.

**AgriN Connect v2** resolves this through a unified, mobile-optimized agricultural command center. It couples **offline-first local neural inference (Ollama)** with real-time Earth observation and cryptographic data verification to provide farmers with deterministic, evidence-backed decision support.

---

## 🏛️ System Architecture

```text
                                [ Smallholder In-Field Device ]
                                 (Mobile PWA / Web Client)
                                            │
                                            ▼
                        [ Vite 6 Single Page Application (React 18) ]
                        ├── Mobile Bottom Nav & Touch-Optimized Layout
                        ├── Canvas-Based 3D Field Simulation
                        ├── OpenCV Pre-Inference Laplacian Blur Gate
                        └── Dynamic Hectare / Acre Area Converter
                                            │ (HTTPS / Reverse Proxy)
                                            ▼
                        [ FastAPI High-Performance ASGI Engine ]
                                            │
     ┌──────────────────────┬───────────────┴──────────────┬──────────────────────┐
     ▼                      ▼                              ▼                      ▼
[ Local Ollama AI ]   [ Computer Vision ]        [ Live Telemetry Grid ]   [ Interop Mesh ]
• Qwen2.5:0.5b /      • Dynamic Feature-Aware    • Open-Meteo (Weather)    • HMAC-SHA256
  Llama 3.2             Foliar Classifier        • ISRIC SoilGrids         • Tamper Rejection
• Crop Optimization   • Greenness / Necrosis /     (pH, SOC, Nitrogen)     • Node Alpha/Beta/
• Natural Advisory      Contrast Analytics       • Element84 STAC (NDVI)     Gamma Protocol
• Agronomic Synthesis • Dual-Tier Prescriptions  • NASA POWER & FX Rates   • Replay Immunity
```

---

## 🌟 Core Innovations & Functional Modules

### 1. 🌾 AI Crop Suitability & Optimization Engine (Local Ollama)
Integrated directly inside the **Farmer Workspace**, this module determines whether the farmer has selected the most productive crop for their field:
- **Multi-Factor Quantitative Scoring (0–100%)**:
  - *Edaphic Chemistry (40%)*: Compares live topsoil pH (0–5 cm) against optimal agronomic brackets cataloged in `data/crops/crops_db.json` (e.g. Rice: 5.5–6.5, Soybean: 6.0–7.0).
  - *Thermal & Moisture Windows (40%)*: Evaluates live 2m ambient temperature and humidity against thermal stress thresholds.
  - *Regional Provenance (20%)*: Cross-references historical provincial cultivation viability.
- **Local Ollama Neural Synthesis**: Queries local `qwen2.5:0.5b` (running with GPU acceleration on `localhost:11434`) to compose an unprompted scientific report comparing the chosen crop with alternatives (e.g., **Rice vs. Soybean vs. Maize**), quantifying water demands (~1200mm vs ~450mm), and prescribing soil conditioning.
- **Interactive "What-If" Simulation**: Farmers can tap alternative crop chips to simulate compatibility instantly and update their farm profile with a single click.

### 2. 🍃 Foliar Pathology & Dynamic Vision Scan
- **Laplacian Pre-Inference Quality Gate**: Uses OpenCV Laplacian variance ($Var > 120$) to reject blurry or underexposed field captures before neural processing.
- **Dynamic Feature-Aware Classifier**: Analyzes greenness ratio, necrotic lesion density, and edge contrast gradients, moving beyond static scores to deliver realistic, specimen-specific diagnostic confidence.
- **Dual-Tier Clinical Interventions**:
  - *Tier 1 (Organic & Bio-Control)*: Botanical extracts (1500 ppm neem oil), Trichoderma antagonists, and copper hydroxide.
  - *Tier 2 (Targeted Synthetics)*: Calibrated chemical formulations with mandatory Pre-Harvest Intervals (PHI) and PPE instructions.

### 3. 🛰️ Satellite Remote Sensing (Sentinel-2 L2A STAC) & 3D Field Scene
- **Cloud-Optimized Earth Search**: Queries Sentinel-2 L2A STAC collections via Element84 with strict filtering ($\text{cloud} < 30\%$).
- **60-Day NDVI Trendline**: Measures Normalized Difference Vegetation Index:
  $$\text{NDVI} = \frac{\text{B08 (NIR)} - \text{B04 (Red)}}{\text{B08 (NIR)} + \text{B04 (Red)}}$$
- **Canvas-Based 3D Field Engine**: Real-time canvas simulation rendering daylight angles, precipitation particles, and crop canopy stress response based on live telemetry.

### 4. 🌦️ Hyper-Local Agrometeorological & Edaphic Telemetry
- **Batched Open-Meteo Synchronization**: Pulls temperature, relative humidity, wind velocity, and 5-day outlooks.
- **Spore Germination Risk Heuristics**: Flags high-risk fungal windows based on sustained humidity thresholds ($\text{RH} > 85\%$ at 18–28°C).
- **ISRIC SoilGrids Depth Ingestion**: Retrieves chemical and physical parameters (pH, Cation Exchange Capacity, Soil Organic Carbon, Sand/Silt/Clay fractions).

### 5. 🔐 Cryptographic Multi-Node Interoperability Mesh
- **HMAC-SHA256 Packet Signatures**: Exchanges verified telemetry across distributed agricultural hubs (India Node Alpha, Kenya Node Beta, Nigeria Node Gamma).
- **Tamper Detection**: Automatically drops and flags forged packets, altered payloads, and replay attempts.

### 6. 📱 Mobile-First Responsive PWA Architecture
- **Bottom Navigation Bar**: Fixed glassmorphic navigation with native iOS/Android safe area inset support (`env(safe-area-inset-bottom)`).
- **In-Field Camera Capture**: Integrates HTML5 `<input capture="environment" />` for immediate smartphone leaf photo capture.
- **Touch-Optimized Controls**: Horizontal swipeable action tabs, touch sliders, and responsive single-column layouts for small screens.

---

## 📋 Comprehensive Judging Criteria Mapping

| Evaluation Criterion | Implementation Details | Verified Source File |
|---|---|---|
| **Live Upstream Telemetry (≥4 Providers)** | Open-Meteo, ISRIC SoilGrids, NASA POWER, Element84 STAC, open.er-api | [`backend/app/services/`](file:///Users/manjunathy/AGRITECH/backend/app/services/) |
| **Local Neural AI (Offline-First)** | Local Ollama (`qwen2.5:0.5b` / `llama3.2`) with GPU acceleration & fallback | [`backend/app/services/ollama_llm.py`](file:///Users/manjunathy/AGRITECH/backend/app/services/ollama_llm.py) |
| **Crop Suitability & Alternative Optimization** | Quantitative edaphic/thermal scoring + Ollama comparative report | [`backend/app/services/crop_suitability.py`](file:///Users/manjunathy/AGRITECH/backend/app/services/crop_suitability.py) |
| **Multimodal Vision Pathology** | OpenCV Laplacian blur check + dynamic foliar necrosis classification | [`backend/app/services/plant_scan.py`](file:///Users/manjunathy/AGRITECH/backend/app/services/plant_scan.py) |
| **Cryptographic Interoperability** | HMAC-SHA256 packet envelope signing & tamper rejection engine | [`backend/app/api/interop.py`](file:///Users/manjunathy/AGRITECH/backend/app/api/interop.py) |
| **Mobile & Touch UX** | Pinned mobile header, thumb-friendly bottom nav, touch swipe tabs | [`frontend/src/index.css`](file:///Users/manjunathy/AGRITECH/frontend/src/index.css) |
| **Global Localization** | 6 countries (India, Brazil, Russia, China, South Africa, Ethiopia) + dual units (ha/ac) | [`frontend/src/pages/FarmerApp.jsx`](file:///Users/manjunathy/AGRITECH/frontend/src/pages/FarmerApp.jsx) |
| **Automated Test Coverage** | 57 unit & integration tests passing with 100% success rate | [`backend/tests/unit/`](file:///Users/manjunathy/AGRITECH/backend/tests/unit/) |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 18, React Router v6, HTML5 Canvas, Vite 6 |
| **Styling & Design System** | Modern Vanilla CSS, Glassmorphism, HSL color tokens, Inter & Space Grotesk typography |
| **Backend Core** | Python 3.13, FastAPI (ASGI), Pydantic v2, Uvicorn |
| **AI & Neural Inference** | Local Ollama daemon (`qwen2.5:0.5b`, `llama3.2`), Hugging Face fallback |
| **Computer Vision** | OpenCV (cv2), PIL/Pillow, NumPy |
| **Networking & Tunneling** | Cloudflare Secure Tunnel (`cloudflared`), HTTPX Async Client, Certifi SSL |
| **Testing** | Pytest, Pytest-Asyncio, Requests |

---

## 🔌 Primary REST API Surface

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/health` | `GET` | Health status and operational readiness of all upstream providers. |
| `POST /api/advisory/crop-suitability` | `POST` | Evaluates crop compatibility (0–100%) and generates Ollama advisory report. |
| `POST /api/plant-scan` | `POST` | Laplacian blur gate, foliar necrosis classification, and clinical prescription. |
| `POST /api/advisory/ask` | `POST` | Unprompted natural language agronomic Q&A via local Ollama. |
| `GET /api/weather/current` | `GET` | Real-time Open-Meteo microclimate telemetry for given coordinates. |
| `GET /api/weather/forecast` | `GET` | Multi-day daily weather projections and precipitation outlook. |
| `GET /api/soil/report` | `GET` | Multi-depth physical-chemical soil profile from ISRIC SoilGrids. |
| `GET /api/satellite/ndvi` | `GET` | Sentinel-2 L2A STAC 60-day historical vegetation vigor curve. |
| `POST /api/farms/adhoc` | `POST` | Validates and registers smallholder farm with centroid coordinates. |
| `POST /api/interop/send` | `POST` | Verifies and ingests HMAC-SHA256 cryptographically signed mesh packets. |

---

## 🧪 Automated Testing & Verification

The platform maintains a comprehensive test suite covering agronomic calculation logic, AI fallback behaviors, computer vision scoring, and cryptographic signing:

```bash
# Run the complete test suite
pytest backend/tests/unit/
```

**Results**:
```text
============================= test session starts ==============================
backend/tests/unit/test_adhoc_farm_and_regions.py ..                     [  3%]
backend/tests/unit/test_crop_suitability.py .....                        [ 12%]
backend/tests/unit/test_engines.py .....................                 [ 49%]
backend/tests/unit/test_ollama_advisory.py ........                      [ 63%]
backend/tests/unit/test_plant_scan.py .....................              [100%]
======================= 57 passed, 10 warnings in 23.63s =======================
```

---

## ⚡ Quickstart Guide (Run Locally)

### Prerequisites
- Python 3.11+ (Python 3.13 recommended)
- Node.js 18+ and npm
- [Ollama](https://ollama.com) (Optional for AI features, fallback heuristics active if absent)

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/manjunath8495839565-commits/AGRITECH.git
cd AGRITECH

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Launch Local Ollama (Optional for Local Neural AI)
```bash
# Start Ollama service
ollama serve

# Pull lightweight agronomy-capable model
ollama pull qwen2.5:0.5b
```

### 3. Start Application Servers
```bash
# Terminal 1: Start FastAPI Backend (Port 8000)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Vite Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

Open your browser to **`http://localhost:5173`**.

---

## 📁 Repository Directory Structure

```text
AGRITECH/
├── backend/
│   ├── main.py                          # FastAPI ASGI application entrypoint
│   ├── app/
│   │   ├── api/                         # REST routers (advisory, health, weather, soil, scan, interop)
│   │   ├── services/                    # Business logic & upstream provider integrations
│   │   │   ├── crop_suitability.py      # AI Crop suitability scoring & Ollama prompt engine
│   │   │   ├── ollama_llm.py            # Local Ollama client with auto-discovery & fallback
│   │   │   ├── plant_scan.py            # Laplacian blur gate & dynamic foliar classifier
│   │   │   ├── weather.py               # Open-Meteo telemetry integration
│   │   │   ├── soil.py                  # ISRIC SoilGrids ingestion
│   │   │   └── satellite.py             # Sentinel-2 STAC client
│   │   └── schemas/                     # Pydantic data validation models
│   └── tests/unit/                      # 57 automated unit & integration test specs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CropSuitabilityCard.jsx  # AI Crop suitability card with dial, matrix & simulation
│   │   │   └── ui/Icons.jsx             # Handcrafted SVG domain icon library
│   │   ├── pages/                       # Dashboard, FarmerApp, AdvisoryPage, FieldScene, NetworkView
│   │   ├── lib/api.js                   # Typed HTTP API client
│   │   └── index.css                    # Professional responsive design system & mobile styles
│   └── vite.config.js                   # Vite config with proxy & tunneling support
├── data/
│   ├── crops/crops_db.json              # Catalog of 18+ crops with pH, thermal & water specs
│   └── zones/zones.json                 # Global agro-ecological regional profiles
├── ml/
│   └── disease_treatments.json          # Dual-tier organic & chemical prescription database
├── CROP_SUITABILITY_DESCRIPTION.md      # Dedicated crop optimization feature documentation
├── PROJECT_DESCRIPTION.md               # Detailed technical architecture manual
└── README.md                            # Comprehensive project overview & documentation
```

---

## 🤝 Open Source & License
Distributed under the **MIT License**. Built with ❤️ to empower farmers, strengthen regional cooperatives, and protect soil biomes across changing climate frontiers.
