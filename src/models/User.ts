import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "candidate" | "recruiter" | "orgadmin" | null;
  organizationId: mongoose.Types.ObjectId | null;
  isOrgAdmin: boolean;
}

// Maps to the existing "user" collection managed by Better Auth
const userSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "orgadmin", null],
      default: null,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    isOrgAdmin: { type: Boolean, default: false },
  },
  { collection: "user", strict: false },
);

export const User = mongoose.model<IUser>("User", userSchema);
