# CxBench — item schema

Every CxBench item is one JSON object on one line (JSONL). Items are **our original work**,
authored from `../../study-notes/` (our knowledge base). They never reproduce copyrighted
standard text or third-party document text. Public specs/datasets are referenced by pointer,
not copied. Items are **held out** from any grounding corpus.

## Common fields (all suites)

| Field | Type | Notes |
|---|---|---|
| `id` | string | `kqa-cxe-001`, `pg-cxe-001`, … (suite-role-NNN) |
| `suite` | string | `knowledge-qa` · `procedure-gen` · `traceability` · `standards` · `faithfulness-refusal` |
| `role` | string | `cx_engineer` · `oca` · `construction_manager` · `field_technician` · `design_engineer` · `owner_fm` |
| `level` | string | `L1`–`L5`, or `process` / `NA` |
| `document` | string | `OPR`·`BoD`·`CxPlan`·`SOO`·`Checklist`·`FPT`·`IssuesLog`·`SystemsManual`·`CxReport`·`NA` |
| `topic` | string | short slug, e.g. `functional-testing`, `deviations`, `power-chain` |
| `difficulty` | string | `easy` · `medium` · `hard` |
| `type` | string | `mcq` · `short` · `procedure` |
| `citation` | object | `{ "source": "<study-notes filename>", "anchor": "<section text>" }` — where the answer is grounded |
| `verified` | bool | `false` until a commissioning SME signs off (the human gate from the plan) |
| `reviewer` | string\|null | SME initials once verified |

## Suite-specific fields

**`knowledge-qa`, `type: mcq`**
```json
{"type":"mcq","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","rationale":"..."}
```

**`knowledge-qa` / `standards` / `traceability`, `type: short`**
```json
{"type":"short","question":"...","reference_answer":"...","key_points":["...","..."]}
```
`key_points` are the strings a correct answer must cover (used by the rubric grader).

**`procedure-gen`, `type: procedure`**
```json
{"type":"procedure","system":"AHU SAT control with economizer",
 "input":{"spec_excerpt":"<original paraphrase>","soo_excerpt":"<original paraphrase>"},
 "rubric":{"must_cover":["objective","prerequisites","steps","what to record","pass/fail acceptance"],
           "expected_points":["...","..."],"citation_required":true},
 "reference_pointer":"04-functional-test-library.md (AHU/VAV)"}
```

## Example (verified=false until SME review)
```json
{"id":"kqa-cxe-001","suite":"knowledge-qa","role":"cx_engineer","level":"process","document":"OPR","topic":"traceability","difficulty":"easy","type":"mcq","question":"Against which document is every commissioning test ultimately measured?","options":{"A":"The Basis of Design","B":"The Owner's Project Requirements","C":"The equipment O&M manual","D":"The construction schedule"},"answer":"B","rationale":"The OPR is the anchor of the document chain; if a target isn't measurable in the OPR it can't be tested later.","citation":{"source":"01-commissioning-process.md","anchor":"The document chain"},"verified":false,"reviewer":null}
```
