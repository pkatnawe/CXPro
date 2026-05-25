# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

This repo contains **Ralph** — an autonomous agentic loop that runs an AI tool (Claude Code or Amp) repeatedly against a PRD until all user stories pass. It lives in `scripts/ralph/`.

## Running Ralph

```bash
# Default: amp, 10 iterations
./scripts/ralph/ralph.sh

# Use Claude Code instead
./scripts/ralph/ralph.sh --tool claude

# Custom iteration cap
./scripts/ralph/ralph.sh --tool claude 20
```

Ralph reads `scripts/ralph/prd.json` for user stories, executes one story per iteration, and exits when it sees `<promise>COMPLETE</promise>` in the agent output or hits `MAX_ITERATIONS`.

## Key Files

| File | Purpose |
|---|---|
| `scripts/ralph/ralph.sh` | The loop runner — parses args, invokes the AI tool, watches for the completion signal |
| `scripts/ralph/CLAUDE.md` | Instructions fed to Claude Code when `--tool claude` is used (piped via stdin) |
| `scripts/ralph/prompt.md` | Prompt fed to Amp when `--tool amp` is used |
| `scripts/ralph/prd.json` | User stories with `passes: true/false` (you create this per project) |
| `scripts/ralph/progress.txt` | Running log of what each iteration did; auto-created if missing |
| `scripts/ralph/archive/` | Auto-archived `prd.json` + `progress.txt` from previous runs when the branch changes |

## How the Loop Works

1. Ralph checks if `prd.json`'s `branchName` changed since the last run — if so, it archives the old `progress.txt` and `prd.json` into `scripts/ralph/archive/<date>-<branch>/`.
2. Each iteration invokes the AI tool and captures stdout.
3. If the output contains `<promise>COMPLETE</promise>`, Ralph exits 0.
4. If `MAX_ITERATIONS` is hit without completion, Ralph exits 1.

## prd.json Shape

```json
{
  "branchName": "ralph/my-feature",
  "stories": [
    { "id": "S1", "title": "...", "description": "...", "passes": false }
  ]
}
```

The agent picks the highest-priority story where `passes: false`, implements it, runs quality checks, commits, then sets `passes: true`.

## Agent skills

### Issue tracker

GitHub Issues at `shlokpatel1998/CXPro` via the `gh` CLI. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

Canonical vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Project-specific extras: `HITL`, `AFK`. See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single-context. The domain glossary (ubiquitous language) lives at [`CONTEXT.md`](CONTEXT.md) at the repo root, sourced from the per-context `**Language:**` lines inside [`docs/architecture.md`](docs/architecture.md). Architecture (aggregates, events, bounded-context map) stays in `docs/architecture.md`. Architectural decisions live in [`docs/adr/`](docs/adr/). See [`docs/agents/domain.md`](docs/agents/domain.md).
