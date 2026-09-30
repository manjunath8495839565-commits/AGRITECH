#!/usr/bin/env python3
"""Step 13 – Final verification: hit every endpoint, run interop test, print summary."""
import ssl, json, urllib.request, urllib.error, certifi, time

SSL_CTX = ssl.create_default_context(cafile=certifi.where())
BASE = "http://localhost:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())

results = []
def chk(name, ok, detail=""):
    icon = "✅" if ok else "❌"
    print(f"{icon} {name:45} {detail}")
    results.append(ok)

# 1. Health
h = get("/health")
chk("Health endpoint", h["status"] == "ok", f"node={h['node']} v{h['version']}")

# 2. Weather
w = get("/weather/current?lat=12.97&lon=77.59")
chk("Weather current (Open-Meteo)", "temperature_2m" in w["data"], f"{w['data']['temperature_2m']:.1f}°C")

# 3. Forecast
fc = get("/weather/forecast?lat=12.97&lon=77.59&days=5")
chk("Weather forecast 5-day", len(fc["data"]) == 5, f"{len(fc['data'])} days")

# 4. Soil
s = get("/soil/report?lat=12.97&lon=77.59")
chk("Soil report (SoilGrids)", len(s["data"]["properties"]) > 0, f"{len(s['data']['properties'])} measurements")

# 5. NDVI
n = get("/satellite/ndvi?lat=12.97&lon=77.59&days=30")
chk("NDVI time series (Element84 STAC)", isinstance(n["data"], list), f"{len(n['data'])} scenes")

# 6. Prices
p = get("/prices/crop?crop=wheat&country=India")
chk("Crop prices (USDA ref + FX)", p["data"]["currency"] == "INR", f"INR {p['data']['price_local']:,.0f}/tonne")

# 7. Advisory analyze
farm_resp = post("/advisory/analyze", {
    "farm_id": "F001", "lat": 12.97, "lon": 77.59,
    "crop": "wheat", "area_ha": 4.5, "soil_moisture_pct": 45, "season_month": 6,
})
chk("Advisory farm analysis", "irrigation" in farm_resp and "disease_risks" in farm_resp,
    f"urgency={farm_resp['irrigation']['urgency']}, risks={len(farm_resp['disease_risks'])}")

# 8. Interop – signed packet accepted
tpl = get("/interop/new-packet")
signed = post("/interop/sign", tpl)
tpl["signature"] = signed["signature"]
ack = post("/interop/send", tpl)
chk("Interop: signed packet accepted", ack["accepted"], ack["reason"])

# 9. Interop – tampered packet rejected
tpl2 = get("/interop/new-packet")
tpl2["signature"] = "tampered-invalid-signature"
ack2 = post("/interop/send", tpl2)
chk("Interop: tampered packet rejected", not ack2["accepted"], ack2["reason"])

# 10. Advisory ask (offline mode)
ask_resp = post("/advisory/ask", {"farm_id": "F001", "question": "How much water does wheat need?", "language": "en"})
chk("Advisory AI ask (offline fallback)", "answer" in ask_resp, f"confidence={ask_resp['confidence']}")

print(f"\n{'─'*60}")
green = sum(results)
print(f"FINAL: {green}/{len(results)} checks passed")
if green == len(results):
    print("🎉 ALL SYSTEMS GO – AgriN Connect v2 is ready!")
else:
    print(f"⚠️  {len(results)-green} checks failed – review above")
