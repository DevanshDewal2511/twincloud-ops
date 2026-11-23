import os
import time
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Query, Header, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.models import Incident, MetricsResponse, SystemStatusResponse
from app.monitor import monitor

DEMO_CONTROL_KEY = os.getenv("DEMO_CONTROL_KEY", "twincloud-demo-2026")
_last_action_timestamp = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and start background monitoring engine
    await monitor.initialize()
    monitor.start()
    yield
    # Stop background monitoring engine
    monitor.stop()


app = FastAPI(
    title="TwinCloud Ops Control Plane API",
    description="Backend monitoring engine and disaster recovery analytics for TwinCloud Ops.",
    version="1.2.0",
    lifespan=lifespan,
)

# CORS configuration for secure access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def verify_demo_authorization(
    x_demo_key: Optional[str] = Header(None, alias="X-Demo-Key"),
    demo_key: Optional[str] = Query(None, alias="key"),
):
    """Protects chaos injection & recovery mutations against unauthorized external requests."""
    provided_key = x_demo_key or demo_key
    if not provided_key or provided_key != DEMO_CONTROL_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid X-Demo-Key required to execute disaster recovery chaos controls.",
            headers={"WWW-Authenticate": "X-Demo-Key"},
        )
    
    # Throttle rapid repeated clicks (cooldown of 2 seconds)
    global _last_action_timestamp
    now = time.time()
    if now - _last_action_timestamp < 1.5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: Please wait at least 2 seconds between disaster recovery drill triggers.",
        )
    _last_action_timestamp = now


@app.get("/")
def read_root():
    return {
        "service": "TwinCloud Ops Control Plane API",
        "version": "1.2.0",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "database": "PostgreSQL (twincloud-db)",
        "security": "Demo authorization guard active on mutation endpoints",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "service": "twincloud-backend",
        "monitor_running": monitor.is_running,
        "database": "connected",
    }


@app.get("/api/status", response_model=SystemStatusResponse)
def get_system_status():
    return monitor.get_system_status()


@app.get("/api/incidents", response_model=List[Incident])
def get_incidents():
    return monitor.get_incidents()


@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics():
    return monitor.get_metrics()


@app.post("/api/simulate/outage")
async def trigger_outage(
    node: str = Query("aws-primary", description="Node to fail (aws-primary or azure-secondary)"),
    _: None = Depends(verify_demo_authorization),
):
    if node not in ["aws-primary", "azure-secondary"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid node. Must be 'aws-primary' or 'azure-secondary'.",
        )
    return await monitor.trigger_simulated_outage(node)


@app.post("/api/simulate/recover")
async def trigger_recovery(
    node: str = Query("aws-primary", description="Node to recover"),
    _: None = Depends(verify_demo_authorization),
):
    if node not in ["aws-primary", "azure-secondary"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid node. Must be 'aws-primary' or 'azure-secondary'.",
        )
    return await monitor.trigger_simulated_recovery(node)
