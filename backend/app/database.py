import os
import logging
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Float, DateTime, Integer, select, update

logger = logging.getLogger("twincloud.database")

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://postgres:postgres@db:5432/twincloud"
)


class Base(DeclarativeBase):
    pass


class IncidentRecord(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    target_node: Mapped[str] = mapped_column(String(64), nullable=False)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)


class ProbeMetricRecord(Base):
    __tablename__ = "probe_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    node_name: Mapped[str] = mapped_column(String(64), nullable=False)
    target_url: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    http_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables verified/initialized successfully in PostgreSQL.")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization warning: {e}")


async def save_incident_to_db(incident):
    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                record = IncidentRecord(
                    id=incident.id,
                    target_node=incident.target_node,
                    event_type=incident.event_type,
                    start_time=incident.start_time,
                    end_time=incident.end_time,
                    duration_seconds=incident.duration_seconds,
                    status=incident.status,
                    details=incident.details,
                )
                await session.merge(record)
    except Exception as e:
        logger.error(f"Error saving incident {incident.id} to PostgreSQL: {e}")


async def update_incident_in_db(incident):
    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                stmt = (
                    update(IncidentRecord)
                    .where(IncidentRecord.id == incident.id)
                    .values(
                        end_time=incident.end_time,
                        duration_seconds=incident.duration_seconds,
                        status=incident.status,
                        details=incident.details,
                    )
                )
                await session.execute(stmt)
    except Exception as e:
        logger.error(f"Error updating incident {incident.id} in PostgreSQL: {e}")


async def load_incidents_from_db() -> List[IncidentRecord]:
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(IncidentRecord).order_by(IncidentRecord.start_time.desc()).limit(100)
            result = await session.execute(stmt)
            return list(result.scalars().all())
    except Exception as e:
        logger.error(f"Error loading incidents from PostgreSQL: {e}")
        return []
