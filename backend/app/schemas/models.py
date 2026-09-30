"""Shared Pydantic schemas – Section 6."""

from __future__ import annotations
from typing import Any, Generic, TypeVar, Optional
from datetime import datetime
from pydantic import BaseModel, Field

T = TypeVar("T")


class Live(BaseModel, Generic[T]):
    """Standard envelope wrapping every live API response."""
    data: T
    provider: str
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    latency_ms: int = 0
    cached: bool = False
    source_url: str = ""


class WeatherCurrent(BaseModel):
    temperature_2m: float
    relative_humidity_2m: float
    wind_speed_10m: float
    precipitation: float = 0.0
    weather_code: int = 0


class WeatherForecastDay(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    precipitation_sum: float
    wind_speed_max: float


class SoilProperty(BaseModel):
    name: str
    depth: str
    value: float
    unit: str


class SoilReport(BaseModel):
    latitude: float
    longitude: float
    properties: list[SoilProperty]


class NdviPoint(BaseModel):
    date: str
    ndvi: float
    cloud_cover: float = 0.0


class CropPrice(BaseModel):
    crop: str
    price_usd: float
    price_local: float
    currency: str
    market: str
    date: str


class FarmRecord(BaseModel):
    id: str
    name: str
    zone_id: str
    country: str
    latitude: float
    longitude: float
    area_ha: float
    crop: str
    farmer_name: str
    phone: Optional[str] = None


class Zone(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    area_km2: float
    climate: str
    primary_crops: list[str]


class AdvisoryRequest(BaseModel):
    farm_id: str
    question: str
    language: str = "en"


class AdvisoryResponse(BaseModel):
    answer: str
    confidence: float
    sources: list[str]
    language: str


class InteropPacket(BaseModel):
    packet_id: str
    source_node: str
    target_node: str
    payload_type: str
    payload: dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    signature: Optional[str] = None


class InteropAck(BaseModel):
    packet_id: str
    accepted: bool
    reason: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthStatus(BaseModel):
    status: str
    version: str
    node: str
    providers: dict[str, str]
