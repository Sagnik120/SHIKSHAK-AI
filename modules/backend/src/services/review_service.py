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
