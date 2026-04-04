import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client, getDb } from "./db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any;

export function initAuth() {
  _auth = betterAuth({
    database: mongodbAdapter(getDb(), { client }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["http://localhost:3000"],
  });
}

export function getAuth(): ReturnType<typeof betterAuth> {
  if (!_auth) {
    throw new Error("Auth not initialized. Call initAuth() after connectDB().");
  }
  return _auth;
}
