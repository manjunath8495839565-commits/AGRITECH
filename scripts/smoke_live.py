#!/usr/bin/env python3
"""
Step 0 – PREFLIGHT: Hit every provider once, print a status table,
save raw JSON responses to docs/samples/.
"""

import os
import json
import time
import ssl
import urllib.request
import urllib.error

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

SAMPLES_DIR = os.path.join("docs", "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)
results = []


def save_sample(name: str, data):
    with open(os.path.join(SAMPLES_DIR, f"{name}.json"), "w") as fh:
        json.dump(data, fh, indent=2)


def deep_get(obj, dotted_key: str) -> bool:
    """Return True if dotted_key path exists in obj."""
    cur = obj
    for k in dotted_key.split("."):
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        elif isinstance(cur, list) and cur and k in cur[0]:
            cur = cur[0][k]
        else:
            return False
    return True


def test_endpoint(name, url, method="GET", json_payload=None,
                  headers=None, expected_key=None):
    headers = dict(headers or {})
    status = "ERROR"
    latency = 0
    key_present = False
    data = None

    try:
        body_bytes = None
        if json_payload is not None:
            body_bytes = json.dumps(json_payload).encode()
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=body_bytes,
                                     headers=headers, method=method)
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=20, context=SSL_CTX) as resp:
            latency = int((time.time() - t0) * 1000)
            status = resp.getcode()
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(raw)
                save_sample(name, data)
                if expected_key:
                    key_present = deep_get(data, expected_key)
                else:
                    key_present = True
            except json.JSONDecodeError:
                pass
    except urllib.error.HTTPError as exc:
        latency = int((time.time() - t0) * 1000) if 't0' in dir() else 0
        status = exc.code
        try:
            err_body = exc.read().decode()
            save_sample(f"{name}_error", {"http_error": exc.code, "body": err_body[:500]})
        except Exception:
            pass
    except Exception as exc:
        status = f"FAIL ({type(exc).__name__})"

    icon = "✅" if str(status) == "200" and key_present else "❌"
    print(f"{icon} {name:30} | {str(status):8} | {latency:5}ms | key={key_present}")
    results.append({"provider": name, "url": url, "status": status,
                    "latency_ms": latency, "key_present": key_present})
    return data


if __name__ == "__main__":
    HF = os.environ.get("HF_TOKEN", "")
    hf_h = {"Authorization": f"Bearer {HF}"} if HF else {}

    print(f"\n{'':2}{'Provider':30} | {'Status':8} | {'Latency':7} | key_present")
    print("─" * 70)

    # P1 – Weather (Open-Meteo)
    test_endpoint("open_meteo_forecast",
                  "https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,relative_humidity_2m,wind_speed_10m",
                  expected_key="current.temperature_2m")

    test_endpoint("open_meteo_archive",
                  "https://archive-api.open-meteo.com/v1/archive?latitude=12.97&longitude=77.59&start_date=2024-01-01&end_date=2024-01-03&daily=precipitation_sum",
                  expected_key="daily.precipitation_sum")

    test_endpoint("open_meteo_flood",
                  "https://flood-api.open-meteo.com/v1/flood?latitude=12.97&longitude=77.59&daily=river_discharge",
                  expected_key="daily.river_discharge")

    test_endpoint("open_meteo_geocoding",
                  "https://geocoding-api.open-meteo.com/v1/search?name=Bangalore&count=1",
                  expected_key="results")

    # P2 – Soil (SoilGrids)
    test_endpoint("soilgrids",
                  "https://rest.isric.org/soilgrids/v2.0/properties/query?lon=77.59&lat=12.97&property=phh2o&property=nitrogen&property=soc&depth=0-5cm&value=mean",
                  expected_key="properties.layers")

    # P3 – NASA POWER
    test_endpoint("nasa_power",
                  "https://power.larc.nasa.gov/api/temporal/daily/point?start=20240101&end=20240103&latitude=12.97&longitude=77.59&community=AG&parameters=ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M,RH2M&format=JSON",
                  expected_key="properties.parameter")

    # P4 – Satellite STAC
    test_endpoint("element84_stac",
                  "https://earth-search.aws.element84.com/v1/search?collections=sentinel-2-l2a&limit=1",
                  expected_key="features")

    test_endpoint("planetary_computer_stac",
                  "https://planetarycomputer.microsoft.com/api/stac/v1/search?collections=sentinel-2-l2a&limit=1",
                  expected_key="features")

    # FX
    test_endpoint("fx_rates",
                  "https://open.er-api.com/v6/latest/USD",
                  expected_key="rates")

    # HF LLM
    test_endpoint("hf_llm",
                  "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
                  method="POST",
                  json_payload={"inputs": "What is agriculture? Answer in one sentence."},
                  headers=hf_h)

    # HF Vision (plant disease)
    test_endpoint("hf_vision",
                  "https://api-inference.huggingface.co/models/ozair23/mobilenet_v2-1.0-224-finetuned-plantdisease",
                  method="POST",
                  json_payload={"inputs": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Tomato_leaf_blight.jpg"},
                  headers=hf_h)

    print("\n─" * 70)
    green = sum(1 for r in results if str(r["status"]) == "200" and r["key_present"])
    print(f"\nSummary: {green}/{len(results)} providers GREEN\n")

    # Save STATUS.md
    lines = ["# Provider Status (Step 0 Preflight)\n",
             "| Provider | Status | Latency (ms) | Key Present |\n",
             "|---|---|---|---|\n"]
    for r in results:
        ok = "✅" if str(r["status"]) == "200" and r["key_present"] else "❌"
        lines.append(f"| {ok} {r['provider']} | {r['status']} | {r['latency_ms']} | {r['key_present']} |\n")
    os.makedirs("docs", exist_ok=True)
    with open("docs/STATUS.md", "w") as fh:
        fh.writelines(lines)
    print("Saved docs/STATUS.md")
