# TwinCloud Ops - Monitoring & Chaos Testing Suite

This directory contains automated monitoring, chaos testing, and disaster recovery verification utilities for the **TwinCloud Ops** platform.

## Available Utilities

### 1. `chaos_runner.py`
An automated end-to-end chaos testing suite that executes 4 sequential validation stages against the running multi-cloud platform:

1. **Stage 1 (Baseline Verification)**: Assesses health across all 6 containerized services, verifies Nginx ingress routing, and confirms traffic is actively directed to AWS Primary.
2. **Stage 2 (Chaos Injection)**: Triggers an automated failure on AWS Primary, confirms system transition to `DEGRADED`, and verifies that traffic immediately reroutes to Azure Secondary in under 3 seconds.
3. **Stage 3 (Automated Recovery)**: Triggers node recovery, verifies monitoring heartbeat detection, and validates seamless failback to AWS Primary.
4. **Stage 4 (PostgreSQL Audit)**: Queries PostgreSQL directly via the Control Plane API to verify that incident IDs, timestamps, and exact Recovery Time Objective (RTO) durations in seconds were permanently persisted.

### Running the Chaos Suite
Execute the runner from your terminal:
```bash
python monitoring/chaos_runner.py
```
