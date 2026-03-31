import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import routes from "./routes/index.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { defaultLimiter } from "./middleware/rateLimiter.js";
import logger from "./utils/logger.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

if (!env.IS_TEST) {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.path === "/api/health",
    }),
  );
}

app.use(defaultLimiter);

app.use("/api", routes);

app.use(errorMiddleware);

export default app;
