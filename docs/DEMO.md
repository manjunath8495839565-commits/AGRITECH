# AgriN Connect v2 — Live Demonstration Script

Follow this walkthrough to experience the entire AgriN Connect v2 platform.

---

## 1. Prerequisites & Launch

```bash
# Terminal 1: Start dev environment
make dev
```
- Open browser at: **`http://localhost:5173`**
- Backend documentation available at: **`http://localhost:8000/docs`**

---

## 2. Interactive Tour Steps

### Step 1: 3D Globe Dashboard (`/`)
- Observe the **3D Interactive Globe** rotating with 24 geo-located farms across India, Kenya, Nigeria, and Ghana.
- Watch live telemetry cards update with real-time weather and activity logs.
- Click any node marker to jump directly to regional telemetry.

### Step 2: Farmer App Drilldown (`/farmer`)
- Select **Country** (e.g. India) ➔ Select **Agro-Zone** (e.g. Punjab Plain / Karnataka Plateau) ➔ Select **Farmer Profile** (e.g. Rajesh Kumar).
- Inspect the 4 operational tabs:
  1. **Weather**: Real-time Open-Meteo temperature, humidity, rainfall probability, and 5-day forecast.
  2. **Soil**: Live ISRIC SoilGrids measurements (pH, Nitrogen, SOC, clay content) with optimal crop benchmark indicators.
  3. **Satellite**: Live Sentinel-2 NDVI time-series with vegetation health index.
  4. **Advisory & Market**: Deterministic recommendations for irrigation, fertilizer, disease risks, and local market price projections (USD & INR/KES/NGN/GHS).

### Step 3: Network Interoperability & Tamper Proof (`/network`)
- View the active node mesh: **Node A (Cloud Hub)**, **Node B (Regional Edge)**, and **Node C (Field Gateway)**.
- Click **"Send Valid Signed Packet"**: Observe HMAC-SHA256 signature generation, transmission, and instant acknowledgment (`ACK`).
- Click **"Simulate Tamper Attack"**: Observe the cryptographically altered signature getting rejected with HTTP 401 and an alert raised on the monitor.

### Step 4: 3D Field Simulation (`/field`)
- Explore the interactive canvas farm scene.
- Adjust sliders for Soil Moisture, Sunlight, and Rainfall to see dynamic crop health rendering and NDVI response curves.

### Step 5: Ask AgriN Advisory (`/advisory`)
- Ask agronomic questions or select pre-configured prompts (e.g. "What should I spray for leaf rust on wheat?").
- Experience guardrailed AI responses with source attribution.
- Click **"Share via WhatsApp"** to generate a pre-formatted message ready for field workers.

---

## 3. Automated Verification Script

Run the complete 10-point end-to-end verification suite in terminal:

```bash
python3 scripts/verify.py
```
Expected output: **`FINAL: 10/10 checks passed`**.
