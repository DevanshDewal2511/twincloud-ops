from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
VALID_KEY = "twincloud-demo-2026"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["service"] == "TwinCloud Ops Control Plane API"


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "twincloud-backend"


def test_system_status_endpoint():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "overall_status" in data
    assert "nodes" in data


def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_probes" in data
    assert "availability_percentage" in data


def test_unauthorized_simulation_access():
    # Attempt mutation without key -> must fail with 401
    res_unauthorized = client.post("/api/simulate/outage?node=aws-primary")
    assert res_unauthorized.status_code == 401
    assert "Unauthorized" in res_unauthorized.json()["detail"]


def test_authorized_simulation_lifecycle():
    headers = {"X-Demo-Key": VALID_KEY}

    # Trigger simulated outage with valid key
    res_outage = client.post("/api/simulate/outage?node=aws-primary", headers=headers)
    assert res_outage.status_code == 200
    assert res_outage.json()["status"] == "SUCCESS"
    assert res_outage.json()["action"] == "SIMULATED_OUTAGE_TRIGGERED"

    # Trigger simulated recovery with valid key
    res_recover = client.post("/api/simulate/recover?node=aws-primary", headers=headers)
    assert res_recover.status_code == 200
    assert res_recover.json()["status"] == "SUCCESS"
    assert res_recover.json()["action"] == "SIMULATED_RECOVERY_TRIGGERED"
