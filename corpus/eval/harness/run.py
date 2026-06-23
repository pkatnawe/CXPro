#!/usr/bin/env python3
"""CxBench runner.

Loads one or more JSONL datasets, validates them, runs an agent adapter over every
item, grades the responses, and reports per-suite metrics against the acceptance bars.

    python3 run.py --dataset ../cxbench/knowledge-qa/cx-engineer.v1.jsonl
    python3 run.py --dataset ../cxbench/**/*.jsonl --adapter stub

Exit code is 0 (it's a report). Use --strict to exit 1 when any bar is unmet.
"""
from __future__ import annotations
import argparse
import glob
import json
import os
from collections import defaultdict

import schema
import grade as grading
from agent_adapter import get_adapter

HERE = os.path.dirname(os.path.abspath(__file__))


def load_bars(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def main() -> int:
    ap = argparse.ArgumentParser(description="Run CxBench against an agent adapter.")
    ap.add_argument("--dataset", nargs="+", required=True, help="JSONL file(s) or globs")
    ap.add_argument("--adapter", default="stub", help="agent adapter (default: stub)")
    ap.add_argument("--bars", default=os.path.join(HERE, "acceptance_bars.json"))
    ap.add_argument("--strict", action="store_true", help="exit 1 if any bar unmet")
    args = ap.parse_args()

    paths: list[str] = []
    for d in args.dataset:
        paths.extend(sorted(glob.glob(d)) or [d])

    bars = load_bars(args.bars)
    adapter = get_adapter(args.adapter)

    # aggregate per suite
    agg = defaultdict(lambda: {"n": 0, "score": 0.0, "cited": 0, "verified": 0})
    all_problems = []

    for path in paths:
        n, problems = schema.validate_file(path)
        all_problems += [f"{path}: {p}" for p in problems]
        for item in schema.load_jsonl(path):
            r = adapter.answer(item)
            g = grading.grade_item(item, r)
            s = agg[item["suite"]]
            s["n"] += 1
            s["score"] += g["score"]
            s["cited"] += 1 if g["citation_ok"] else 0
            s["verified"] += 1 if item.get("verified") else 0

    print(f"\nCxBench run — adapter={adapter.name} — {len(paths)} file(s)\n" + "=" * 64)
    if all_problems:
        print(f"\n⚠️  {len(all_problems)} schema problem(s):")
        for p in all_problems[:30]:
            print("   -", p)

    unmet = 0
    print(f"\n{'suite':<22}{'n':>4}{'acc':>8}{'cite%':>8}{'bar':>8}{'  status':>10}")
    print("-" * 64)
    for suite, s in sorted(agg.items()):
        if not s["n"]:
            continue
        acc = s["score"] / s["n"]
        cite = s["cited"] / s["n"]
        bar = bars.get(suite, {})
        target = bar.get("accuracy", bar.get("coverage"))
        ok = target is None or acc >= target
        if not ok:
            unmet += 1
        status = "PASS" if ok else "BELOW BAR"
        tstr = f"{target:.2f}" if target is not None else "  -"
        print(f"{suite:<22}{s['n']:>4}{acc:>8.2f}{cite*100:>7.0f}%{tstr:>8}{status:>10}")

    # verification coverage (the human gate)
    total = sum(s["n"] for s in agg.values())
    verified = sum(s["verified"] for s in agg.values())
    print("-" * 64)
    print(f"items: {total}   SME-verified: {verified} "
          f"({(verified/total*100 if total else 0):.0f}%)")
    if verified < total:
        print("note: unverified items are drafts; they don't count as ground truth "
              "until an SME signs off (verified=true).")

    print("\nLegend: 'acc' = mean score (mcq exact-match / rubric coverage). "
          "Stub adapter ≈ chance — wire CxAgentAdapter for real numbers.")
    return 1 if (args.strict and unmet) else 0


if __name__ == "__main__":
    raise SystemExit(main())
