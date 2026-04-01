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

router.use("/auth", authLimiter, import("../modules/auth/auth.routes.js"));
router.use("/rooms", import("../modules/room/room.routes.js"));
router.use("/users", import("../modules/user/user.controller.js"));
router.use(
  "/execution",
  executionLimiter,
  import("../modules/execution/execution.controller.js"),
);

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

export default router;
