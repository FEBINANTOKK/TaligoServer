import crypto from "crypto";
import { Organization } from "../models/Organization.js";

export async function generateUniqueJoinCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 6 + Math.floor(Math.random() * 3); // 6–8

  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }

    const existing = await Organization.findOne({ joinCode: code });
    if (!existing) return code;
  }

  throw new Error("Failed to generate a unique join code");
}
