// DESIGN PREVIEW — mocked; delete when backend ships

import issuesData from "./issues.json";
import filesData from "./files.json";
import rfisData from "./rfis.json";
import historyData from "./history.json";
import milestonesData from "./milestones.json";
import partiesData from "./parties.json";
import submittalsData from "./submittals.json";

export interface PreviewIssue {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  opened_at: string;
  owner_initials: string;
}

export interface PreviewFile {
  name: string;
  kind: string;
  size: string;
  uploaded_at: string;
}

export interface PreviewRFI {
  number: string;
  subject: string;
  status: "open" | "answered" | "in-review";
  opened: string;
  due: string;
}

export interface PreviewHistoryEntry {
  timestamp: string;
  actor_initials: string;
  action: string;
  target: string;
}

export function getPreviewIssues(): PreviewIssue[] {
  return issuesData as PreviewIssue[];
}

export function getPreviewFiles(): PreviewFile[] {
  return filesData as PreviewFile[];
}

export function getPreviewRFIs(): PreviewRFI[] {
  return rfisData as PreviewRFI[];
}

export function getPreviewHistory(): PreviewHistoryEntry[] {
  return historyData as PreviewHistoryEntry[];
}

export interface PreviewMilestone {
  label: string;
  date: string;
  status: "done" | "target";
}

export interface PreviewParty {
  role: string;
  company: string;
  person: string;
  initials: string;
  tone: string;
}

export interface PreviewSubmittal {
  number: string;
  title: string;
  status: string;
  tone: string;
}

export function getPreviewMilestones(): PreviewMilestone[] {
  return milestonesData as PreviewMilestone[];
}

export function getPreviewParties(): PreviewParty[] {
  return partiesData as PreviewParty[];
}

export function getPreviewSubmittals(): PreviewSubmittal[] {
  return submittalsData as PreviewSubmittal[];
}
