from fastapi import APIRouter
from app.schemas.models import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def health():
    return HealthStatus(
        status="ok",
        version="2.0.0",
        node="A",
        providers={
            "open_meteo": "live",
            "soilgrids": "live",
            "nasa_power": "live",
            "element84_stac": "live",
            "fx_rates": "live",
            "hf_llm": "config_required",
            "hf_vision": "config_required",
        },
    )
