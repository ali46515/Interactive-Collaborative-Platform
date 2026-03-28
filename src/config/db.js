import mongoose from "mongoose";
import env from "./env.js";

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
    console.log("MongoDB connected", {
      uri: env.MONGO_URI.replace(/\/\/.*@/, "//***@"),
    });
  } catch (err) {
    console.error("MongoDB connection failed", { error: err.message });
    throw err;
  }
};

const disconnect = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("MongoDB disconnected");
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("MongoDB disconnected — attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error", { error: err.message });
});

export { connect, disconnect };
