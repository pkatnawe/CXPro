---
status: accepted
---

# The Equipment Logbook is a projection, not an aggregate; multimodal capture ships day 1 as asset-linked Documents

The product sells a per-asset "equipment logbook" — a permanent multimodal record (photos, voice notes, video, thermal captures) accumulating on every unit, with AI analytics on top. We decided the Logbook is a read-model view assembled from existing aggregates, not a new table or context: media captures are `Document` rows (typed `photo`/`audio_note`/`video`) carrying a new optional `asset_id` + `test_procedure_instance_id` linkage; transcription is a new extractor in the existing ingestion pipeline; test results and deviations stay in their owning contexts. Rejected alternatives: a `LogbookEntry` aggregate inside Asset Registry (violates that context's documented "no photos" boundary and duplicates Document & Knowledge's storage/indexing job) and a new "Field Capture" bounded context (a 13th context for a two-person team).

This ordering is deliberate: multimodal *capture* ships from day 1 because the dataset is the moat's prerequisite; the analytics (per-unit baselines, fleet-wide pattern detection, acoustic early-failure scoring) arrive later as Analytics-context projections and AI features consuming the same documents — no rework required.

## Consequences

- One small migration (asset/test links on `documents`), not a new context. The asset detail page renders the Logbook as a time-ordered query.
- Voice/video understanding rides the existing ingestion rails (detector → chunker/transcriber → extractor → pgvector); each new modality is an extractor, not an architecture change.
- If a future requirement demands logbook entries with their own lifecycle (e.g., regulator-signed field observations), promote that specific need to its own aggregate then — do not retrofit the whole Logbook into a table.
