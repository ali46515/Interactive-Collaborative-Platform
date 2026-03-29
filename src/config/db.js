import mongoose from "mongoose";
import env from "./env.js";
import { logger } from "../utils/logger.js";

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
  minPoolSize: 5,
};

let isConnected = false;

const connect = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(env.MONGO_URI, MONGO_OPTIONS);
    isConnected = true;
    logger.info("MongoDB connected", {
      uri: env.MONGO_URI.replace(/\/\/.*@/, "//***@"),
    });
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    throw err;
  }
};

const disconnect = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB disconnected");
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected — attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  logger.info("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB error", { error: err.message });
});

export { connect, disconnect };
