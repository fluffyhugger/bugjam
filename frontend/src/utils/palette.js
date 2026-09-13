export const SEVERITY_COLORS = {
  Blocker: "#FF4FA3",
  Critical: "#FF7A45",
  Major: "#FFD400",
  Minor: "#3DDC97",
  Trivial: "#D9D9D9",
};

export const PRIORITY_COLORS = {
  Urgent: "#FF4FA3",
  High: "#FF7A45",
  Medium: "#FFD400",
  Low: "#3DDC97",
};

export const STATUS_COLORS = {
  Open: "#4F86FF",
  "In Progress": "#FFD400",
  "In Review": "#FF7A45",
  Resolved: "#3DDC97",
  Verified: "#4F86FF",
  Reopened: "#FF4FA3",
  Closed: "#D9D9D9",
};

export const LEVEL_META = {
  P0: { bg: "#FF4FA3", emoji: "🔥", label: "drop everything" },
  P1: { bg: "#FF7A45", emoji: "⚡", label: "very soon" },
  P2: { bg: "#FFD400", emoji: "⏳", label: "this sprint" },
  P3: { bg: "#3DDC97", emoji: "🌱", label: "whenever" },
  P4: { bg: "#D9D9D9", emoji: "💤", label: "someday" },
};

export const LEVEL_COLORS = Object.fromEntries(
  Object.entries(LEVEL_META).map(([k, v]) => [k, v.bg])
);

// Chart tokens. Both validated with the dataviz validator against the cream
// surface (#FBF6EC): ACCENT as a categorical slot, HEAT_RAMP as an ordinal ramp.
export const CHART_SURFACE = "#FBF6EC";
export const CHART_ACCENT = "#4F86FF";
export const CHART_MUTED = "#161616";
export const HEAT_RAMP = ["#8AB0FF", "#5B90FB", "#3B72E8", "#2454BF", "#163A85"];

export const ROLE_COLORS = {
  Reporter: "#D9D9D9",
  Developer: "#4F86FF",
  "Head of QA": "#FFD400",
  Admin: "#FF4FA3",
};
