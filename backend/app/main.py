from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import Incident, MetricsResponse, SystemStatusResponse
from app.monitor import monitor


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
    version="1.1.0",
    lifespan=lifespan,
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "TwinCloud Ops Control Plane API",
        "version": "1.1.0",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "database": "PostgreSQL (twincloud-db)",
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
async def trigger_outage(node: str = Query("aws-primary", description="Node to fail (aws-primary or azure-secondary)")):
    return await monitor.trigger_simulated_outage(node)


@app.post("/api/simulate/recover")
async def trigger_recovery(node: str = Query("aws-primary", description="Node to recover")):
    return await monitor.trigger_simulated_recovery(node)
