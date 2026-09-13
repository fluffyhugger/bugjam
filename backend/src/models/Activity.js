import mongoose from "mongoose";

export const ACTIVITY_TYPES = [
  "created",
  "status",
  "assignee",
  "severity",
  "priority",
  "priorityLevel",
  "field",
  "attachment",
  "link",
];

const activitySchema = new mongoose.Schema(
  {
    bug: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    field: { type: String, default: "" },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
