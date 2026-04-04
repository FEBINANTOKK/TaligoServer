import mongoose, { Schema, type Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  joinCode: string;
  createdAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Z0-9]{6,8}$/,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);
