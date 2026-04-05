import mongoose, { Schema, type Document } from "mongoose";

export type PreferredJobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export type PreferredWorkMode = "REMOTE" | "HYBRID" | "ONSITE";

interface IExperience {
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

interface IEducation {
  degree: string;
  institution: string;
  year: number;
}

export interface ICandidateProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  experienceYears?: number;
  skills: string[];
  experience: IExperience[];
  education: IEducation[];
  resumeUrl?: string;
  resumeText?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  preferredJobType?: PreferredJobType;
  preferredWorkMode?: PreferredWorkMode;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const experienceSchema = new Schema<IExperience>(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const educationSchema = new Schema<IEducation>(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
  },
  { _id: false },
);

const candidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    headline: { type: String, trim: true },
    summary: { type: String, trim: true },
    experienceYears: { type: Number, min: 0 },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    resumeUrl: { type: String, trim: true },
    resumeText: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    preferredJobType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
    },
    preferredWorkMode: {
      type: String,
      enum: ["REMOTE", "HYBRID", "ONSITE"],
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CandidateProfile = mongoose.model<ICandidateProfile>(
  "CandidateProfile",
  candidateProfileSchema,
);
