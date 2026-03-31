import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const defaultLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again in 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many execution requests. Please slow down.",
  },
});

export { defaultLimiter, authLimiter, executionLimiter };
