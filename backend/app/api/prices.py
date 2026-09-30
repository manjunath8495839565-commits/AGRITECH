"""Prices API router."""

from fastapi import APIRouter, Query
from app.services import prices as svc

router = APIRouter(tags=["prices"])


@router.get("/crop")
async def crop_price(
    crop: str = Query(..., description="Crop name e.g. wheat, rice, maize"),
    country: str = Query("India"),
    market: str = Query("local"),
):
    return await svc.get_prices(crop, country, market)
