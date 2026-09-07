import mongoose from "mongoose";

export default async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the server .env file.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected.");
}
