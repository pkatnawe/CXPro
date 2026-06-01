// DESIGN PREVIEW — mocked; delete when backend ships

import issuesData from "./issues.json";
import filesData from "./files.json";
import rfisData from "./rfis.json";
import historyData from "./history.json";

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
