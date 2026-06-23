# CxBench harness

Stdlib-only Python (3.10+). Loads CxBench JSONL, validates it, runs an agent adapter,
grades responses, and reports per-suite metrics against `acceptance_bars.json`.

## Run

```bash
cd corpus/eval/harness

# validate a dataset
python3 schema.py ../cxbench/knowledge-qa/cx-engineer.v1.jsonl

# run the stub baseline (proves the pipeline; scores ≈ chance)
python3 run.py --dataset ../cxbench/knowledge-qa/cx-engineer.v1.jsonl

# run everything
python3 run.py --dataset "../cxbench/**/*.jsonl"
```

## Files

| File | Role |
|---|---|
| `schema.py` | Item schema + JSONL validation (also resolves `citation.source` to a real KB file) |
| `agent_adapter.py` | `StubAdapter` (baseline) and `CxAgentAdapter` (placeholder to wire the real DSPy/LangGraph agent) |
| `grade.py` | MCQ exact-match + rubric-coverage grader; swap in an LLM-judge via `grade_item(..., judge=)` |
| `run.py` | Runner + per-suite report vs bars |
| `acceptance_bars.json` | The pass bars (mirror `agent-training.html`) |

## Wiring the real agent

Implement `CxAgentAdapter.answer(item)` in `agent_adapter.py` to call the role-scoped
agent (`backend/cx_execution_agent.py` + retrieval over the grounding corpus) and return
`{"answer"|"text", "citations":[...]}`. Keep the agent's refuse-on-low-confidence behaviour —
a refusal is a valid, scored response.

## Swapping in an LLM-judge

`grade.py` uses a deterministic coverage heuristic by default. Pass a `judge(item, text)->float`
to `grade_item` (e.g. a Claude call scoring against the item's rubric) for open-ended suites,
and calibrate judge↔human agreement on a sample before trusting it.

## The human gate

Items ship `verified=false`. They are **drafts** until a commissioning SME confirms the
answer + citation and sets `verified=true` / `reviewer`. The runner reports verification
coverage; unverified items don't count as ground truth.
