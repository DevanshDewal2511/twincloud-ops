import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
import httpx

from app.models import Incident, MetricsResponse, NodeProbeResult, SystemStatusResponse
from app.database import (
    init_db,
    save_incident_to_db,
    update_incident_in_db,
    load_incidents_from_db,
)

logger = logging.getLogger("twincloud.monitor")
logging.basicConfig(level=logging.INFO)


class HealthMonitor:
    def __init__(self):
        self.targets = {
            "aws-primary": "http://aws-primary:80/health.json",
            "azure-secondary": "http://azure-secondary:80/health.json",
            "proxy": "http://proxy:80/proxy-status",
        }
        self.proxy_ingress_url = "http://proxy:80/health.json"
        
        self.latest_results: Dict[str, NodeProbeResult] = {}
        self.active_routing_target: Optional[str] = "aws-primary"
        self.incidents: List[Incident] = []
        self.open_incidents: Dict[str, Incident] = {}
        self.simulated_outages: Set[str] = set()

        # Metric counters
        self.total_probes: int = 0
        self.successful_probes: int = 0
        self.failed_probes: int = 0
        self.latency_samples: List[float] = []

        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initialize database connection and load historical incidents."""
        await init_db()
        db_records = await load_incidents_from_db()
        if db_records:
            self.incidents = [
                Incident(
                    id=r.id,
                    target_node=r.target_node,
                    event_type=r.event_type,
                    start_time=r.start_time,
                    end_time=r.end_time,
                    duration_seconds=r.duration_seconds,
                    status=r.status,
                    details=r.details or "",
                )
                for r in db_records
            ]
            for inc in self.incidents:
                if inc.status == "OPEN":
                    self.open_incidents[inc.target_node] = inc
            logger.info(f"Loaded {len(self.incidents)} historical incidents from PostgreSQL.")

    async def probe_node(self, client: httpx.AsyncClient, name: str, url: str) -> NodeProbeResult:
        start = time.perf_counter()
        now = datetime.now(timezone.utc)
        self.total_probes += 1

        # Check if node has a simulated software outage triggered
        if name in self.simulated_outages:
            self.failed_probes += 1
            return NodeProbeResult(
                name=name,
                target_url=url,
                status="UNREACHABLE",
                http_code=503,
                latency_ms=1.5,
                last_checked=now,
                error_message="Simulated DR Outage active via Control Plane",
            )

        try:
            resp = await client.get(url, timeout=2.5)
            latency = round((time.perf_counter() - start) * 1000, 2)
            self.latency_samples.append(latency)
            if len(self.latency_samples) > 200:
                self.latency_samples.pop(0)

            if resp.status_code == 200:
                self.successful_probes += 1
                try:
                    payload = resp.json()
                except Exception:
                    payload = {"raw": resp.text}

                return NodeProbeResult(
                    name=name,
                    target_url=url,
                    status="HEALTHY",
                    http_code=resp.status_code,
                    latency_ms=latency,
                    last_checked=now,
                    payload=payload,
                )
            else:
                self.failed_probes += 1
                return NodeProbeResult(
                    name=name,
                    target_url=url,
                    status="UNHEALTHY",
                    http_code=resp.status_code,
                    latency_ms=latency,
                    last_checked=now,
                    error_message=f"HTTP {resp.status_code}",
                )

        except Exception as ex:
            latency = round((time.perf_counter() - start) * 1000, 2)
            self.failed_probes += 1
            return NodeProbeResult(
                name=name,
                target_url=url,
                status="UNREACHABLE",
                http_code=None,
                latency_ms=latency,
                last_checked=now,
                error_message=str(ex),
            )

    async def check_active_ingress(self, client: httpx.AsyncClient) -> Optional[str]:
        """Query the proxy entry point to identify which cloud node is actively taking traffic."""
        try:
            resp = await client.get(self.proxy_ingress_url, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                cloud = data.get("cloud", "").lower()
                if "aws" in cloud:
                    return "aws-primary"
                elif "azure" in cloud:
                    return "azure-secondary"
        except Exception:
            pass

        # Fallback if primary is simulated down
        if "aws-primary" in self.simulated_outages:
            return "azure-secondary"
        return "aws-primary"

    def handle_state_transition(self, name: str, previous: Optional[NodeProbeResult], current: NodeProbeResult):
        now = datetime.now(timezone.utc)

        # Failure detection
        if (previous is None or previous.status == "HEALTHY") and current.status in ("UNREACHABLE", "UNHEALTHY"):
            if name not in self.open_incidents:
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                incident = Incident(
                    id=incident_id,
                    target_node=name,
                    event_type="OUTAGE",
                    start_time=now,
                    status="OPEN",
                    details=f"Node {name} became {current.status} ({current.error_message or 'Service down'}). Automated DR failover triggered.",
                )
                self.open_incidents[name] = incident
                self.incidents.insert(0, incident)
                asyncio.create_task(save_incident_to_db(incident))
                logger.warning(f"🚨 Incident Opened: {incident.id} for {name} ({current.status})")

        # Recovery detection
        elif previous and previous.status in ("UNREACHABLE", "UNHEALTHY") and current.status == "HEALTHY":
            if name in self.open_incidents:
                incident = self.open_incidents.pop(name)
                incident.end_time = now
                incident.duration_seconds = round((now - incident.start_time).total_seconds(), 2)
                incident.status = "RESOLVED"
                incident.details += f" Recovery verified in {incident.duration_seconds}s."

                # Update resolved outage in PostgreSQL
                asyncio.create_task(update_incident_in_db(incident))

                recovery_event = Incident(
                    id=f"REC-{uuid.uuid4().hex[:8].upper()}",
                    target_node=name,
                    event_type="RECOVERY",
                    start_time=now,
                    end_time=now,
                    duration_seconds=0.0,
                    status="RESOLVED",
                    details=f"Node {name} recovered to HEALTHY state. Traffic failback confirmed.",
                )
                self.incidents.insert(0, recovery_event)
                # Save recovery event to PostgreSQL
                asyncio.create_task(save_incident_to_db(recovery_event))
                logger.info(f"✅ Incident Resolved: {incident.id} for {name} in {incident.duration_seconds}s")

    async def trigger_simulated_outage(self, node: str) -> Dict[str, str]:
        self.simulated_outages.add(node)
        logger.warning(f"Simulated outage triggered on node: {node}")
        await self.run_probe_cycle()
        return {"status": "SUCCESS", "node": node, "action": "SIMULATED_OUTAGE_TRIGGERED"}

    async def trigger_simulated_recovery(self, node: str) -> Dict[str, str]:
        if node in self.simulated_outages:
            self.simulated_outages.remove(node)
        logger.info(f"Simulated recovery triggered on node: {node}")
        await self.run_probe_cycle()
        return {"status": "SUCCESS", "node": node, "action": "SIMULATED_RECOVERY_TRIGGERED"}

    async def run_probe_cycle(self):
        async with httpx.AsyncClient() as client:
            # Probe nodes concurrently
            tasks = [self.probe_node(client, name, url) for name, url in self.targets.items()]
            results = await asyncio.gather(*tasks)

            for result in results:
                prev = self.latest_results.get(result.name)
                self.handle_state_transition(result.name, prev, result)
                self.latest_results[result.name] = result

            # Probe ingress target
            ingress_target = await self.check_active_ingress(client)
            if ingress_target:
                self.active_routing_target = ingress_target

    async def monitoring_loop(self):
        logger.info("Starting TwinCloud monitoring loop...")
        self.is_running = True
        while self.is_running:
            try:
                await self.run_probe_cycle()
            except Exception as e:
                logger.error(f"Error in probe cycle: {e}")
            await asyncio.sleep(4)

    def start(self):
        if not self.is_running:
            self._task = asyncio.create_task(self.monitoring_loop())

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()

    def get_system_status(self) -> SystemStatusResponse:
        now = datetime.now(timezone.utc)
        statuses = [r.status for r in self.latest_results.values()]

        if not statuses:
            overall = "INITIALIZING"
        elif all(s == "HEALTHY" for s in statuses):
            overall = "HEALTHY"
        elif self.latest_results.get("proxy", None) and self.latest_results["proxy"].status != "HEALTHY":
            overall = "OUTAGE"
        else:
            overall = "DEGRADED"

        return SystemStatusResponse(
            timestamp=now,
            overall_status=overall,
            active_routing_target=self.active_routing_target,
            nodes=self.latest_results,
        )

    def get_metrics(self) -> MetricsResponse:
        avg_lat = round(sum(self.latency_samples) / max(len(self.latency_samples), 1), 2)
        avail = round((self.successful_probes / max(self.total_probes, 1)) * 100, 2)
        return MetricsResponse(
            total_probes=self.total_probes,
            successful_probes=self.successful_probes,
            failed_probes=self.failed_probes,
            availability_percentage=avail,
            average_latency_ms=avg_lat,
            active_incidents_count=len(self.open_incidents),
            resolved_incidents_count=len([i for i in self.incidents if i.status == "RESOLVED"]),
            total_incidents_count=len(self.incidents),
        )

    def get_incidents(self) -> List[Incident]:
        return self.incidents


monitor = HealthMonitor()
