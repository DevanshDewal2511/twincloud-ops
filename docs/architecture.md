# TwinCloud Ops Architecture & Technical Design

TwinCloud Ops is a **zero-cloud-cost multi-cloud disaster recovery simulation platform** running locally using Docker containers. It models an enterprise active-passive multi-cloud architecture where **Amazon Web Services (AWS)** functions as the primary environment and **Microsoft Azure** acts as the automated standby disaster recovery (DR) target.

---

## 1. System Architecture Diagram

```
                             [ End Users / Web Clients ]
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │   Ingress Reverse Proxy (Nginx)     │
                       │          Port 8080                  │
                       │     (twincloud-proxy)               │
                       └──────────────┬──────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │ Active Flow                                       │ Standby (DR)
            ▼                                                   ▼
┌───────────────────────────┐                       ┌───────────────────────────┐
│     AWS Primary Node      │                       │   Azure Secondary Node    │
│  Simulated: us-east-1     │                       │    Simulated: eastus      │
│  Port: 8081               │                       │    Port: 8082             │
│  (twincloud-aws-primary)  │                       │ (twincloud-azure-secondary│
└───────────────────────────┘                       └───────────────────────────┘
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │ Probed every 4s
                                      ▼
                       ┌─────────────────────────────────────┐
                       │ Control Plane Monitoring Engine     │
                       │        FastAPI (Port 8000)          │
                       │     (twincloud-backend)             │
                       └──────────────┬──────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
  ┌─────────────────────────────┐           ┌─────────────────────────────┐
  │   React + Tailwind UI       │           │    PostgreSQL Database      │
  │   Port 3000                 │           │    Port 5432                │
  │   (twincloud-frontend)      │           │    (twincloud-db)           │
  └─────────────────────────────┘           └─────────────────────────────┘
```

---

## 2. Component Fleet Directory

| Service | Container Name | Host Port | Internal Port | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Frontend** | `twincloud-frontend` | `3000` | `80` | React 18 + Vite + Tailwind CSS Disaster Recovery Command Center |
| **Backend API** | `twincloud-backend` | `8000` | `8000` | FastAPI asynchronous heartbeat monitor & incident tracker |
| **Ingress Proxy** | `twincloud-proxy` | `8080` | `80` | Nginx reverse proxy with automated active-backup upstream failover |
| **Database** | `twincloud-db` | `5432` | `5432` | PostgreSQL 16 relational store for permanent audit logs & metrics |
| **AWS Primary** | `twincloud-aws-primary` | `8081` | `80` | Nginx serving primary landing page & `/health.json` |
| **Azure Secondary** | `twincloud-azure-secondary`| `8082` | `80` | Nginx serving DR backup landing page & `/health.json` |

---

## 3. Disaster Recovery Mechanics

### Normal State:
* Ingress (`localhost:8080`) actively routes 100% of incoming client traffic to `aws-primary:80`.
* The FastAPI control plane probes `aws-primary`, `azure-secondary`, and `proxy` every 4 seconds.
* Fleet status is reported as `HEALTHY`.

### Failure State:
* An outage occurs on AWS Primary (either simulated via UI or via `docker stop twincloud-aws-primary`).
* Nginx proxy detects the connection failure within 2 seconds (`proxy_connect_timeout 2s`, `proxy_next_upstream error timeout http_500 http_502 http_503 http_504`).
* Traffic is instantly and seamlessly rerouted to `azure-secondary:80` without dropping user connections.
* The monitoring engine flags the node as `UNREACHABLE`, logs an `OUTAGE` incident into PostgreSQL with an open status, and changes fleet status to `DEGRADED`.

### Recovery & Failback:
* AWS Primary is restored.
* Nginx proxy automatically resumes routing to `aws-primary:80` as the primary upstream.
* The monitoring engine detects recovery, closes the incident, calculates the exact **Recovery Time Objective (RTO)** in seconds, and writes a `RECOVERY` audit event to PostgreSQL.

---

## 4. Key Metrics Tracked
* **RTO (Recovery Time Objective)**: The duration in seconds from incident detection until verified recovery.
* **Platform Availability**: Ratio of successful probes to total probes over rolling time windows.
* **Rolling Latency**: Average round-trip response time across cloud nodes in milliseconds.
