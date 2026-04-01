import { config } from "dotenv";

config();

const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

const envVars = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  MONGO_URI: process.env.MONGO_URI,

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  DOCKER_SOCKET: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
  SANDBOX_CPU_QUOTA: parseInt(process.env.SANDBOX_CPU_QUOTA, 10) || 50000,
  SANDBOX_MEMORY_LIMIT:
    parseInt(process.env.SANDBOX_MEMORY_LIMIT, 10) || 134217728,
  SANDBOX_TIMEOUT_MS: parseInt(process.env.SANDBOX_TIMEOUT_MS, 10) || 10000,
  SANDBOX_NETWORK_DISABLED: process.env.SANDBOX_NETWORK_DISABLED !== "false",

  RATE_LIMIT_WINDOW_MS:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
};

export default envVars;
