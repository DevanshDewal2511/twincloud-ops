# TwinCloud Ops ☁️

### Zero-Cost Multi-Cloud Disaster Recovery Simulator

TwinCloud Ops is a multi-cloud disaster recovery simulation platform designed to demonstrate application health monitoring, automated failure detection, traffic switching, incident management, and recovery analytics.

The project simulates two independent cloud environments locally using Docker:

- **AWS Primary:** Simulated primary application environment.
- **Azure Secondary:** Simulated backup application environment.

When the primary application becomes unhealthy, the platform detects the failure and redirects new traffic to the secondary environment.

## 🎯 Problem Statement

Applications running in cloud environments can experience service interruptions due to application failures, infrastructure problems, or network issues.

Organizations need reliable monitoring and disaster recovery mechanisms to reduce downtime and maintain application availability.

TwinCloud Ops demonstrates how a centralized platform can monitor multiple environments and coordinate recovery operations.

## 💡 Proposed Solution

The platform provides:

- Multi-environment application health monitoring.
- Automated failure detection.
- Traffic switching through Nginx.
- Incident tracking and management.
- Recovery time measurement.
- Centralized monitoring dashboard.
- Controlled failure and recovery simulations.

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Containerization | Docker, Docker Compose |
| Traffic Routing | Nginx |
| Monitoring | Python health checks |
| Version Control | Git, GitHub |
| Infrastructure | Terraform |

## ⚙️ Project Architecture

The application consists of two simulated cloud environments and a centralized control plane.

1. Primary environment: AWS simulation.
2. Secondary environment: Azure simulation.
3. Monitoring engine: Checks application health.
4. Failover controller: Changes traffic routing when failure is detected.
5. Dashboard: Displays environment health, incidents, and recovery metrics.

## 💰 Cost Strategy

This project is designed to run locally using free and open-source tools. It does not require paid AWS or Azure deployments.

## 🚀 Project Status

Currently in the initial development and environment setup phase.

## 👥 Development Team

Two-person development team.

## 📌 Disclaimer

AWS and Azure environments are simulated locally. This prototype does not claim to provide live multi-cloud disaster recovery or production-grade cloud failover.
