from fastapi import APIRouter
from app.schemas.models import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def health():
    from app.services import ollama_llm
    ollama_stat = await ollama_llm.check_ollama_health()
    ollama_status = f"live ({ollama_stat['active_model']})" if ollama_stat["connected"] else "offline"

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
            "ollama_local": ollama_status,
            "hf_llm": "config_required",
            "hf_vision": "config_required",
        },
    )
