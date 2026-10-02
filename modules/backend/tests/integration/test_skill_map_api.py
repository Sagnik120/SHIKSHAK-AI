"""Skill map endpoints: graph, goal routes, and adding a concept (offline)."""

import pytest

from modules.backend.src.services import skill_map


@pytest.fixture(autouse=True)
def isolated_custom_store(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_map, "_CUSTOM_PATH", tmp_path / "custom.json")
    monkeypatch.setenv("GEMINI_API_KEY", "")


def test_graph_has_no_dangling_prerequisites():
    graph = skill_map.concepts()
    assert all(p in graph for c in graph.values() for p in c["prereqs"])


def test_snapshot_and_goal_route(client, auth_headers):
    r = client.get("/api/v1/skill-map", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["concepts"]) >= 60 and body["route"] == []

    r = client.get("/api/v1/skill-map?goal=mamba", headers=auth_headers)
    route = r.json()["route"]
    ids = [s["id"] for s in route]
    assert ids[-1] == "mamba" and ids.index("ssm") < ids.index("mamba")
    assert sum(1 for s in route if s.get("next")) == 1


def test_unknown_goal_is_ignored(client, auth_headers):
    r = client.get("/api/v1/skill-map?goal=not_a_concept", headers=auth_headers)
    assert r.status_code == 200 and r.json()["goal"] is None


def test_add_concept_persists(client, auth_headers):
    r = client.post("/api/v1/skill-map/concepts", json={"topic": "Mamba-2 selective scan"}, headers=auth_headers)
    assert r.status_code == 200
    cid = r.json()["id"]
    ids = {c["id"] for c in client.get("/api/v1/skill-map", headers=auth_headers).json()["concepts"]}
    assert cid in ids


def test_requires_auth(client):
    assert client.get("/api/v1/skill-map").status_code == 401


def test_lesson_tags_and_planner_context(client, auth_headers, db):
    from modules.backend.src.db.models import Lesson
    from modules.backend.src.services.session_manager import SessionManager

    r = client.post("/api/v1/lessons", headers=auth_headers, json={
        "topic": "Self-attention", "skill_concept_id": "self_attention", "skill_goal_id": "mamba"})
    assert r.status_code == 201
