import mongoose, { Schema, type Document } from "mongoose";

export type ApplicationStatus = "applied" | "shortlisted" | "rejected";

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId | null;
  matchScore: number | null;
  status: ApplicationStatus;
  createdAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    matchScore: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected"],
      default: "applied",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, createdAt: -1 });
applicationSchema.index({ userId: 1, createdAt: -1 });

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema,
);
