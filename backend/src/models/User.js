import mongoose from "mongoose";

const AVATAR_COLORS = ["#FFD400", "#FF4FA3", "#3DDC97", "#4F86FF", "#FF7A45"];
export const ROLES = ["Reporter", "Developer", "Head of QA", "Admin"];
export const ELEVATED_ROLES = ["Head of QA", "Admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "Reporter" },
    avatarColor: {
      type: String,
      default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatarColor: this.avatarColor,
  };
};

export default mongoose.model("User", userSchema);
