import express from "express";
const router = express.Router();
import { authLimiter, executionLimiter } from "../middleware/rateLimiter.js";

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

router.use("/auth", authLimiter, require("../modules/auth/auth.routes"));
router.use("/rooms", require("../modules/room/room.routes"));
router.use("/users", require("../modules/user/user.controller"));
router.use(
  "/execution",
  executionLimiter,
  require("../modules/execution/execution.controller"),
);

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

export default router;
