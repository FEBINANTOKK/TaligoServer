import mongoose, { Schema, type Document } from "mongoose";

export type EmployerRole = "RECRUITER" | "ORG_ADMIN";

export interface IEmployerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  role: EmployerRole;
  name: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  organizationId?: mongoose.Types.ObjectId;
  organizationName?: string;
  department?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  skills: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["RECRUITER", "ORG_ADMIN"],
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    organizationName: { type: String, trim: true },
    department: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    skills: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const EmployerProfile = mongoose.model<IEmployerProfile>(
  "EmployerProfile",
  employerProfileSchema,
);
