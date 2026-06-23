"""CxBench item schema + validation.

Loads JSONL eval items and validates them against the schema documented in
../cxbench/schema.md. Pure stdlib so it runs anywhere.
"""
from __future__ import annotations
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
# corpus/eval/harness -> corpus/study-notes
STUDY_NOTES = os.path.normpath(os.path.join(HERE, "..", "..", "study-notes"))

ROLES = {"cx_engineer", "oca", "construction_manager", "field_technician",
         "design_engineer", "owner_fm"}
SUITES = {"knowledge-qa", "procedure-gen", "traceability", "standards",
          "faithfulness-refusal"}
TYPES = {"mcq", "short", "procedure"}
COMMON = ["id", "suite", "role", "level", "document", "topic", "difficulty",
          "type", "citation", "verified"]


def _require(item, keys):
    return [k for k in keys if k not in item]


def validate_item(item: dict) -> list[str]:
    """Return a list of problem strings; empty means valid."""
    errs = []
    missing = _require(item, COMMON)
    if missing:
        errs.append(f"missing fields: {missing}")
    if item.get("suite") not in SUITES:
        errs.append(f"bad suite: {item.get('suite')!r}")
    if item.get("role") not in ROLES:
        errs.append(f"bad role: {item.get('role')!r}")
    if item.get("type") not in TYPES:
        errs.append(f"bad type: {item.get('type')!r}")

    t = item.get("type")
    if t == "mcq":
        for k in ("question", "options", "answer"):
            if k not in item:
                errs.append(f"mcq missing {k}")
        opts = item.get("options", {})
        if isinstance(opts, dict) and item.get("answer") not in opts:
            errs.append(f"answer {item.get('answer')!r} not in options")
    elif t == "short":
        for k in ("question", "reference_answer", "key_points"):
            if k not in item:
                errs.append(f"short missing {k}")
    elif t == "procedure":
        for k in ("system", "input", "rubric"):
            if k not in item:
                errs.append(f"procedure missing {k}")

    # citation source should resolve to a real knowledge-base file
    cite = item.get("citation") or {}
    src = cite.get("source")
    if src:
        if not os.path.exists(os.path.join(STUDY_NOTES, src)):
            errs.append(f"citation source not found in study-notes/: {src}")
    elif item.get("suite") in ("knowledge-qa", "standards", "traceability"):
        errs.append("missing citation.source")
    return errs


def load_jsonl(path: str) -> list[dict]:
    items = []
    with open(path) as f:
        for n, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError as e:
                raise ValueError(f"{path}:{n}: invalid JSON: {e}") from e
    return items


def validate_file(path: str) -> tuple[int, list[str]]:
    items = load_jsonl(path)
    problems = []
    seen = set()
    for i, item in enumerate(items):
        iid = item.get("id", f"<line {i+1}>")
        if iid in seen:
            problems.append(f"{iid}: duplicate id")
        seen.add(iid)
        for e in validate_item(item):
            problems.append(f"{iid}: {e}")
    return len(items), problems


if __name__ == "__main__":
    import sys
    for p in sys.argv[1:]:
        n, probs = validate_file(p)
        print(f"{p}: {n} items, {len(probs)} problems")
        for pr in probs:
            print("  -", pr)
