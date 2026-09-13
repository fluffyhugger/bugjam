import mongoose from "mongoose";
import { SEVERITIES, PRIORITIES, computePriorityLevel } from "../utils/priorityMatrix.js";
import { nextSequence } from "./Counter.js";

const BUG_TYPES = ["Functional", "UI/UX", "Performance", "Security", "Data", "Compatibility", "Other"];
const STATUSES = ["Open", "In Progress", "In Review", "Resolved", "Verified", "Reopened", "Closed"];
const ELEVATED_ONLY_STATUSES = ["Verified", "Reopened"];
const PRIORITY_LEVELS = ["P0", "P1", "P2", "P3", "P4"];

const attachmentSchema = new mongoose.Schema(
  {
    objectKey: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LINK_TYPES = ["duplicate-of", "duplicated-by", "blocks", "blocked-by", "relates-to"];
const INVERSE_LINK = {
  "duplicate-of": "duplicated-by",
  "duplicated-by": "duplicate-of",
  blocks: "blocked-by",
  "blocked-by": "blocks",
  "relates-to": "relates-to",
};

const linkSchema = new mongoose.Schema(
  {
    type: { type: String, enum: LINK_TYPES, required: true },
    bug: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true },
  },
  { _id: false }
);

const bugSchema = new mongoose.Schema(
  {
    bugId: { type: String, unique: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    module: { type: String, default: "" },
    foundInVersion: { type: String, default: "" },
    fixedInVersion: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    stepsToReproduce: { type: [String], default: [] },

    severity: { type: String, enum: SEVERITIES, required: true },
    priority: { type: String, enum: PRIORITIES, required: true },
    priorityLevel: { type: String, enum: PRIORITY_LEVELS },

    bugType: { type: String, enum: BUG_TYPES, required: true },
    status: { type: String, enum: STATUSES, default: "Open" },

    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    attachments: { type: [attachmentSchema], default: [] },
    links: { type: [linkSchema], default: [] },
  },
  { timestamps: true }
);

bugSchema.pre("save", async function computeFields(next) {
  if (this.isModified("severity") || this.isModified("priority") || this.isNew) {
    this.priorityLevel = computePriorityLevel(this.severity, this.priority);
  }
  if (this.isNew && !this.bugId) {
    // Ids are sequential per project, so each project counts from its own 0001.
    const project = await mongoose.model("Project").findById(this.project).select("key");
    const key = project?.key || "BUG";
    const seq = await nextSequence(`bugId:${key}`);
    this.bugId = `${key}-${String(seq).padStart(4, "0")}`;
  }
  next();
});

export { BUG_TYPES, STATUSES, PRIORITY_LEVELS, ELEVATED_ONLY_STATUSES, LINK_TYPES, INVERSE_LINK };
export default mongoose.model("Bug", bugSchema);
