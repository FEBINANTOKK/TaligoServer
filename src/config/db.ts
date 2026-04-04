import { MongoClient, type Db } from "mongodb";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myapp";

export const client = new MongoClient(MONGO_URI);
let _db: Db;

export async function connectDB(): Promise<void> {
  try {
    await client.connect();
    _db = client.db();
    console.log(`Connected to MongoDB: ${_db.databaseName}`);

    await mongoose.connect(MONGO_URI);
    console.log("Mongoose connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export function getDb(): Db {
  if (!_db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return _db;
}
