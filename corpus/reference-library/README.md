# Reference Library

Local study/reference copies of commissioning and data-center texts. Organized for human reading and research — **not** an approved product-grounding corpus.

> ⚠️ **The PDFs in this folder are git-ignored on purpose.** They are copyrighted books obtained from a third-party source (filenames indicated a shadow-library origin). They are kept here for the team to **study**; they are **not** committed to version control and must **not** be embedded into the customer-facing agent corpus or otherwise redistributed. See the licensing section of `docs/business-overview/agent-training.html` for the rule we hold: public-domain federal/lab sources and the customer's own documents are ingestable; copyrighted texts are cite-only unless properly licensed.

## Contents

| File | Topic | Author | Status |
|---|---|---|---|
| `commissioning/hvac-commissioning-guidebook-virta.pdf` | HVAC commissioning process & practice | Maija Virta (REHVA) | Copyrighted — local study only |
| `data-center/handbook-of-data-center-management-bradley.pdf` | Data-center operations & management | Wayne C. Bradley | Copyrighted — local study only |
| `data-center/data-center-handbook-geng.pdf` | Data-center design/build/operate (broad reference) | Hwaiyu Geng (Wiley) | Copyrighted — local study only |
| `data-center/infrastructure-architecture-essentials-kambhampaty.pdf` | DC & cloud infrastructure architecture | Shankar Kambhampaty | Copyrighted — local study only |

## How to use these

- ✅ **Read them** to learn the body of knowledge (especially the Virta HVAC Commissioning Guidebook — directly relevant to the exams and the product).
- ✅ **Take notes / paraphrase** insights into our own materials (the Study Guide page, internal notes). Facts and process knowledge aren't copyrightable; the specific expression is.
- ❌ **Do not** copy their text into the `document_chunks` store or any agent-grounding corpus.
- ❌ **Do not** commit the PDFs or redistribute them.

## For actual agent grounding

Use the **public-domain Layer A** corpus from the training plan instead — PNNL, GSA, FEMP, LBNL, NIST guides cover the same commissioning process and are free to ingest. If a copyrighted text is genuinely needed in-product, acquire a proper license (e.g., ASHRAE redistribution) or cite-and-link to the customer's own copy. See `docs/business-overview/agent-training.html` and `docs/business-overview/study-guide.html`.
