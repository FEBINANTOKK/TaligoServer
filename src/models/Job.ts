import mongoose, { Schema, type Document } from "mongoose";

export type JobStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";

export interface IJob extends Document {
  title: string;
  description: string;

  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;

  location: string;
  jobType: JobType;
  workMode: WorkMode;

  salaryMin?: number;
  salaryMax?: number;
  currency?: string;

  skills: string[];
  experienceLevel?: string;

  status: JobStatus;
  isActive: boolean;

  applicantsCount?: number;

  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [3, "Job title must be at least 3 characters"],
      maxlength: [100, "Job title must not exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      minlength: [10, "Job description must be at least 10 characters"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
      minlength: [2, "Job location must be at least 2 characters"],
      maxlength: [120, "Job location must not exceed 120 characters"],
    },
    jobType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
      required: [true, "Job type is required"],
    },
    workMode: {
      type: String,
      enum: ["REMOTE", "HYBRID", "ONSITE"],
      required: [true, "Work mode is required"],
    },
    salaryMin: {
      type: Number,
      min: [0, "Minimum salary cannot be negative"],
    },
    salaryMax: {
      type: Number,
      min: [0, "Maximum salary cannot be negative"],
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: [3, "Currency must be a 3-letter code"],
      maxlength: [3, "Currency must be a 3-letter code"],
      default: "USD",
    },
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      default: [],
    },
    experienceLevel: {
      type: String,
      trim: true,
      maxlength: [30, "Experience level must not exceed 30 characters"],
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED"],
      default: "DRAFT",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    applicantsCount: {
      type: Number,
      default: 0,
      min: [0, "Applicants count cannot be negative"],
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

jobSchema.pre("validate", function () {
  if (
    this.salaryMin !== undefined &&
    this.salaryMax !== undefined &&
    this.salaryMin > this.salaryMax
  ) {
    this.invalidate("salaryMin", "salaryMin cannot be greater than salaryMax");
  }
});

// Index for faster queries
jobSchema.index({ organizationId: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ organizationId: 1, createdAt: -1 });
jobSchema.index({ status: 1, isActive: 1 });
jobSchema.index({ jobType: 1, workMode: 1 });

export const Job = mongoose.model<IJob>("Job", jobSchema);
