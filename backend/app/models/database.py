"""SQLAlchemy DB models + async init."""

from sqlalchemy import Column, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./agrin.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Farm(Base):
    __tablename__ = "farms"
    id = Column(String, primary_key=True)
    name = Column(String)
    zone_id = Column(String)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    area_ha = Column(Float)
    crop = Column(String)
    farmer_name = Column(String)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ZoneDB(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True)
    name = Column(String)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    area_km2 = Column(Float, nullable=True)
    climate = Column(String, nullable=True)
    rainfall_class = Column(String, nullable=True)
    soil_hint = Column(JSON, nullable=True)
    typical_crops = Column(JSON, nullable=True)
    primary_crops = Column(JSON, nullable=True)
    language_default = Column(String, nullable=True)


# Safe alias for Region
RegionDB = ZoneDB



class Advisory(Base):
    __tablename__ = "advisories"
    id = Column(String, primary_key=True)
    farm_id = Column(String)
    question = Column(Text)
    answer = Column(Text)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)


class InteropLog(Base):
    __tablename__ = "interop_log"
    id = Column(String, primary_key=True)
    packet_id = Column(String)
    source_node = Column(String)
    target_node = Column(String)
    payload_type = Column(String)
    payload = Column(JSON)
    accepted = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
