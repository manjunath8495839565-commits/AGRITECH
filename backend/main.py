"""AgriN Connect v2 – FastAPI entry point (Module A)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.database import init_db
from app.api import health, weather, soil, satellite, prices, advisory, interop


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="AgriN Connect v2",
    description="Real-time agricultural intelligence platform.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(weather.router, prefix="/api/weather")
app.include_router(soil.router, prefix="/api/soil")
app.include_router(satellite.router, prefix="/api/satellite")
app.include_router(prices.router, prefix="/api/prices")
app.include_router(advisory.router, prefix="/api/advisory")
app.include_router(interop.router, prefix="/api/interop")
