/* CX Pro — Blueprint · Integrations — vendor data + brand marks */

window.CXP_INTEGRATIONS = (function(){

/* ─────────── BRAND MARKS (stylized monograms, not actual logos) ─────────── */
// Each is { color: brandColor, mark: SVG content } — designed to be recognizable
// but distinct from official logos. Drawn at 40×40 viewBox.

const M = (color, content, bg) => ({ color, bg: bg || color + "14", mark: content });

const MARKS = {
  procore:  M("#F66200", <text x="20" y="28" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="Archivo, sans-serif" fill="#F66200">p</text>),
  oracle:   M("#C74634", <g><circle cx="20" cy="20" r="14" fill="none" stroke="#C74634" strokeWidth="3.5"/></g>),
  autodesk: M("#0696D7", <g><rect x="6" y="14" width="28" height="12" fill="#0696D7"/><path d="M14 26 L20 14 L26 26" fill="#fff"/></g>),
  bluebeam: M("#0091DA", <g><path d="M8 8 L8 32 L24 32 Q32 32 32 24 Q32 16 24 16 L14 16" fill="none" stroke="#0091DA" strokeWidth="3"/></g>),
  microsoft: M("#5E5CE6", <g><rect x="6" y="6" width="13" height="13" fill="#F25022"/><rect x="21" y="6" width="13" height="13" fill="#7FBA00"/><rect x="6" y="21" width="13" height="13" fill="#00A4EF"/><rect x="21" y="21" width="13" height="13" fill="#FFB900"/></g>),
  teams:    M("#5059C9", <g><rect x="8" y="10" width="20" height="20" rx="2" fill="#5059C9"/><text x="18" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">T</text><circle cx="30" cy="14" r="6" fill="#5059C9"/></g>),
  slack:    M("#4A154B", <g><rect x="8" y="14" width="14" height="4" fill="#36C5F0"/><rect x="14" y="22" width="4" height="14" fill="#2EB67D" transform="translate(-8 -22)"/><rect x="14" y="22" width="14" height="4" fill="#ECB22E" transform="translate(0 0)"/><rect x="22" y="14" width="4" height="14" fill="#E01E5A"/></g>),
  outlook:  M("#0078D4", <g><rect x="6" y="10" width="20" height="20" fill="#0078D4"/><text x="16" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">O</text><rect x="26" y="14" width="8" height="12" fill="#5DADEC"/></g>),
  box:      M("#0061D5", <g><rect x="4" y="14" width="32" height="20" rx="2" fill="#0061D5"/><path d="M4 14 L20 6 L36 14" fill="none" stroke="#0061D5" strokeWidth="2.5"/></g>),
  sharepoint: M("#036C70", <g><circle cx="14" cy="18" r="9" fill="#036C70"/><circle cx="26" cy="22" r="7" fill="#1A9BA1"/></g>),
  onedrive: M("#0364B8", <g><path d="M6 24 Q6 18 12 17 Q14 11 22 12 Q30 11 32 18 Q36 19 36 25 Q36 30 30 30 L12 30 Q6 30 6 24Z" fill="#0364B8"/></g>),
  gdrive:   M("#34A853", <g><path d="M14 6 L26 6 L34 22 L22 22 Z" fill="#FBBC04"/><path d="M14 6 L8 16 L20 36 L26 22 Z" fill="#34A853"/><path d="M22 22 L34 22 L28 32 L16 32 Z" fill="#4285F4"/></g>),
  primavera: M("#C74634", <g><rect x="6" y="14" width="6" height="20" fill="#C74634"/><rect x="14" y="10" width="6" height="24" fill="#C74634"/><rect x="22" y="6" width="6" height="28" fill="#C74634"/><rect x="30" y="18" width="6" height="16" fill="#C74634"/></g>),
  aconex:   M("#C74634", <g><path d="M8 32 L20 8 L32 32 Z" fill="none" stroke="#C74634" strokeWidth="3"/><line x1="13" y1="24" x2="27" y2="24" stroke="#C74634" strokeWidth="2"/></g>),
  msproject: M("#185ABD", <g><rect x="6" y="6" width="28" height="28" rx="2" fill="#185ABD"/><text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">P</text></g>),
  smartsheet: M("#1F95C8", <g><rect x="6" y="6" width="28" height="28" rx="2" fill="#1F95C8"/><path d="M12 14 L28 14 M12 20 L28 20 M12 26 L22 26" stroke="#fff" strokeWidth="2.5"/></g>),
  asta:      M("#003D71", <g><path d="M8 32 L18 10 L24 22 L30 14 L34 32 Z" fill="#003D71"/></g>),
  niagara:   M("#FFB700", <g><circle cx="20" cy="20" r="14" fill="#FFB700"/><path d="M14 14 L26 26 M26 14 L14 26 M20 10 L20 30 M10 20 L30 20" stroke="#1A1A1A" strokeWidth="1.5"/></g>),
  jci:       M("#005EB8", <g><rect x="6" y="6" width="28" height="28" rx="14" fill="#005EB8"/><text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif" letterSpacing="-0.5">JCI</text></g>),
  honeywell: M("#EE2226", <g><circle cx="20" cy="20" r="14" fill="#EE2226"/><text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">H</text></g>),
  schneider: M("#3DCD58", <g><rect x="6" y="6" width="28" height="28" fill="#3DCD58"/><text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">SE</text></g>),
  trane:     M("#003E7E", <g><rect x="6" y="14" width="28" height="12" fill="#003E7E"/><text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif" letterSpacing="2">TRANE</text></g>),
  siemens:   M("#009999", <g><rect x="6" y="6" width="28" height="28" rx="14" fill="#009999"/><text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">SI</text></g>),
  bim360:    M("#0696D7", <g><rect x="6" y="6" width="28" height="28" rx="2" fill="#0696D7"/><text x="20" y="26" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">BIM</text></g>),
  trimble:   M("#0072CE", <g><path d="M20 6 L30 16 L30 28 L20 34 L10 28 L10 16 Z" fill="#0072CE"/><circle cx="20" cy="20" r="5" fill="#fff"/></g>),
  revizto:   M("#1A5DB9", <g><path d="M8 12 Q8 6 14 6 L26 6 Q32 6 32 12 L32 28 Q32 34 26 34 L14 34 Q8 34 8 28 Z" fill="#1A5DB9"/><path d="M14 14 L26 14 L20 28 Z" fill="#fff"/></g>),
  maximo:    M("#0530AD", <g><rect x="6" y="6" width="28" height="28" fill="#0530AD"/><text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">M</text></g>),
  tririga:   M("#0530AD", <g><circle cx="20" cy="20" r="14" fill="none" stroke="#0530AD" strokeWidth="3.5"/><circle cx="20" cy="20" r="6" fill="#0530AD"/></g>),
  accruent:  M("#003D5C", <g><rect x="6" y="20" width="28" height="14" fill="#003D5C"/><path d="M14 20 L20 8 L26 20" fill="none" stroke="#003D5C" strokeWidth="3"/></g>),
  archibus:  M("#1A5490", <g><path d="M6 32 L20 8 L34 32 M12 24 L28 24" fill="none" stroke="#1A5490" strokeWidth="3"/></g>),
  sap:       M("#0FAAFF", <g><rect x="4" y="12" width="32" height="16" fill="#0FAAFF" transform="skewX(-15)"/><text x="22" y="24" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif" letterSpacing="1">SAP</text></g>),
  docusign:  M("#FFCC22", <g><rect x="6" y="6" width="28" height="28" rx="2" fill="#FFCC22"/><text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1A1A1A" fontFamily="Archivo, sans-serif">D</text></g>),
  powerbi:   M("#F2C811", <g><rect x="8" y="22" width="6" height="12" fill="#F2C811"/><rect x="17" y="14" width="6" height="20" fill="#F2C811"/><rect x="26" y="6" width="6" height="28" fill="#F2C811"/></g>),
  tableau:   M("#1F4E79", <g><line x1="20" y1="6" x2="20" y2="34" stroke="#1F4E79" strokeWidth="3"/><line x1="6" y1="20" x2="34" y2="20" stroke="#1F4E79" strokeWidth="3"/><line x1="10" y1="10" x2="30" y2="30" stroke="#1F4E79" strokeWidth="2" opacity="0.6"/><line x1="30" y1="10" x2="10" y2="30" stroke="#1F4E79" strokeWidth="2" opacity="0.6"/></g>),
  snowflake: M("#29B5E8", <g><path d="M20 6 L20 34 M6 20 L34 20 M10 10 L30 30 M30 10 L10 30" stroke="#29B5E8" strokeWidth="2.5"/></g>),
  newforma:  M("#7B287D", <g><rect x="6" y="6" width="28" height="28" fill="#7B287D"/><text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif">N</text></g>),
  ebuilder:  M("#0072CE", <g><rect x="6" y="6" width="28" height="28" rx="2" fill="#0072CE"/><path d="M12 14 L24 14 L24 18 L16 18 L16 19 L22 19 L22 23 L16 23 L16 24 L24 24 L24 28 L12 28 Z" fill="#fff"/></g>),
  hobo:      M("#7AB800", <g><circle cx="20" cy="20" r="14" fill="#fff" stroke="#7AB800" strokeWidth="3"/><text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="900" fill="#7AB800" fontFamily="Archivo, sans-serif">HOBO</text></g>),
  retrotec:  M("#D9252A", <g><rect x="6" y="6" width="28" height="28" fill="#D9252A"/><text x="20" y="25" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" fontFamily="Archivo, sans-serif" letterSpacing="0.5">RTC</text></g>),
  estar:     M("#1B5E96", <g><path d="M20 6 L24 16 L34 16 L26 22 L29 32 L20 26 L11 32 L14 22 L6 16 L16 16 Z" fill="#1B5E96"/></g>),
  api:       M("#1240FF", <g><text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1240FF" fontFamily="JetBrains Mono, monospace">{`{ }`}</text></g>),
  webhook:   M("#5A5A60", <g><path d="M10 18 Q10 10 18 10 Q26 10 26 18 L26 24 Q26 30 32 30" fill="none" stroke="#5A5A60" strokeWidth="2.5"/><circle cx="10" cy="22" r="4" fill="#5A5A60"/><circle cx="32" cy="30" r="4" fill="#5A5A60"/></g>),
  zapier:    M("#FF4F00", <g><path d="M20 4 L20 36 M4 20 L36 20 M8 8 L32 32 M32 8 L8 32" stroke="#FF4F00" strokeWidth="3" strokeLinecap="round"/></g>),
  pwrauto:   M("#0066FF", <g><path d="M22 6 L8 22 L18 22 L14 34 L30 18 L20 18 Z" fill="#0066FF"/></g>),
};

/* ─────────── CATEGORIES ─────────── */
const CATEGORIES = [
  { id: "all", label: "All Integrations" },
  { id: "construction", label: "Construction Mgmt" },
  { id: "docs", label: "Documents & Files" },
  { id: "schedule", label: "Schedule" },
  { id: "bas", label: "BAS · Controls" },
  { id: "bim", label: "BIM · Drawings" },
  { id: "owner", label: "Owner Systems" },
  { id: "comms", label: "Communication" },
  { id: "analytics", label: "Analytics & Data" },
  { id: "field", label: "Field Tools" },
  { id: "dev", label: "Developer" },
];

/* ─────────── INTEGRATIONS ─────────── */
const INTEGRATIONS = [
  // CONNECTED
  { id: "procore", name: "Procore", vendor: "Procore Technologies", cat: "construction", mark: "procore",
    desc: "Two-way sync of issues, observations, RFIs, and drawing markups with the GC's PM platform.",
    status: "connected", since: "Mar 14, 2026", lastSync: "4m ago", records: 1284, healthy: true, popular: true,
    flow: [["Issues", "two-way"], ["Observations", "out"], ["RFIs", "in"], ["Drawings", "in"]] },
  { id: "primavera", name: "Primavera P6", vendor: "Oracle", cat: "schedule", mark: "primavera",
    desc: "Pull schedule activities and push commissioning milestone progress into the master P6 plan.",
    status: "connected", since: "Mar 18, 2026", lastSync: "1h ago", records: 312, healthy: true,
    flow: [["Activities", "in"], ["Milestones", "out"], ["Resources", "in"]] },
  { id: "teams", name: "Microsoft Teams", vendor: "Microsoft", cat: "comms", mark: "teams",
    desc: "Channel notifications for new issues, critical-priority changes, and AI-flagged risk events.",
    status: "connected", since: "Mar 14, 2026", lastSync: "moments ago", records: 2418, healthy: true,
    flow: [["Notifications", "out"], ["Approvals", "two-way"]] },
  { id: "box", name: "Box", vendor: "Box", cat: "docs", mark: "box",
    desc: "Auto-archive issue photos, field reports, and signed checklists to project Box folders.",
    status: "connected", since: "Mar 22, 2026", lastSync: "12m ago", records: 4612, healthy: true,
    flow: [["Files", "out"], ["Folders", "two-way"]] },

  // CONSTRUCTION MGMT
  { id: "autodesk-acc", name: "Autodesk Construction Cloud", vendor: "Autodesk", cat: "construction", mark: "autodesk",
    desc: "Bidirectional sync with ACC issues, sheets, and forms across BIM 360, Build, and Docs.", status: "available", popular: true },
  { id: "newforma", name: "Newforma", vendor: "Newforma", cat: "construction", mark: "newforma",
    desc: "Architect-led PM platform — sync RFIs and submittals from the design team.", status: "available" },
  { id: "ebuilder", name: "e-Builder", vendor: "Trimble", cat: "construction", mark: "ebuilder",
    desc: "Owner-side capital project management. Sync commissioning workflows with the program portfolio.", status: "available" },

  // DOCUMENTS
  { id: "aconex", name: "Aconex", vendor: "Oracle", cat: "docs", mark: "aconex",
    desc: "Document control + transmittals for large EPC projects. Sync drawings and review packages.", status: "available", popular: true },
  { id: "bluebeam", name: "Bluebeam Revu", vendor: "Bluebeam", cat: "docs", mark: "bluebeam",
    desc: "Import/export PDF markups from Studio sessions. Bidirectional issue pin sync.", status: "available", popular: true },
  { id: "sharepoint", name: "SharePoint", vendor: "Microsoft", cat: "docs", mark: "sharepoint",
    desc: "Project file storage and document libraries for owner organizations on M365.", status: "available" },
  { id: "onedrive", name: "OneDrive", vendor: "Microsoft", cat: "docs", mark: "onedrive",
    desc: "Personal/team file storage. Drag-and-drop folder mirror.", status: "available" },
  { id: "gdrive", name: "Google Drive", vendor: "Google", cat: "docs", mark: "gdrive",
    desc: "Storage and collaborative editing for teams running on Workspace.", status: "available" },

  // SCHEDULE
  { id: "msproject", name: "Microsoft Project", vendor: "Microsoft", cat: "schedule", mark: "msproject",
    desc: "Lightweight schedule sync for projects not on Primavera. .mpp import + push.", status: "available" },
  { id: "smartsheet", name: "Smartsheet", vendor: "Smartsheet", cat: "schedule", mark: "smartsheet",
    desc: "Sync work-tracking sheets, Gantt views, and dashboards used by hybrid teams.", status: "available" },
  { id: "asta", name: "Asta Powerproject", vendor: "Elecosoft", cat: "schedule", mark: "asta",
    desc: "Construction-focused scheduling popular in EU and UK rail/infrastructure projects.", status: "beta" },

  // BAS · CONTROLS
  { id: "niagara", name: "Tridium Niagara", vendor: "Tridium / Honeywell", cat: "bas", mark: "niagara",
    desc: "Pull point lists and trend logs directly from Niagara stations. AI auto-maps point names to equipment.", status: "available", popular: true, new: true },
  { id: "metasys", name: "Metasys", vendor: "Johnson Controls", cat: "bas", mark: "jci",
    desc: "JCI's enterprise BAS. Sync point inventory + functional test trends.", status: "available" },
  { id: "honeywell-ebi", name: "EBI Enterprise Buildings", vendor: "Honeywell", cat: "bas", mark: "honeywell",
    desc: "Pull BAS point data, integrate fault detection insights into Cx workflow.", status: "available" },
  { id: "ecostruxure", name: "EcoStruxure Building", vendor: "Schneider Electric", cat: "bas", mark: "schneider",
    desc: "Building Operation + Andover Continuum. Real-time and historical trend pull.", status: "available" },
  { id: "tracer", name: "Tracer SC+", vendor: "Trane", cat: "bas", mark: "trane",
    desc: "Pull Tracer point graphics and AHU-specific sequence data for FPT validation.", status: "available" },
  { id: "desigo", name: "Desigo CC", vendor: "Siemens", cat: "bas", mark: "siemens",
    desc: "Siemens enterprise BAS — full point and trend integration with auto field-mapping.", status: "available" },

  // BIM
  { id: "bim360", name: "BIM 360 / Build", vendor: "Autodesk", cat: "bim", mark: "bim360",
    desc: "Sheet markup sync + 3D model viewer. Tag issues to model elements directly.", status: "available", popular: true },
  { id: "trimble-connect", name: "Trimble Connect", vendor: "Trimble", cat: "bim", mark: "trimble",
    desc: "Federated BIM platform — link CX·Pro equipment records to IFC model objects.", status: "available" },
  { id: "revizto", name: "Revizto", vendor: "Revizto", cat: "bim", mark: "revizto",
    desc: "Issue tracker with 3D model context. Bidirectional issue sync.", status: "beta" },

  // OWNER SYSTEMS
  { id: "maximo", name: "Maximo", vendor: "IBM", cat: "owner", mark: "maximo",
    desc: "Push equipment + warranty data straight into Maximo asset records at project handover.", status: "available", popular: true },
  { id: "tririga", name: "TRIRIGA", vendor: "IBM", cat: "owner", mark: "tririga",
    desc: "IBM's IWMS — building lifecycle, lease, space, and capital project management.", status: "available" },
  { id: "accruent", name: "Accruent Maintenance Connection", vendor: "Accruent", cat: "owner", mark: "accruent",
    desc: "CMMS handover — generate maintenance schedules from commissioned equipment automatically.", status: "available" },
  { id: "archibus", name: "Archibus", vendor: "Eptura", cat: "owner", mark: "archibus",
    desc: "IWMS for higher-ed and healthcare owners. Asset, space, and maintenance.", status: "available" },
  { id: "sap", name: "SAP S/4HANA", vendor: "SAP", cat: "owner", mark: "sap",
    desc: "Push equipment and asset records to SAP PM module. Cost and warranty tracking.", status: "beta" },

  // COMMS
  { id: "slack", name: "Slack", vendor: "Salesforce", cat: "comms", mark: "slack",
    desc: "Channel notifications, slash-commands for status queries, and approvals from threads.", status: "available", popular: true },
  { id: "outlook", name: "Outlook", vendor: "Microsoft", cat: "comms", mark: "outlook",
    desc: "Daily email digest, calendar integration for test schedules, threads to issues.", status: "available" },
  { id: "docusign", name: "DocuSign", vendor: "DocuSign", cat: "comms", mark: "docusign",
    desc: "E-signature for final reports, checklists, and commissioning sign-off packages.", status: "available" },

  // ANALYTICS
  { id: "powerbi", name: "Power BI", vendor: "Microsoft", cat: "analytics", mark: "powerbi",
    desc: "Live dataset connector. Pre-built CX·Pro dashboard templates included.", status: "available", popular: true },
  { id: "tableau", name: "Tableau", vendor: "Salesforce", cat: "analytics", mark: "tableau",
    desc: "Live + extract connectors plus a starter workbook for portfolio-level Cx reporting.", status: "available" },
  { id: "snowflake", name: "Snowflake", vendor: "Snowflake", cat: "analytics", mark: "snowflake",
    desc: "Replicate raw project data to your Snowflake warehouse for custom analytics.", status: "available" },

  // FIELD TOOLS
  { id: "hobo", name: "Onset HOBO", vendor: "Onset Computer", cat: "field", mark: "hobo",
    desc: "Pull temperature/humidity/light logger data directly into trend reports.", status: "available" },
  { id: "retrotec", name: "Retrotec rCloud", vendor: "Retrotec", cat: "field", mark: "retrotec",
    desc: "Envelope testing data — blower door, duct leakage. Auto-attach to checklist lines.", status: "available" },
  { id: "estar", name: "ENERGY STAR Portfolio Manager", vendor: "EPA", cat: "field", mark: "estar",
    desc: "Submit metered energy data and certification packages straight from CX·Pro.", status: "available" },

  // DEVELOPER
  { id: "api", name: "REST API", vendor: "CX·Pro", cat: "dev", mark: "api",
    desc: "Full read/write access to every entity. Filters match the web UI. API key + OAuth2.", status: "connected", since: "Always-on", lastSync: "—", records: 1284902, healthy: true,
    flow: [["Endpoints", "GET/POST/PATCH/DELETE"], ["Auth", "OAuth 2.0 + PAT"]] },
  { id: "webhook", name: "Webhooks", vendor: "CX·Pro", cat: "dev", mark: "webhook",
    desc: "Subscribe to any event — issue.created, checklist.complete, milestone.shift — over HTTPS.", status: "available" },
  { id: "zapier", name: "Zapier", vendor: "Zapier", cat: "dev", mark: "zapier",
    desc: "No-code automations. 8,000+ destination apps with pre-built triggers & actions.", status: "available", popular: true },
  { id: "pwrauto", name: "Power Automate", vendor: "Microsoft", cat: "dev", mark: "pwrauto",
    desc: "Build flows across M365, SharePoint, Teams, and CX·Pro with low-code connectors.", status: "available" },
];

return { MARKS, CATEGORIES, INTEGRATIONS };
})();
