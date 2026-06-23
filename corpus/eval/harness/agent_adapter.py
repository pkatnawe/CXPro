"""Agent adapters — the seam between CxBench and an agent under test.

An adapter takes a CxBench item and returns a response dict:
  - mcq:        {"answer": "B"}
  - short:      {"text": "...", "citations": [{"source": "..."}]}
  - procedure:  {"text": "...", "citations": [...]}

Two adapters ship:
  * StubAdapter      — deterministic, no model. Proves the harness runs end-to-end.
  * CxAgentAdapter   — placeholder for the real agent. Wire this to the DSPy /
                       LangGraph cx_execution_agent (see backend/cx_execution_agent.py).
"""
from __future__ import annotations
import hashlib


class StubAdapter:
    """Deterministic non-model baseline. Picks an MCQ option from a hash of the id
    (reproducible across runs) and returns empty text for open items. Scores will be
    near chance — the point is to prove the pipeline, not to pass bars."""
    name = "stub"

    def answer(self, item: dict) -> dict:
        t = item.get("type")
        if t == "mcq":
            opts = sorted((item.get("options") or {}).keys())
            if not opts:
                return {"answer": None}
            h = int(hashlib.sha256(item["id"].encode()).hexdigest(), 16)
            return {"answer": opts[h % len(opts)]}
        return {"text": "", "citations": []}


class CxAgentAdapter:
    """Placeholder for the real role agent.

    To implement: call the role-scoped agent (DSPy signature + retrieval over the
    grounding corpus) and return its answer + citations in the response shape above.
    Keep the agent's own refuse-on-low-confidence behaviour — a refusal is a valid
    response and is scored by the faithfulness-refusal suite.

        from backend.cx_execution_agent import run_role_agent  # when wired
        out = run_role_agent(role=item["role"], prompt=_to_prompt(item))
        return {"answer": out.choice, "text": out.text, "citations": out.citations}
    """
    name = "cx-agent"

    def __init__(self, role: str | None = None):
        self.role = role

    def answer(self, item: dict) -> dict:  # pragma: no cover - not wired yet
        raise NotImplementedError(
            "Wire CxAgentAdapter to backend/cx_execution_agent.py "
            "(role-scoped DSPy agent + retrieval). See docstring."
        )


ADAPTERS = {"stub": StubAdapter, "cx-agent": CxAgentAdapter}


def get_adapter(name: str):
    if name not in ADAPTERS:
        raise SystemExit(f"unknown adapter {name!r}; choices: {list(ADAPTERS)}")
    return ADAPTERS[name]()
