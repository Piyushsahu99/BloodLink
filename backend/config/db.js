import mongoose from "mongoose";

const isDevelopment = (process.env.NODE_ENV ?? "development") !== "production";

const abbreviatedUri = (uri) =>
  typeof uri === "string" && uri.length > 8 ? `${uri.slice(0, 52)}...` : uri;

let mockDataEnabled = false;

export const isMockDataEnabled = () =>
  mockDataEnabled || mongoose.connection.readyState !== 1;

// Connect to MongoDB
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (isDevelopment) {
      console.warn("⚠️  MONGODB_URI not set. API will run with in-memory mock data only.");
      mockDataEnabled = true;
      return null;
    }

    console.error("MONGODB_URI is required in production environments.");
    process.exit(1);
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MONGODB_URI:", abbreviatedUri(mongoUri));

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    mockDataEnabled = false;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error("Full error:", error);

    if (isDevelopment) {
      console.warn("⚠️  MongoDB connection failed. Continuing with mock data for development.");
      mockDataEnabled = true;
      return null;
    }

    process.exit(1);
  }
};