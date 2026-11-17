from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NodeProbeResult(BaseModel):
    name: str
    target_url: str
    status: str = Field(description="HEALTHY, UNHEALTHY, or UNREACHABLE")
    http_code: Optional[int] = None
    latency_ms: float = 0.0
    last_checked: datetime
    payload: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class SystemStatusResponse(BaseModel):
    timestamp: datetime
    overall_status: str = Field(description="HEALTHY, DEGRADED, or OUTAGE")
    active_routing_target: Optional[str] = None
    nodes: Dict[str, NodeProbeResult]


class Incident(BaseModel):
    id: str
    target_node: str
    event_type: str = Field(description="OUTAGE, FAILOVER, or RECOVERY")
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    status: str = Field(description="OPEN or RESOLVED")
    details: str


class MetricsResponse(BaseModel):
    total_probes: int
    successful_probes: int
    failed_probes: int
    availability_percentage: float
    average_latency_ms: float
    active_incidents_count: int
    resolved_incidents_count: int
    total_incidents_count: int
