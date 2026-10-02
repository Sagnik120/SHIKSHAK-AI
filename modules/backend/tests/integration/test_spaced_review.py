"""Spaced review: due dates, pass/fail scheduling, lapses reopen the path."""

from datetime import datetime, timedelta, timezone

import pytest

from modules.backend.src.db.models import Lesson, LessonNodeRow, User
from modules.backend.src.services import skill_map


@pytest.fixture(autouse=True)
def isolated_custom_store(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_map, "_CUSTOM_PATH", tmp_path / "custom.json")


def _mastered(client, auth_headers, db, days_ago=3):
    r = client.post("/api/v1/lessons", headers=auth_headers,
                    json={"topic": "Gradient descent", "skill_concept_id": "gradient_descent", "skill_goal_id": "gradient_descent"})
    lesson = db.get(Lesson, r.json()["lesson_id"])
    db.add(LessonNodeRow(lesson_id=lesson.id, node_id="n0", position=0, concept="Gradient descent", attempts=2,
                         mastery_score=0.9, script_text="Gradient descent steps against the gradient; the learning rate is the step size."))
    lesson.updated_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    db.commit()
    return lesson


def _answer_all(client, auth_headers, db, right: bool):
    r = client.post("/api/v1/spaced-review/gradient_descent/start", headers=auth_headers)
    assert r.status_code == 200, r.text
    qs = r.json()["questions"]
    assert len(qs) == 2
    user = db.query(User).one()
    db.refresh(user)
    expected = {q["id"]: q["expected_concept"] for q in user.review_json["gradient_descent"]["pending"]}
    out = None
    for q in qs:
        ans = expected[q["id"]] if right else "something unrelated entirely"
        out = client.post("/api/v1/spaced-review/gradient_descent/answer", headers=auth_headers,
                          json={"question_id": q["id"], "answer": ans}).json()
    return out


def test_not_due_until_two_days(client, auth_headers, db):
    _mastered(client, auth_headers, db, days_ago=1)
    assert client.get("/api/v1/spaced-review", headers=auth_headers).json()["due"] == []


def test_pass_pushes_next_review_out(client, auth_headers, db):
    _mastered(client, auth_headers, db)
    due = client.get("/api/v1/spaced-review", headers=auth_headers).json()["due"]
    assert [d["id"] for d in due] == ["gradient_descent"]
    out = _answer_all(client, auth_headers, db, right=True)
    assert out["finished"] and out["passed"] and out["next_in_days"] == 5
    assert client.get("/api/v1/spaced-review", headers=auth_headers).json()["due"] == []

