def test_liveness_is_public(client):
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_readiness_is_public(client):
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert "providers_configured" in response.json()


def test_resume_route_requires_internal_key(client):
    response = client.post("/api/v1/resumes/search", json={"query": "python developer"})
    assert response.status_code == 401
