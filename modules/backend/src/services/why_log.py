"""The "Why?" log: every adaptive decision in a lesson, as structured entries.

Read-only. Built from what is already recorded (agent trace events, the
difficulty log, escalations, skill-map tags); entries carry a `kind` and
`params` so the client can phrase them in the learner's language.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from modules.backend.src.db.models import Escalation, Lesson, LessonEvent

_LEVEL_REASON = {"2 right in a row": "streak", "a missed answer": "miss"}


def _iso(value) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat() if isinstance(value, datetime) else str(value)


def _when(at: Optional[str]) -> datetime:
    from datetime import timezone
    try:
        d = datetime.fromisoformat(at) if at else datetime.min
    except ValueError:
        d = datetime.min
    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d.astimezone(timezone.utc)


def build(db: Session, lesson: Lesson) -> list[dict]:
    concept = {n.node_id: n.concept for n in lesson.nodes}
    out: list[dict] = []

    def add(at, kind: str, node_id: Optional[str] = None, **params) -> None:
        out.append({"at": _iso(at), "kind": kind, "node_id": node_id,
                    "concept": concept.get(node_id) if node_id else None, "params": params})

    events = db.scalars(
        select(LessonEvent).where(LessonEvent.lesson_id == lesson.id)
        .order_by(LessonEvent.occurred_at.asc(), LessonEvent.id.asc())
    ).all()

    last_eval: dict[Optional[str], dict] = {}
    for e in events:
        p, t = e.payload or {}, e.event_type
        if t == "agent.memory_read" and (p.get("weak_concepts") or p.get("recurring_misconceptions")):
            add(e.occurred_at, "memory", weak=(p.get("weak_concepts") or [])[:3],
                misconceptions=(p.get("recurring_misconceptions") or [])[:3])
        elif t == "agent.plan_generated":
