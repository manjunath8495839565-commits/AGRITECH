#!/usr/bin/env python3
"""
Step 2 – Seed the database with 24 farms across 12 zones.
Run: python3 seed.py
Expected output: counts for farms and zones.
"""

import asyncio
import json
import os
import sys
import uuid

# Allow running from repo root
sys.path.insert(0, os.path.dirname(__file__))

from app.models.database import init_db, AsyncSessionLocal, Farm, ZoneDB


ZONES_FILE = os.path.join("..", "data", "zones", "zones.json")
FARMS_DATA = [
    # India – Punjab
    {"id": "F001", "zone_id": "IN-PNJ", "country": "India", "name": "Singh Agrofields", "latitude": 30.92, "longitude": 75.88, "area_ha": 4.5, "crop": "wheat", "farmer_name": "Gurpreet Singh", "phone": "+91-98765-43210"},
    {"id": "F002", "zone_id": "IN-PNJ", "country": "India", "name": "Kaur Farm Estate", "latitude": 30.87, "longitude": 75.82, "area_ha": 2.1, "crop": "rice", "farmer_name": "Mandeep Kaur", "phone": "+91-98123-45678"},
    {"id": "F003", "zone_id": "IN-PNJ", "country": "India", "name": "Brar Maize Fields", "latitude": 30.95, "longitude": 75.90, "area_ha": 7.3, "crop": "maize", "farmer_name": "Harjit Brar", "phone": "+91-97654-32109"},
    # India – Karnataka
    {"id": "F004", "zone_id": "IN-KAR", "country": "India", "name": "Kumar Cane Farms", "latitude": 12.95, "longitude": 77.55, "area_ha": 3.2, "crop": "sugarcane", "farmer_name": "Ravi Kumar", "phone": "+91-99001-12345"},
    {"id": "F005", "zone_id": "IN-KAR", "country": "India", "name": "Devi Paddy Estate", "latitude": 12.99, "longitude": 77.63, "area_ha": 1.8, "crop": "rice", "farmer_name": "Lakshmi Devi", "phone": "+91-94455-67890"},
    # India – Maharashtra
    {"id": "F006", "zone_id": "IN-MHR", "country": "India", "name": "Patil Soybean Farms", "latitude": 19.78, "longitude": 75.75, "area_ha": 5.0, "crop": "soybean", "farmer_name": "Suresh Patil", "phone": "+91-98234-56789"},
    {"id": "F007", "zone_id": "IN-MHR", "country": "India", "name": "Shinde Onion Fields", "latitude": 19.72, "longitude": 75.68, "area_ha": 3.5, "crop": "onion", "farmer_name": "Priya Shinde", "phone": "+91-99876-54321"},
    # India – Uttar Pradesh
    {"id": "F008", "zone_id": "IN-UP", "country": "India", "name": "Yadav Wheat Estate", "latitude": 26.88, "longitude": 80.95, "area_ha": 6.0, "crop": "wheat", "farmer_name": "Ram Yadav", "phone": "+91-98345-67890"},
    # Kenya – Rift Valley
    {"id": "F009", "zone_id": "KE-RVL", "country": "Kenya", "name": "Mwangi Maize Farm", "latitude": -0.28, "longitude": 36.08, "area_ha": 2.8, "crop": "maize", "farmer_name": "James Mwangi", "phone": "+254-722-123456"},
    {"id": "F010", "zone_id": "KE-RVL", "country": "Kenya", "name": "Wanjiku Coffee Estate", "latitude": -0.33, "longitude": 36.12, "area_ha": 1.5, "crop": "coffee", "farmer_name": "Grace Wanjiku", "phone": "+254-733-987654"},
    {"id": "F011", "zone_id": "KE-RVL", "country": "Kenya", "name": "Cherop Wheat Fields", "latitude": -0.25, "longitude": 36.06, "area_ha": 4.2, "crop": "wheat", "farmer_name": "Mary Cherop", "phone": "+254-714-456789"},
    # Kenya – Central
    {"id": "F012", "zone_id": "KE-CEN", "country": "Kenya", "name": "Kamau Tea Gardens", "latitude": -0.40, "longitude": 36.99, "area_ha": 3.1, "crop": "tea", "farmer_name": "Peter Kamau", "phone": "+254-711-234567"},
    {"id": "F013", "zone_id": "KE-CEN", "country": "Kenya", "name": "Njoroge Banana Farm", "latitude": -0.45, "longitude": 37.04, "area_ha": 1.2, "crop": "banana", "farmer_name": "John Njoroge", "phone": "+254-720-345678"},
    # Kenya – Coast
    {"id": "F014", "zone_id": "KE-CST", "country": "Kenya", "name": "Mwamba Cassava Fields", "latitude": -4.07, "longitude": 39.70, "area_ha": 2.0, "crop": "cassava", "farmer_name": "Ali Mwamba", "phone": "+254-726-789012"},
    # Nigeria – Kano
    {"id": "F015", "zone_id": "NG-KAN", "country": "Nigeria", "name": "Abdullahi Groundnut Farm", "latitude": 12.02, "longitude": 8.55, "area_ha": 6.2, "crop": "groundnut", "farmer_name": "Musa Abdullahi", "phone": "+234-803-123456"},
    {"id": "F016", "zone_id": "NG-KAN", "country": "Nigeria", "name": "Yusuf Sorghum Estate", "latitude": 11.97, "longitude": 8.49, "area_ha": 4.0, "crop": "sorghum", "farmer_name": "Fatima Yusuf", "phone": "+234-806-789012"},
    {"id": "F017", "zone_id": "NG-KAN", "country": "Nigeria", "name": "Hassan Millet Farm", "latitude": 12.05, "longitude": 8.58, "area_ha": 5.5, "crop": "millet", "farmer_name": "Ibrahim Hassan", "phone": "+234-809-234567"},
    # Nigeria – Ogun
    {"id": "F018", "zone_id": "NG-OGN", "country": "Nigeria", "name": "Okafor Cassava Fields", "latitude": 7.18, "longitude": 3.37, "area_ha": 2.5, "crop": "cassava", "farmer_name": "Emeka Okafor", "phone": "+234-802-345678"},
    {"id": "F019", "zone_id": "NG-OGN", "country": "Nigeria", "name": "Adeyemi Maize Farm", "latitude": 7.14, "longitude": 3.33, "area_ha": 3.8, "crop": "maize", "farmer_name": "Bisi Adeyemi", "phone": "+234-805-456789"},
    # Nigeria – Kwara
    {"id": "F020", "zone_id": "NG-KWA", "country": "Nigeria", "name": "Lawal Yam Estate", "latitude": 8.51, "longitude": 4.57, "area_ha": 4.7, "crop": "yam", "farmer_name": "Abubakar Lawal", "phone": "+234-807-567890"},
    # Ghana – Ashanti
    {"id": "F021", "zone_id": "GH-ASH", "country": "Ghana", "name": "Mensah Cocoa Farm", "latitude": 6.75, "longitude": -1.60, "area_ha": 3.7, "crop": "cocoa", "farmer_name": "Kwame Mensah", "phone": "+233-244-123456"},
    {"id": "F022", "zone_id": "GH-ASH", "country": "Ghana", "name": "Asante Cassava Fields", "latitude": 6.71, "longitude": -1.64, "area_ha": 2.3, "crop": "cassava", "farmer_name": "Abena Asante", "phone": "+233-245-234567"},
    # Ghana – Northern
    {"id": "F023", "zone_id": "GH-NOR", "country": "Ghana", "name": "Tampuri Groundnut Farm", "latitude": 9.42, "longitude": -0.83, "area_ha": 5.1, "crop": "groundnut", "farmer_name": "Amatus Tampuri", "phone": "+233-246-345678"},
    {"id": "F024", "zone_id": "GH-NOR", "country": "Ghana", "name": "Daare Sorghum Estate", "latitude": 9.38, "longitude": -0.87, "area_ha": 6.8, "crop": "sorghum", "farmer_name": "Zenabu Daare", "phone": "+233-247-456789"},
]


async def seed():
    # Init DB
    await init_db()
    print("✅ Database initialized")

    # Load zones
    zones_path = os.path.join(os.path.dirname(__file__), "..", "data", "zones", "zones.json")
    with open(zones_path) as f:
        zones_data = json.load(f)

    async with AsyncSessionLocal() as session:
        # Seed zones
        zone_count = 0
        for z in zones_data:
            existing = await session.get(ZoneDB, z["id"])
            if not existing:
                session.add(ZoneDB(**z))
                zone_count += 1
        await session.commit()

        # Seed farms
        farm_count = 0
        for f in FARMS_DATA:
            existing = await session.get(Farm, f["id"])
            if not existing:
                session.add(Farm(**f))
                farm_count += 1
        await session.commit()

    print(f"✅ Seeded {zone_count} zones (total: {len(zones_data)})")
    print(f"✅ Seeded {farm_count} farms (total: {len(FARMS_DATA)})")
    print(f"\nSummary:")
    print(f"  Zones: {len(zones_data)}")
    print(f"  Farms: {len(FARMS_DATA)}")

    countries = {}
    for f in FARMS_DATA:
        countries[f['country']] = countries.get(f['country'], 0) + 1
    for c, n in sorted(countries.items()):
        print(f"  {c}: {n} farms")


if __name__ == "__main__":
    asyncio.run(seed())
