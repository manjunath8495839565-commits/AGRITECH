"""Data source loader for engines – reads crops_db.json."""

import json
import os

_BASE = os.path.join(os.path.dirname(__file__), "..", "data", "crops", "crops_db.json")

def _load():
    path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "crops", "crops_db.json")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        data = json.load(f)
    return {c["name"]: c for c in data.get("crops", [])}

CROPS_DB: dict = _load()
