# CxBench — Document-Intelligence Track (design)

Commissioning is, more than anything, a *document-reading* job: the team verifies that what was
built matches a design package made of specs, **equipment schedules**, **drawings**, **schematics**,
**one-line diagrams**, **control/sequence diagrams**, **submittals**, and increasingly **BIM/IFC**.
Our text-spec extraction (the existing `cx_execution_agent`) covers one corner. This track measures
the rest — whether the agents can actually *read the drawings*.

> Scope note: this is a design + data plan. No copyrighted drawing is reproduced anywhere in CxBench;
> we use public-domain/open data, our own annotations, and synthetic generation. See `dataset-catalog.md`
> Part 3 for sources and licenses, and the main `../README.md` for the overall eval strategy.

## Why this is its own track (and why it's hard)

Document intelligence here spans **five modalities**, each a distinct ML problem:

| Modality | Example artifacts | Core task |
|---|---|---|
| Text PDF | spec sections (01 91 00), sequences of operation | requirement extraction (have it) |
| Tables | equipment schedules, panel schedules, valve schedules | structure recovery + field extraction |
| 2D drawings (vector/raster) | MEP floor plans, mechanical layouts | symbol spotting, equipment localization |
| Schematics / graphs | electrical one-lines, P&IDs, control/ladder diagrams | symbol **+ connectivity** (graph) extraction |
| BIM / IFC | federated models, COBie schedules | structured cross-check vs the 2D set |

What makes it hard, and different from generic document AI:
- **Per-project symbology.** There is no enforced national HVAC/electrical symbol standard — each drawing carries its own **legend sheet**, so the legend is primary ground truth and standards (ISA-5.1, IEEE 315, ASHRAE 134) are the fallback vocabulary.
- **Connectivity, not just detection.** A one-line or P&ID is a *graph*; the commissioning value is tracing utility→gen→UPS→PDU or pump→valve→vessel, not just boxing symbols.
- **Cross-sheet, multi-page, dense.** Answers often require finding the right sheet in a 200-page set, then reading a dense region — the multi-page DocVQA problem, at engineering density.
- **Cross-document consistency.** The design-review job is detecting where the spec, the drawing, the schedule, and the submittal *disagree* — including "this can't be answered / is missing."

## The suites

Eight DI suites, each tied to a role agent, a modality, and an established metric (borrowed from the
doc-QA / table / symbol-spotting / graph-extraction literature — there is no domain-native benchmark to adopt).

**Hardness priority (per `../README.md`):** the cross-modal and cross-document suites are the hardest and the
most differentiating, so they carry the most weight and the toughest authoring scrutiny — especially
**DI-4 (one-line / P&ID connectivity tracing)** and **DI-8 (cross-document design-review discrepancy
detection)**, where the answer lives only in the drawing *and* must be reconciled across the spec, schedule,
and submittal. Easy single-sheet lookups exist only to calibrate; the headline is the hard split.

| Suite | Tests | Modality | Primary agent(s) | Metric | Data |
|---|---|---|---|---|---|
| **DI-1 Sheet classification** | discipline/type of a sheet (E/M/P, one-line, schedule, detail) | drawing | all | accuracy / mAP | borrow + build |
| **DI-2 Schedule extraction** | recover an equipment/panel schedule as structured rows/fields | table | Cx Engineer | **TEDS / TEDS-Struct**, field **F1**, ANLS* | NIST COBie, PubTables-1M, FinTabNet; build |
| **DI-3 Symbol spotting** | locate & classify symbols on MEP/electrical/P&ID sheets | drawing/schematic | Design Eng, Field Tech | **detection mAP @IoU**, panoptic PQ | CGHD, FloorPlanCAD*, PID2Graph; synthetic |
| **DI-4 Connectivity / graph** | trace the one-line power chain / P&ID graph (nodes + edges) | schematic | Cx Eng, Design Eng | symbol mAP + **edge/connection accuracy** | PID2Graph, CGHD; synthetic |
| **DI-5 Drawing VQA** | answer a question that requires reading a drawing | drawing/schematic | all | **ANLS / ANLS\***, box-grounded **Acc@IoU** | build (expert-authored) |
| **DI-6 Sequence extraction** | control diagram / SOO → structured points, modes, setpoints | schematic/text | Design Eng, Cx Eng | field **F1**, ANLS* | build; OpenBuildingControl as gold |
| **DI-7 Localization & inventory** | find / count instances of an equipment type on a sheet | drawing | Field Tech, CM | **Acc@IoU**, counting accuracy | NIST IFC, FloorPlanCAD*; build |
| **DI-8 Cross-document consistency** | spec ↔ drawing ↔ schedule ↔ submittal discrepancy detection (incl. "missing/non-answerable") | multi | OCA, Design Eng | accuracy + **calibration (ECE)**, DUDE-style non-answerable | build (the flagship) |

`*` non-commercial license → **eval-only**, never shipped (see governance below).

### Metric stack (adopt as-is)
- **ANLS / ANLS\*** — text-answer and *structured* extraction QA (ANLS\* extends ANLS to lists/key-value/JSON; backward-compatible).
- **Relaxed accuracy** (±5% numeric) — reading numbers off schedules/gauges/legends.
- **TEDS / TEDS-Struct** — schedule/table structure (tree-edit-distance over the table tree).
- **Detection mAP @IoU** + **panoptic quality** — symbol spotting.
- **Edge / connection accuracy (graph metrics)** — one-line/P&ID connectivity (the part that matters for tracing).
- **Box-grounded Acc@IoU** — force the answer to point at the right drawing region (answer correct *and* IoU≥τ).
- **Validated LLM-as-judge** — open-ended drawing QA; calibrate judge↔human agreement on a sample before trusting it.

### Authoring discipline (GPQA-style)
Expert-authored and human-verified (report inter-annotator agreement κ); **box-grounded** so every QA points
at a region; tagged by role/level/modality/difficulty; **contamination-resistant** (answerable from the
drawing, not from web priors); held out from any grounding corpus. Same `verified=false`→SME-signoff gate
as the rest of CxBench.

## Data strategy — borrow, build, synthesize

**Borrow (license-clean, ship-safe):**
- **NIST Common BIM Files** (public domain) — IFC geometry + **COBie equipment/space schedules**: the single best "drawing-able geometry + equipment metadata" ground truth. Anchor for DI-2 / DI-7 / DI-8.
- **PID2Graph** (CC BY-SA) — real P&IDs with **graph-level** ground truth: DI-4.
- **CGHD** (CC0) — symbols + connections + text on schematics: DI-3 / DI-4 method transfer to one-lines.
- **PubTables-1M / FinTabNet** (CDLA-Permissive) — table-structure transfer for DI-2 (FinTabNet mimics messy real schedules).
- **VA / USACE / UFGS federal detail libraries** (public domain) — real MEP details + the symbology/layer taxonomy to normalize labels.
- **Wikimedia electrical + P&ID symbol banks** (CC0 / CC BY-SA) — a redistributable labeled symbol dictionary.
- **ResPlan** (MIT) — the only cleanly commercial-open vector+graph floor-plan set.

**Eval-only (non-commercial — run against, never redistribute):** FloorPlanCAD, CubiCasa5K, Digitize-PID, ArchCAD-400K (license unconfirmed).

**Build-our-own (the gap — this is the novel asset):** a real **MEP corpus** — drawings + labeled equipment schedules + symbol legends + one-line connectivity + sequences — annotated from **public-record bid drawing sets** (treat as reference/research inputs; public-record ≠ relicensable) and **public-domain federal details**, with NIST/IFC + Wikimedia symbols as license-clean ground truth. This is where DI-5 and DI-8 (the highest-value suites) come from, because nothing public covers them.

**Synthesize (scale + license-free):** generate synthetic **one-lines, P&IDs, and schedules** with known graph/table ground truth (topology-preserving, à la SynthPID). Synthetic data sidesteps the licensing blocker entirely and gives perfect labels for DI-2/DI-3/DI-4 — pair it with a smaller real, human-verified set to measure the sim-to-real gap.

## Governance (same line we hold everywhere)
- Only public-domain / CC0 / CC-BY / CDLA / MIT data and our own annotations/synthetic enter a **shipped** dataset.
- Non-commercial datasets (FloorPlanCAD, CubiCasa5K, Digitize-PID) are **eval-only**: run against them, report numbers, never redistribute or ship.
- Public-record bid sets are **reference inputs for annotation**, not redistributable assets — we publish our *labels/QA*, not their drawings.
- No copyrighted standard or drawing text is reproduced; cite the symbol concept (a fact) and the legend, not the document.

## Phased build (cheapest, highest-value first)
1. **DI-1 + DI-2** on NIST COBie + public sets + PubTables-1M transfer — classification and schedule extraction are the cheapest to ground and the most immediately useful (schedules → test scope).
2. **DI-3 + DI-4** on CGHD + PID2Graph + synthetic — symbol spotting and one-line/P&ID connectivity (the tracing skill behind L5 integrated tests).
3. **DI-6** sequence extraction with OpenBuildingControl (G36) as gold — feeds the procedure-gen and sequence-verification suites already in `../README.md`.
4. **DI-5 + DI-7 + DI-8** — expert-authored, box-grounded drawing VQA, localization/inventory, and the flagship **cross-document design-review** consistency suite (build-our-own; the hardest and most differentiating).

## The gap, stated plainly
No standardized, real-world, openly-licensed benchmark exists for engineering/construction drawing
understanding, and **none at all for commissioning document intelligence**. One-line diagrams have *no*
public benchmark; P&IDs have only synthetic (Digitize-PID) and one brand-new graph set (PID2Graph);
schedules borrow from financial/scientific tables. That means CxBench's document-intelligence track is
not a re-implementation of an existing benchmark — it's a new one, assembled from proven methods. The
moat is the same as the product's: the labeled, real, commissioning-specific drawing corpus nobody else has.
