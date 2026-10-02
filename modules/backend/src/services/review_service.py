"""Spaced review: mastered concepts come back just before they fade.

Schedule per concept lives on the user (review_json). Passing a review pushes
the next one further out (2 -> 5 -> 12 -> 30 -> 60 days); failing brings it back
to 2 days and reopens the concept on the learning path until a newer lesson
masters it again. Review answers never touch lessons, scores or escalations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from modules.backend.src.db.models import Lesson, User

INTERVALS = [2, 5, 12, 30, 60]
QUESTIONS = 2


class ReviewError(ValueError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _dt(value) -> Optional[datetime]:
    if not value:
        return None
    d = value if isinstance(value, datetime) else datetime.fromisoformat(str(value))
    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d


def lapsed_since(entry: Optional[dict], learned_at) -> bool:
    """True if the last review failed after the concept was last learned."""
    lapsed, learned = _dt((entry or {}).get("lapsed")), _dt(learned_at)
    return bool(lapsed and (learned is None or lapsed >= learned))


def _schedule(user: User, mastery: dict) -> dict:
    """Make sure every lesson-mastered concept has a schedule (first review 2 days after learning)."""
    reviews = dict(user.review_json or {})
    changed = False
    new = [cid for cid, m in mastery.items() if m.get("state") == "mastered" and cid not in reviews]
    # Placement can mark dozens known at once: spread those one per day, deepest
    # (most likely to fade) first, instead of making them all due together.
    from modules.backend.src.services import skill_map
    depth = skill_map._depth(skill_map.concepts())
    placed = sorted((c for c in new if mastery[c].get("source") == "placement"), key=lambda c: -depth.get(c, 0))
    stagger = {c: i for i, c in enumerate(placed)}
    for cid in new:
        m = mastery[cid]
        learned = _dt(m.get("learned_at")) or _dt((user.placement_json or {}).get("at")) or _now()
        first = learned + timedelta(days=INTERVALS[0] + stagger.get(cid, 0))
        reviews[cid] = {"interval": INTERVALS[0], "last": learned.isoformat(), "due": first.isoformat(), "lapsed": None}
        changed = True
    if changed:
        user.review_json = reviews
    return reviews


def due(db: Session, user: User) -> list[dict]:
    """Concepts due for review, most overdue first."""
    from modules.backend.src.services import skill_map

    graph = skill_map.concepts()
    mastery = skill_map.mastery(db, user.id, graph)
    reviews = _schedule(user, mastery)
    now, out = _now(), []
    for cid, r in reviews.items():
        m = mastery.get(cid, {})
        if cid not in graph or m.get("state") != "mastered":
            continue  # lapsed concepts are relearned on the path, not reviewed
        when = _dt(r["due"])
        if when and when <= now:
            out.append({"id": cid, "title": graph[cid]["title"], "lesson_id": m.get("lesson_id"),
                        "from_placement": m.get("source") == "placement",
                        "days_since": max(0, (now - _dt(r["last"])).days), "overdue_days": (now - when).days,
                        "interval": r["interval"], "in_progress": bool(r.get("pending"))})
    out.sort(key=lambda x: -x["overdue_days"])
    return out


def start(db: Session, user: User, cid: str) -> dict:
    """Two short questions from the script the learner watched (reused if already started)."""
    item = next((d for d in due(db, user) if d["id"] == cid), None)
    if item is None:
        raise ReviewError("That concept isn't due for review.")
    reviews = dict(user.review_json or {})
    entry = dict(reviews[cid])
    if not entry.get("pending"):
        entry["pending"], entry["answers"] = _questions(db, item, user), {}
        reviews[cid] = entry
        user.review_json = reviews
    return _public(cid, item["title"], entry)

