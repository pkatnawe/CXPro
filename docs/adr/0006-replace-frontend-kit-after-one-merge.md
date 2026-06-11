---
status: accepted
---

# Replace frontend-kit (`fk-*`) with wireframe-kit (`wk-*`) after one merge cycle

The just-merged `frontend/src/lib/frontend-kit/` module — built from the prior `frontend-design/` (Blueprint/Site directions) — is being replaced with `wk-*` primitives from the new `frontend-design/wireframe-kit.jsx` (Geist Sans/Mono, CSS-variable theming, light/dark + accent tokens). The previous design is discarded; the new design folder superseded it within the same week. Future readers seeing 16 commits of `fk-*` work landing on main and immediately being undone in the next PRD should know this was deliberate: the design source itself changed, not a course-correction on the port. The `wk-*` kit is a different system (different primitives like `WFrame`/`WLines`/`WSectionLabel`, CSS-variable-driven theme/accent surfaces, density tokens) — not a rename of the prior kit.

## Consequences

- `frontend/src/lib/frontend-kit/index.tsx` and `styles.css` are deleted, not migrated. The Assets list and Asset Detail pages, just rebuilt on `fk-*`, are rebuilt again on `wk-*`.
- The Asset Detail page additionally changes navigation chrome (top tabs → left rail) and tab count (5 → 9, four of which render mocked design-preview data because no backend exists for Issues/Files/RFIs/History).
- Theme + accent tokens move into the app shell, persisted to localStorage. The runtime "density" toggle from the design canvas is intentionally dropped — it was a wireframe artifact.
- The design's AI surfaces (Ask CXP, copilot rail, ✦ chips, AI summary cards) are stripped on the port; they will return when an AI backend exists.
- Future design refreshes follow the same rule: a swap in `frontend-design/` is the trigger to plan a port PRD, not to in-place mutate the shipped kit.
