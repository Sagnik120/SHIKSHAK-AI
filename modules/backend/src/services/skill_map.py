"""AI skill map: a prerequisite graph of AI concepts, per-learner mastery taken
from existing lesson results, goal-driven routes, and LLM-assisted growth.

Read-only over lessons: nothing here changes how lessons are planned or taught.
New concepts added by learners persist in data/skill_map_custom.json.
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
import threading
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from modules.backend.src.db.models import Lesson, LessonNodeRow

logger = logging.getLogger(__name__)

TRACKS = [
    ("math", "Math foundations"),
    ("ml", "Classical ML"),
    ("dl", "Deep learning"),
    ("nlp", "Language & transformers"),
    ("gen", "Generative AI"),
    ("frontier", "Frontier"),
]

# (id, title, track, prerequisites, match keywords)
_CORE: list[tuple[str, str, str, list[str], list[str]]] = [
    # math
    ("vectors", "Vectors & matrices", "math", [], ["vector", "matrix", "matrices", "linear algebra"]),
    ("dot_product", "Dot product & similarity", "math", ["vectors"], ["dot product", "cosine similarity"]),
    ("matrix_mult", "Matrix multiplication", "math", ["vectors"], ["matrix multiplication", "matmul"]),
