import { describe, it, expect } from "vitest";
import { computePriorityLevel, SEVERITIES, PRIORITIES } from "../src/utils/priorityMatrix.js";

// The full published matrix — this table is the contract the README documents.
const EXPECTED = {
  Blocker: { Urgent: "P0", High: "P0", Medium: "P1", Low: "P1" },
  Critical: { Urgent: "P0", High: "P1", Medium: "P1", Low: "P2" },
  Major: { Urgent: "P1", High: "P1", Medium: "P2", Low: "P2" },
  Minor: { Urgent: "P2", High: "P2", Medium: "P3", Low: "P3" },
  Trivial: { Urgent: "P3", High: "P3", Medium: "P4", Low: "P4" },
};

describe("priority matrix", () => {
  for (const severity of SEVERITIES) {
    for (const priority of PRIORITIES) {
      it(`${severity} × ${priority} → ${EXPECTED[severity][priority]}`, () => {
        expect(computePriorityLevel(severity, priority)).toBe(EXPECTED[severity][priority]);
      });
    }
  }

  it("falls back to P4 for unknown combinations", () => {
    expect(computePriorityLevel("Nonsense", "High")).toBe("P4");
    expect(computePriorityLevel("Major", "Whenever")).toBe("P4");
  });

  it("covers every severity and priority the model accepts", () => {
    expect(SEVERITIES).toHaveLength(5);
    expect(PRIORITIES).toHaveLength(4);
  });
});
