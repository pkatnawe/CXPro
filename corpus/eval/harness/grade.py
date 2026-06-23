"""Graders for CxBench responses.

Deterministic, stdlib-only graders so the harness runs without a model:
  * mcq            — exact match on the option letter.
  * short/proc/... — rubric coverage: fraction of expected key-points present in the
                     response text (a placeholder for an LLM-judge; swap in a real judge
                     by passing `judge=` to grade_item).
  * citation       — for citation-required suites, did the response cite the right source?

Returns per item: {"score": float 0..1, "citation_ok": bool, "detail": str}
"""
from __future__ import annotations
import re

CITATION_REQUIRED = {"knowledge-qa", "standards", "traceability", "procedure-gen"}


def _words(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if len(w) > 3}


def _covers(point: str, text: str) -> bool:
    """A key-point counts as covered if it appears verbatim (case-insensitive) or if
    >=60% of its significant words appear in the response text."""
    p = (point or "").lower().strip()
    t = (text or "").lower()
    if p and p in t:
        return True
    pw = _words(point)
    if not pw:
        return False
    tw = _words(text)
    return len(pw & tw) / len(pw) >= 0.6


def _coverage_score(points: list[str], text: str) -> float:
    if not points:
        return 0.0
    return sum(1 for p in points if _covers(p, text)) / len(points)


def _citation_ok(item: dict, response: dict) -> bool:
    if item.get("suite") not in CITATION_REQUIRED:
        return True
    if item.get("type") == "mcq":
        # MCQ knowledge items carry a citation for review, but the agent isn't asked
        # to cite a single letter — treat as satisfied.
        return True
    want = ((item.get("citation") or {}).get("source") or "").strip()
    if not want:
        return True
    cites = response.get("citations") or []
    return any(want in (c.get("source", "") if isinstance(c, dict) else str(c)) for c in cites)


def grade_item(item: dict, response: dict, judge=None) -> dict:
    t = item.get("type")
    cit_ok = _citation_ok(item, response)

    if t == "mcq":
        score = 1.0 if response.get("answer") == item.get("answer") else 0.0
        return {"score": score, "citation_ok": cit_ok,
                "detail": f"chose {response.get('answer')!r} want {item.get('answer')!r}"}

    text = response.get("text", "")
    if judge is not None:
        score = float(judge(item, text))
        return {"score": score, "citation_ok": cit_ok, "detail": "llm-judge"}

    if t == "short":
        points = item.get("key_points", [])
    elif t == "procedure":
        rub = item.get("rubric", {})
        points = list(rub.get("must_cover", [])) + list(rub.get("expected_points", []))
    else:
        points = item.get("key_points", [])
    score = _coverage_score(points, text)
    return {"score": score, "citation_ok": cit_ok,
            "detail": f"coverage {score:.2f} over {len(points)} key-points"}
