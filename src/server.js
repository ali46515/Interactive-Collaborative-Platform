import http from "http";
import app from "./app.js";
import { init as initSocket } from "./config/sockets.js";
import { initSockets } from "./sockets/index.js";
import {
  connect as dbConnect,
  disconnect as dbDisconnect,
} from "./config/db.js";
import { connect, disconnect } from "./config/redis.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";
import { warmupImages } from "./modules/execution/sandbox/dockerRunner.js";

const server = http.createServer(app);

console.log(import("./app.js"));

const start = async () => {
  try {
    await dbConnect();
    await connect();

    initSocket(server);

    initSockets();

    warmupImages(["javascript", "python"]).catch((err) =>
      logger.warn("Docker warmup failed - images will be pulled on first use", {
        error: err.message,
      }),
    );

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`, {
        env: env.NODE_ENV,
        clientUrl: env.CLIENT_URL,
      });
    });
  } catch (err) {
    logger.error("Failed to start server", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal} shutting down gracefully...`);
  server.close(async () => {
    try {
      await dbDisconnect();
      await disconnect();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { error: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 15_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
