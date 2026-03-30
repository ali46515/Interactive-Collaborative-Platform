import express from "express";
const router = express.Router();
import {
  archiveRoom,
  createRoom,
  getRoom,
  leaveRoom,
  listRooms,
  joinRoom,
  updateRoom,
} from "./room.controller.js";
import { protect } from "../auth/auth.middleware.js";

router.use(protect);

router.post("/", createRoom);
router.get("/", listRooms);
router.get("/:slug", getRoom);
router.post("/:slug/join", joinRoom);
router.post("/:id/leave", leaveRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", archiveRoom);

export default router;
