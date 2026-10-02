"""Live difficulty rules and the placement check."""

from types import SimpleNamespace

import pytest

from modules.backend.src.services import difficulty, placement, skill_map


@pytest.fixture(autouse=True)
def isolated_custom_store(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_map, "_CUSTOM_PATH", tmp_path / "custom.json")


def _lesson(level="beginner", diff=None):
    return SimpleNamespace(level=level, difficulty=diff, difficulty_state=None)


def ev(correct, credit=0.0):
    return {"correct": correct, "partial_credit": credit}


def test_two_right_steps_up_one_wrong_steps_down_partial_holds():
    l = _lesson()                                   # beginner starts at 2
    assert difficulty.update(l, ev(True)) is None and l.difficulty == 2
    change = difficulty.update(l, ev(True))
    assert change["from"] == 2 and change["to"] == 3 and l.difficulty == 3
    assert difficulty.update(l, ev(False, 0.6)) is None and l.difficulty == 3   # partial: hold
    assert difficulty.update(l, ev(True)) is None                               # streak was reset
    assert difficulty.update(l, ev(False, 0.2))["to"] == 2
    assert len(l.difficulty_state["log"]) == 2


def test_level_is_bounded():
    l = _lesson(diff=1)
    assert difficulty.update(l, ev(False)) is None and l.difficulty == 1
    l = _lesson(diff=5)
    difficulty.update(l, ev(True))
    assert difficulty.update(l, ev(True)) is None and l.difficulty == 5


def _answer_all(right: bool):
    answers = []
    while True:
        out = placement.step(answers)
