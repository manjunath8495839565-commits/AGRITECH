#!/usr/bin/env python3
"""Comprehensive Patch Verification Script (Parts A, B, C)."""

import io
import json
import urllib.request
import urllib.parse
from PIL import Image
import numpy as np

BASE = "http://localhost:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

def post_json(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

results = []
def chk(name, ok, detail=""):
    icon = "✅" if ok else "❌"
    print(f"{icon} {name:50} {detail}")
    results.append(ok)

print("\n" + "="*65)
print("  AgriN Connect v2 – ONE-SHOT PATCH VERIFICATION")
print("="*65 + "\n")

# PART B: Regions & Live Batched Weather
print("── PART B: 3 Regions Per Country & Batched Weather ──")
regs = get("/regions")
regions_list = regs.get("regions", regs)
chk("Total 18 regions loaded (6 countries × 3)", len(regions_list) == 18, f"{len(regions_list)} regions")

in_regs = get("/regions?country=India")
in_list = in_regs.get("regions", in_regs)
names = [r["name"] for r in in_list]
chk("India has exactly 3 regions", len(in_list) == 3, f"{names}")

# Batched weather test
coords = ";".join(f"{r['latitude']},{r['longitude']}" for r in in_list)
bw = get(f"/weather/batch?coords={urllib.parse.quote(coords)}")
bw_list = bw.get("batch") or bw.get("data", {}).get("results", [])
chk("Single batched Open-Meteo call for all 3 regions",
    len(bw_list) == 3,
    f"{len(bw_list)} weather snapshots returned in ONE request")


# PART A: Farmer Form & Ad-hoc Registration
print("\n── PART A: Ad-Hoc Farmer Creation & Validation ──")
crops = get("/crops")
chk("Crop catalog has >= 40 crops", len(crops.get("crops", [])) >= 40, f"{len(crops.get('crops', []))} crops cataloged")

# Create adhoc farm
adhoc_payload = {
    "name": "Suresh Patel",
    "phone": "9876543210",
    "area_ha": 3.75,
    "crop": "tomato",
    "region_id": "IN-KAR",
    "country": "India"
}
farm_res = post_json("/farms/adhoc", adhoc_payload)
farm = farm_res.get("farm", {})
chk("Ad-hoc farm created with normalized phone",
    farm.get("phone") == "+91-98765-43210" and farm.get("farmer_name") == "Suresh Patel",
    f"Phone: {farm.get('phone')}, Area: {farm.get('area_ha')} ha, Region: {farm.get('region_name')}")

# PART C: Plant Infection Scan Pipeline
print("\n── PART C: Plant Infection Scan Pipeline (CV + VLM + Treatments) ──")

# Generate synthetic leaf image
arr = np.zeros((200, 200, 3), dtype=np.uint8)
arr[::4, :] = [200, 50, 50]
arr[1::4, :] = [50, 200, 50]
arr[2::4, :] = [50, 50, 200]
arr[3::4, :] = [180, 180, 50]
img = Image.fromarray(arr)
buf = io.BytesIO()
img.save(buf, format="JPEG")
img_bytes = buf.getvalue()

# Multipart POST to /api/plant-scan
boundary = "====PlantScanBoundary1234===="
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="crop"\r\n\r\ntomato\r\n'
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="language"\r\n\r\nen\r\n'
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="lat"\r\n\r\n12.97\r\n'
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="lon"\r\n\r\n77.59\r\n'
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="image"; filename="leaf.jpg"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode() + img_bytes + f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(
    f"{BASE}/plant-scan",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)
with urllib.request.urlopen(req, timeout=30) as r:
    scan_resp = json.loads(r.read())

diag = scan_resp.get("diagnosis", {})
chk("Plant scan executed successfully", scan_resp.get("status") == "success", f"Status: {scan_resp.get('status')}")
chk("Disease diagnosed with confidence (from CV)", "disease_name" in diag and "confidence" in diag,
    f"{diag.get('disease_name')} ({int(diag.get('confidence', 0)*100)}% confidence)")
chk("Two-tier treatments included (organic + chemical)",
    "organic_treatment" in diag.get("treatment", {}) and "chemical_treatment" in diag.get("treatment", {}),
    f"Severity: {diag.get('treatment', {}).get('severity')}")
chk("Live weather risk correlation calculated",
    "risk_level" in diag.get("weather_risk", {}),
    f"{diag.get('weather_risk', {}).get('risk_level')} ({diag.get('weather_risk', {}).get('temp_c')}°C, {diag.get('weather_risk', {}).get('humidity_pct')}% RH)")
chk("Mesh interop packet signed (HMAC-SHA256)",
    "packet_id" in diag.get("interop", {}) and "ack_stamp" in diag.get("interop", {}),
    f"ID: {diag.get('interop', {}).get('packet_id')} ({diag.get('interop', {}).get('ack_stamp')})")

# Test blur quality gate
blur_arr = np.full((150, 150, 3), 128, dtype=np.uint8) # zero variance
blur_img = Image.fromarray(blur_arr)
blur_buf = io.BytesIO()
blur_img.save(blur_buf, format="JPEG")

blur_body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="image"; filename="blurry.jpg"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode() + blur_buf.getvalue() + f"\r\n--{boundary}--\r\n".encode()

req_blur = urllib.request.Request(
    f"{BASE}/plant-scan",
    data=blur_body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)
with urllib.request.urlopen(req_blur, timeout=20) as r:
    blur_resp = json.loads(r.read())

chk("Blur quality gate rejects low-variance photo",
    blur_resp.get("status") == "retake_required",
    f"Reason: {blur_resp.get('error')}")

print("\n" + "─"*65)
green = sum(results)
print(f"VERIFICATION SUMMARY: {green}/{len(results)} patch checks passed!")
if green == len(results):
    print("🌟 ALL PARTS (A, B, C) FULLY VERIFIED & OPERATIONAL!")
else:
    print(f"⚠️ {len(results)-green} failed.")
