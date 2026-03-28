import express from "express";
import roomRoutes from "../modules/room/room.routes.js";
import executionRoutes from "../execution/execution.routes.js";

const router = express.Router();

router.use("/rooms", roomRoutes);
router.use("/execute", executionRoutes);

export default router;
