# TwinCloud Ops - Disaster Recovery Runbook (SOP)

This runbook outlines the Standard Operating Procedures (SOP) for conducting disaster recovery drills, handling simulated outages, and auditing recovery analytics in **TwinCloud Ops**.

---

## 1. Pre-Flight Health Check

Before conducting any disaster recovery drill, ensure that the entire fleet is online and operational.

1. Verify container status:
   ```bash
   docker ps --filter "name=twincloud"
   ```
   *All 6 containers (`twincloud-frontend`, `twincloud-backend`, `twincloud-proxy`, `twincloud-db`, `twincloud-aws-primary`, `twincloud-azure-secondary`) should report `Up` with `(healthy)`.*

2. Confirm baseline health via API:
   ```bash
   curl -s http://localhost:8000/api/status
   ```
   *Expected response: `"overall_status": "HEALTHY"`, `"active_routing_target": "aws-primary"`.*

---

## 2. Executing a Disaster Recovery Drill

### Method A: One-Click Web Command Center (Recommended)
1. Open **`http://localhost:3000`** in your browser.
2. In the **Disaster Recovery Drill Command Center** ribbon, click **"Trigger AWS Outage"**.
3. **Verify Expected Outcomes**:
   * Dashboard overall status turns to **`DEGRADED`**.
   * AWS Primary turns to **`UNREACHABLE`**.
   * Active Target badge moves to **Azure Secondary**.
   * A new incident appears in the Incident Log table with status **`OPEN`**.
   * Browse to **`http://localhost:8080/`**: traffic is served by Azure without downtime.
4. When ready to conclude the drill, click **"Trigger Recovery"**.
5. **Verify Recovery Outcomes**:
   * Status returns to **`HEALTHY`**.
   * Active target restores to **AWS Primary**.
   * Incident changes to **`RESOLVED`** with recorded **RTO** in seconds.

---

### Method B: Terminal / Container Level Drill
To simulate a true operating system / container crash:

1. Stop the AWS Primary container:
   ```bash
   docker stop twincloud-aws-primary
   ```
2. Verify traffic continues serving from Azure:
   ```bash
   curl -s http://localhost:8080/health.json
   ```
3. Bring AWS Primary back online:
   ```bash
   docker start twincloud-aws-primary
   ```

---

### Method C: Automated Headless Chaos Suite
To run a fully automated 4-stage end-to-end chaos test with zero manual intervention:

```bash
python monitoring/chaos_runner.py
```

---

## 3. Post-Incident Review & Database Auditing

All drill telemetry is permanently stored in PostgreSQL. To review historical incidents directly:

```bash
docker exec twincloud-db psql -U postgres -d twincloud -c "SELECT id, target_node, event_type, status, duration_seconds, start_time FROM incidents ORDER BY start_time DESC;"
```
