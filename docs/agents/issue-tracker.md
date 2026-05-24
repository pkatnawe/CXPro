# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `shlokpatel1998/CXPro`. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

`gh` infers the repo from `git remote -v` automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Project-specific notes

- PRD-1 (tracer bullet) slices map to issues #4–#13. The PRD itself lives at [`docs/prd-1-tracer-bullet.md`](../prd-1-tracer-bullet.md).
- Ralph (`scripts/ralph/`) drives autonomous implementation of these issues from [`scripts/ralph/prd.json`](../../scripts/ralph/prd.json) — when working an existing issue, check both the GitHub issue *and* the matching slice in `prd.json`.
- This repo uses two extra labels alongside the canonical triage set: `HITL` (human-in-the-loop required) and `AFK` (can be implemented autonomously). The Ralph loop respects these.
