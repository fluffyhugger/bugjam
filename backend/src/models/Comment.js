import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    bug: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
