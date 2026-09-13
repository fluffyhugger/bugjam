export const SEVERITIES = ["Blocker", "Critical", "Major", "Minor", "Trivial"];
export const PRIORITIES = ["Urgent", "High", "Medium", "Low"];

// Severity (row) x Priority (column) -> triage Priority Level.
const MATRIX = {
  Blocker: { Urgent: "P0", High: "P0", Medium: "P1", Low: "P1" },
  Critical: { Urgent: "P0", High: "P1", Medium: "P1", Low: "P2" },
  Major: { Urgent: "P1", High: "P1", Medium: "P2", Low: "P2" },
  Minor: { Urgent: "P2", High: "P2", Medium: "P3", Low: "P3" },
  Trivial: { Urgent: "P3", High: "P3", Medium: "P4", Low: "P4" },
};

export function computePriorityLevel(severity, priority) {
  return MATRIX[severity]?.[priority] || "P4";
}
