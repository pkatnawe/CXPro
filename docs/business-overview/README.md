# Business Overview Site — INTERNAL

This site is the business↔engineering alignment artifact (the "living document"). It deliberately mixes
customer-facing narrative with internal strategy: competitive white-space analysis, integration sequencing,
self-graded sources, and frontier bets — content that must not reach competitors or prospects as-is.

**Rule: do not deploy or share this site in its current form.** If a customer/investor-facing version is
needed, fork `index.html`, `how-it-works.html`, `ai.html`, `features.html`, and `glossary.html`, and strip:
the entire `ai-strategy.html` page, competitor commentary, source self-grading meta-commentary, and any
roadmap detail you wouldn't put in a competitor's hands.

Serve locally: `python3 -m http.server 8765` from this directory, or just `open index.html`.
