# TwinCloud Ops ☁️

### Zero-Cost Multi-Cloud Disaster Recovery Simulation Platform

[![Docker](https://img.shields.io/badge/Docker-20+-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD Pipeline](https://github.com/DevanshDewal2511/twincloud-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/DevanshDewal2511/twincloud-ops/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC_Concepts-844FBA?logo=terraform&logoColor=white)](https://www.terraform.io/)

TwinCloud Ops is a production-grade multi-cloud disaster recovery simulation platform designed to demonstrate application health monitoring, automated failure detection, sub-second traffic failover, persistent incident tracking, and recovery time analytics.

The platform simulates two independent cloud environments locally using lightweight Docker containers:
* **AWS Primary (`us-east-1` on port 8081)**: Primary active application cluster.
* **Microsoft Azure Secondary (`eastus` on port 8082)**: Automated standby disaster recovery cluster.

When the primary environment fails, a high-performance **Nginx reverse proxy** automatically and transparently reroutes live client traffic to the secondary Azure environment in under 2 seconds, while a **FastAPI control plane** logs the incident, measures downtime, and stores **Recovery Time Objective (RTO)** analytics in **PostgreSQL**.

---

## 🏗️ System Architecture

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

## 🚀 Quick Start Guide

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, macOS, or Linux)
* Python 3.10+ (optional, for CLI chaos tests)

### 1. Launch the Entire Platform
From the project root, start all 6 containers:
```bash
docker-compose up -d
```

### 2. Access the Service Fleet
* **Disaster Recovery Command Center**: [http://localhost:3000](http://localhost:3000)
* **Central Traffic Ingress (Proxy)**: [http://localhost:8080](http://localhost:8080)
* **Backend API & Health Engine**: [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **AWS Primary Simulator**: [http://localhost:8081](http://localhost:8081)
* **Azure Secondary Simulator**: [http://localhost:8082](http://localhost:8082)

---

## 🧪 Testing Disaster Recovery & Chaos Drills

### Method 1: One-Click UI Controls (Recommended)
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Trigger AWS Outage"** in the drill ribbon.
3. Observe live failover to **Azure Secondary** and incident logging in real time.
4. Click **"Trigger Recovery"** to restore primary traffic and record exact RTO duration.

### Method 2: Automated CLI Chaos Test Suite
Run the automated 4-stage end-to-end chaos test:
```bash
python monitoring/chaos_runner.py
```

### Method 3: Container Level Simulation
```bash
# 1. Simulate Outage
docker stop twincloud-aws-primary

# 2. Verify uninterrupted traffic through proxy
curl http://localhost:8080/health.json

# 3. Simulate Recovery
docker start twincloud-aws-primary
```

---

## 📁 Repository Structure

```
twincloud-ops/
├── backend/                   # FastAPI control plane, heartbeat monitor, and DB models
│   ├── app/
│   │   ├── database.py        # Async SQLAlchemy PostgreSQL connection
│   │   ├── main.py            # FastAPI endpoints & lifespan
│   │   ├── models.py          # Pydantic schemas
│   │   └── monitor.py         # Polling engine & incident state manager
│   ├── Dockerfile
│   └── requirements.txt
├── database/                  # PostgreSQL schema and initialization
│   └── init.sql
├── docs/                      # Technical documentation & runbooks
│   ├── architecture.md        # Comprehensive architecture & design doc
│   └── dr-runbook.md          # Disaster recovery standard operating procedures
├── frontend/                  # React, Vite, and Tailwind CSS web dashboard
│   ├── src/
│   │   ├── App.jsx            # Live topology visualizer & drill controls
│   │   └── ...
│   ├── Dockerfile
│   └── nginx.conf
├── infrastructure/            # Terraform IaC multi-cloud architecture model
│   ├── modules/
│   │   ├── aws_primary/       # AWS VPC, Subnets, ALB, and ECS definitions
│   │   ├── azure_secondary/   # Azure VNet, NSG, and Container Group definitions
│   │   └── traffic_routing/   # Route 53 / Traffic Manager DNS failover model
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── monitoring/                # Automated chaos runner & test scripts
│   └── chaos_runner.py
├── nginx/                     # Ingress reverse proxy configuration
│   └── nginx.conf             # Active/standby upstream failover rules
├── simulation/                # Simulated cloud web tiers
│   ├── aws/                   # AWS landing page & health.json
│   └── azure/                 # Azure landing page & health.json
└── docker-compose.yml         # Multi-container orchestration
```

---

## 💰 Zero-Cloud-Cost Philosophy
This project runs entirely locally using free and open-source tooling. No AWS or Azure credentials, credit cards, or cloud billing activations are required.

---

## 📄 License
MIT License. Built for educational, DevOps, and cloud engineering demonstrations.
