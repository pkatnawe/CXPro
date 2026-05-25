# CXPro

CXPro is an AI-native commissioning platform for capital construction projects. This glossary defines the canonical domain language shared across all 12 bounded contexts. For architecture, aggregates, and events see [docs/architecture.md](docs/architecture.md).

## Language

### Project & Portfolio

**Project**:
A single capital-construction engagement with a defined start, end, and discipline scope. Aggregate root of this context.

**DisciplineScope**:
The slice of a Project owned by one engineering discipline (Mechanical, Electrical, Controls, General Construction). A Project always has at least one.
_Avoid_: Trade, division.

**Milestone**:
A schedule checkpoint, either project-level or discipline-level, that triggers downstream events when reached.

**Mobilization**:
The act of standing up a Project on site — crews, equipment, and site offices arrive and work can begin.

**Substantial Completion**:
The contractual point at which the Owner can take beneficial use of the facility even though punch items remain. Distinct from Final Acceptance.

**Closeout**:
The phase after Substantial Completion in which remaining punch, dossiers, warranties, and training are delivered until Final Acceptance.

**Campus**:
A collection of related Projects on a shared physical site. Stubbed for Year 2.

### Commissioning Execution

**TestProcedureTemplate**:
A reusable, typed definition of a commissioning test at a specific level (L1–L5).

**TestProcedureInstance**:
A single execution of a Template against an Asset or System. One aggregate covers both checklists and tests; the `level` field differentiates them.
_Avoid_: Checklist (as a separate concept), Test record.

**TestResult**:
The outcome of running a TestProcedureInstance. Multiple results may exist per instance to capture retest history.

**WitnessSession**:
A batched event in which a qualified witness signs off one or more TestResults at once.

**Signature**:
A cryptographically bound attestation by a named party that a step, result, or session is accepted.

**L1 / L2 / L3 / L4 / L5**:
The commissioning levels — Factory Witness (L1), Pre-Functional Checklist (L2), Start-Up (L3), Functional Performance Test (L4), Integrated Systems Test (L5).

### Issue & RFI Management

**Deviation**:
A recorded departure from design intent or specification, raised during execution. Often the upstream cause of an RFI or ChangeOrder.
_Avoid_: Defect, nonconformance.

**RFI** (Request for Information):
A project-level question raised by the Construction Manager that can affect multiple disciplines and requires a written answer.

**PunchItem**:
A discrete remaining-work item identified before or after Substantial Completion. Classified as **Substantial** (blocks acceptance) or **Cosmetic** (does not).
_Avoid_: Snag, defect.

**ChangeOrder**:
An approved modification to scope, cost, or schedule. The workflow lives in this context; the dollar impact mirror lives in Cost & Commercial as `ChangeOrderCommercial`.

**Submittal**:
A vendor-produced document (shop drawing, product data, sample) requiring review and approval. The PDF lives in Document & Knowledge; the workflow lives here.

**Triage**:
The act of classifying a newly raised Deviation/RFI/PunchItem and routing it to the responsible party.

**Route**:
Assign an issue to the next responsible role for action.

**Accepted as built**:
A resolution path where a Deviation is approved as the new design of record without rework.

**RFI turn-around time**:
The elapsed time between RFI submission and answer; a primary CM KPI.

### Asset Registry

**Asset**:
A single physical or logical piece of equipment — the atom of commissioning. Every test ultimately targets an Asset or a System of Assets.
_Avoid_: Equipment record, piece, unit.

**System**:
A logical grouping of Assets that function together (e.g., AHU + ductwork + VAV boxes). Many-to-many with Asset.

**Space**:
A recursive location hierarchy with project-configurable level naming (Building → Floor → Room, or Campus → Building → Wing, etc.).
_Avoid_: Location, room, zone (when used as a synonym).

**AssetType**:
A catalog template describing the expected attributes, tests, and dossier requirements for a class of Asset.

**Tag**:
The project-unique human-readable identifier for an Asset (e.g., `AHU-42`).

**Serial**:
The manufacturer-assigned identifier on the nameplate, distinct from the Tag.

**Nameplate data**:
Specifications stamped on the equipment by the manufacturer (model, serial, ratings).

**Energized**:
Asset state indicating power has been applied; unlocks L3 Start-Up tests.

**Beneficial Use**:
The state in which the Owner is using the Asset operationally, even if commissioning is not formally complete.

**Spare**:
An Asset held in reserve, not in active service.

### Document & Knowledge

**Document**:
An uploaded file with a typed role (drawing, spec, submittal_pdf, opr, bod, sequence_of_operations, cut_sheet, o_and_m_manual, photo, datalog, schedule_xlsx, report).

**DocumentVersion**:
A revision of a Document. Tests and citations always reference a specific version, not the Document alone.
_Avoid_: Rev, draft.

**DocumentChunk**:
An embedded segment of a DocumentVersion stored in pgvector with page-coordinate metadata for deep-linking.

**ExtractedSpec**:
Structured data parsed out of a Document by type-specific extractors.

**KnowledgePack**:
A curated bundle of DocumentChunks and ExtractedSpecs assembled to ground a single AgentRun.

**Markup**:
A first-class annotation drawn on a drawing (not a comment, not a redline thread).

**Revision**:
A formally numbered version of a Document.

**As-built**:
A DocumentVersion that reflects what was actually constructed, distinct from the design-intent version.

**Submittal log**:
The project-wide tracker of all Submittal workflows.

**Cited from**:
The grounding relationship: an AI claim links to a DocumentChunk that supports it.

### Handover & Compliance

**TurnoverPackage**:
An audit-ready bundle of test records, documents, warranties, and training that constitutes formal handover for a System or Project.
_Avoid_: TOP, handover binder.

**Dossier**:
Synonym for TurnoverPackage when referring to a per-System bundle. Used interchangeably in conversation; prefer **TurnoverPackage** in code.

**WarrantyRecord**:
A captured manufacturer warranty for an Asset or System, with start date, term, and conditions.

**TrainingRecord**:
Evidence that Owner personnel were trained on a System, with attendees and material references.

**ComplianceMapping**:
The link between a TestStep and one or more regulatory Citations.

**RegulatoryFramework**:
A versioned, jurisdiction-tagged body of standards (ASHRAE 202, NFPA 72, OBC 2025, LEED v4.1).

**OwnerAcceptance**:
The Owner's formal sign-off on a TurnoverPackage; triggers billing, warranty start, and project closeout.

**AHJ** (Authority Having Jurisdiction):
The regulatory body whose inspector must approve work for a given code area.

**AHJInspection**:
A formal inspector visit recorded as a domain event.

**Citation**:
A pointer from a claim, AI output, or compliance mapping back to its supporting source (DocumentChunk or RegulatoryFramework clause).

**Final Acceptance**:
The contractual end-state of a Project; warranties begin in earnest, retention releases.

**Punch closure**:
The completion of all PunchItems required for Final Acceptance.

**Conditional acceptance**:
Owner acceptance contingent on closure of specific remaining items.

### Workforce & Scheduling

**Crew**:
A unit of field workforce, owned by one Organization, assignable to work.

**CrewMember**:
An individual within a Crew, with skills and certifications. In MVP, certification gaps **warn but do not block** assignment.

**Assignment**:
A scheduled unit of work × crew × time window.
_Avoid_: Task, ticket.

**ScheduledEvent**:
A planned non-work calendar item (witness, AHJ visit, training, vendor visit).

**DowntimeWindow**:
A **planned** outage during which Assets/Systems are unavailable. Distinct from an **outage** (unplanned).

**Resource**:
A planning constraint that is not a person — calibrated instruments, load banks, lifts.

**Alert**:
A CM-defined rule that fires when scheduling conditions are met or threatened.

**Availability**:
A CrewMember's bookable time, net of PTO/holidays/other Assignments.

**Dispatch**:
The act of activating a planned Assignment so the crew can begin.

**Look-ahead**:
A forward-window planning view (typically 1–3 weeks).

**Float / slack**:
Schedule buffer between an Assignment and its dependent successor.

**Critical path**:
The chain of Assignments whose slip will slip the Project.

**Tag-out / LOTO**:
Lock-Out / Tag-Out — the safety procedure for de-energizing an Asset before work. A safety-critical event requiring Acknowledgment.

**Standby**:
A crew state of being on-site but not actively working an Assignment.

### Analytics & Reporting

**Dashboard**:
A persona-tied collection of Widgets persisted as an aggregate.

**Widget**:
A single visual unit on a Dashboard (chart, KPI tile, list, etc.).

**KPIDefinition**:
An org-configurable formula behind a metric — "% Complete" means whatever the org defines it to mean.

**MetricSnapshot**:
A point-in-time captured value of a KPIDefinition, for historical trending.

**SavedQuery**:
A reusable parameterized query that can back Widgets or AI-generated reports.

**ReportTemplate**:
A composable definition of a report, white-labelled per `BrandingProfile`.

**ReportInstance**:
An immutable generated report, archived as a Document.

**Burndown**:
A chart of remaining work over time.

**S-curve**:
A cumulative-progress curve typical of construction earned-value reporting.

**Drill-down**:
The interaction of navigating from a summary metric to its constituent records.

**Snapshot**:
A frozen view of state at a point in time.

**Rollup**:
The aggregation of detail records up a hierarchy (Asset → System → Project).

### AI & Conversation

**Agent**:
A capability definition with persona affinity, tools, model preference, and safety policy. The "what" of an AI capability.
_Avoid_: Bot, assistant, copilot.

**AgentRun**:
An immutable audit record of a single Agent invocation. Backs `actor_type: ai` in the system-wide audit log.

**Conversation**:
A multi-turn interaction auto-scoped to a Project / System / Asset / Deviation per UI entry point.

**Message**:
A single turn within a Conversation.

**Tool**:
An addressable, typed-I/O action that an Agent may invoke, governed by a permission policy.

**ToolCall**:
A specific invocation of a Tool by an Agent within an AgentRun.

**AgentPolicy**:
The per-role rules governing which Agents/Tools a user may invoke and which require confirmation.

**Confirmation gate**:
A required human approval before an AI-proposed ToolCall changes system state.

**Grounding**:
The practice of binding AI claims to retrieved evidence (DocumentChunks, structured data). Required for non-trivial outputs.

**Hallucination**:
An AI claim not supported by Grounding. The thing Citations exist to prevent.

**Run**:
Short for AgentRun in conversation.

**Session**:
Short for Conversation in conversation.

**Eval** / **EvalRun**:
A periodic quality measurement of an Agent against a labelled test set.

**FeedbackRecord**:
A captured user correction of an AI output, feeding DSPy optimization. The data network effect lives here.

### Identity & Access

**User**:
A human identity.

**Organization**:
A typed corporate identity (Owner, GC, CxConsultant, Subcontractor, Designer, Vendor, AHJ, InternalCXPro).

**Membership**:
The User × Organization relationship.

**ProjectParticipation**:
The Organization × Project × Role-in-project relationship.

**UserProjectAssignment**:
The User × Project × Role × DisciplineScope(s) × authority relationship. The keystone of project-level access. Implemented as a logical aggregate spanning two physical tables: `participations` (User × Project — the project-level RLS gate) and `assignments` (User × DisciplineScope — the discipline seat). Treat as one concept in domain conversation; the two-table shape is an implementation detail.

**Role**:
A named bundle of Permissions assignable to a user in a project.

**Permission**:
An atomic capability (`read:Asset`, `propose:TestStep`, etc.).

**ApiKey** / **ServiceAccount**:
Non-human identities for integrations and external MCP clients.

**BrandingProfile**:
Per-Organization white-labelling config used by ReportTemplate rendering.

**AuditLogEntry**:
A system-wide immutable record of every state transition. The compliance moat.

**Party**:
A generic term for any participant (User, Organization, ServiceAccount) in a domain event.

**Seat**:
A user's *assignment* on a Project, not a license. CXPro is **per-project tier, unlimited users** — never gate features by seat count.
_Avoid_: License, head, user slot (when implying billing).

**Loaned**:
A CrewMember temporarily assigned across Organizations on a specific Project.

**Delegate**:
A User authorized to act on behalf of another in defined scopes.

**Service account**:
Synonym for ServiceAccount; the non-human identity behind an integration.

### Notification & Inbox

**Subscription**:
A User × EventTopic × DeliveryPreference rule, auto-provisioned by role + project participation.

**Notification**:
An immutable delivered message *for awareness*. Surface: Feed.

**InboxItem**:
A persisted item *requiring action*, distinct from a Notification, that lives until resolved. Surface: To-Do.
_Avoid_: Task (overloads Assignment), todo (informal only).

**DeliveryChannel**:
Where a Notification is delivered: `in_app`, `email`, `sms`, `push`, `slack`, `teams`.

**Digest**:
A scheduled batched delivery of Notifications.

**DigestSchedule**:
The configuration for when a Digest fires for a Subscription.

**Escalation**:
The action of routing an unactioned InboxItem to the next-level role on SLA breach.

**Acknowledgment**:
A required user confirmation for safety-critical events (DowntimeWindow, LOTO).

**Inbox**:
The To-Do surface — the default landing in the UI.

**Quiet hours**:
A User's preferred no-delivery window.

**SLA**:
A response-time commitment; breach drives Escalation.

**Deep-link**:
A URL that opens directly to the in-app context that produced a Notification.

### Cost & Commercial

**Contract**:
The commercial agreement between two parties, with lifecycle `drafted → executed → active → amended → closed`. Visible only to the two contracting parties by default.

**Contract type**:
The pricing model of a Contract — **fixed price**, **T&M** (time and materials), **cost-plus**, or **GMP** (guaranteed maximum price).

**BillingMilestone**:
A condition that, when triggered by a domain event from another context (e.g., `WitnessSessionSigned`), earns invoiceable revenue.

**Invoice**:
A draft or submitted request for payment against a Contract, pushed to external AR (Procore Financials, NetSuite, QuickBooks).

**ChangeOrderCommercial**:
The dollar-impact mirror of an Issue & RFI ChangeOrder.

**Retention**:
The portion of an Invoice withheld pending performance, released at Final Acceptance or per contract.

**LaborCostEntry**:
A cost record derived from an `AssignmentCompleted` event. Visible only to the source Organization.

**BudgetLine**:
A planned cost category, visible to OCA + Owner by default.

**Forecast** / **Estimate-at-Completion (EAC)**:
The projected final cost of a scope based on current performance.

**Cost-to-Complete (CTC)**:
The remaining forecast cost from now to completion.

**Earned value**:
The dollar value of completed work measured against budget.

**Margin**:
Revenue minus cost on a Contract or scope.

**Variance**:
The delta between planned and actual (cost or schedule).

**PurchaseOrder**:
A commitment to a vendor; deferred to Year 2.

## Flagged ambiguities

- **Task** is ambiguous: in Workforce it could refer to Assignment, in Notification it could refer to InboxItem. Resolution: never use "Task" in code or canonical writing — use **Assignment** or **InboxItem**.
- **Account** is ambiguous: it could refer to User, Organization, or Membership. Resolution: never use "Account" — use **User**, **Organization**, or **Membership**.
- **Dossier** vs **TurnoverPackage**: same concept; conversational use is fine for **Dossier**; code and APIs use **TurnoverPackage**.
- **Outage** vs **DowntimeWindow**: a **DowntimeWindow** is planned; an **outage** is unplanned. They are not synonyms.
- **Substantial Completion** vs **Final Acceptance**: not the same milestone. Substantial Completion enables Beneficial Use and triggers warranty starts for accepted scope; Final Acceptance closes the Contract.

## Example dialogue

**Dev:** A field tech marked an L4 test step as failed on AHU-42. What's the chain?

**Domain expert:** The TestResult flips to failed on that TestProcedureInstance. Because it's L4, a Deviation will usually be raised — but only if the failure indicates departure from design intent. A bad calibration is a retest, not a Deviation.

**Dev:** And if it is a Deviation?

**Domain expert:** Then Issue & RFI Management owns the workflow from there. The CM Triages it. If the answer needs design input, the Deviation spawns an RFI. If the resolution costs money or moves the schedule, the RFI ends in a ChangeOrder. The ChangeOrder lives in Issue & RFI; the dollar impact mirrors as a ChangeOrderCommercial in Cost & Commercial.

**Dev:** What stops the BillingMilestone from earning?

**Domain expert:** The BillingMilestone is bound to `WitnessSessionSigned`, not `TestResultCompleted`. The failed result blocks the WitnessSession from being signed, so the Milestone doesn't earn. That's by design — we don't want to invoice against a failed L4.

**Dev:** And if the Owner says "ship it as-is, accept the Deviation"?

**Domain expert:** Then the Deviation resolves as **Accepted as built**. The original TestResult stays failed in history — we never overwrite — but a new TestResult is recorded reflecting the as-built state, and the WitnessSession can be signed against that. The Deviation closure feeds the TurnoverPackage Dossier with a Citation so the regulator can see exactly what was accepted and why.
