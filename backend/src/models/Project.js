import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z][A-Z0-9]{1,5}$/, "key must be 2-6 uppercase letters/digits starting with a letter"],
    },
    // The individual sites/apps inside this project, e.g. WEB → ["Shop", "Blog"].
    modules: { type: [String], default: [] },
    versions: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
