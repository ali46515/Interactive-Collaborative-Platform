import roomService from "./room.service.js";
import { success, error } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";

const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.user._id, req.body);
  return success(res, 201, "Room created", { room });
});

const joinRoom = asyncHandler(async (req, res) => {
  const room = await roomService.joinRoom(
    req.user._id,
    req.params.slug,
    req.body.password,
  );
  return success(res, 200, "Joined room", { room });
});

const listRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.listUserRooms(req.user._id);
  return success(res, 200, "Rooms fetched", { rooms });
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomBySlug(req.params.slug);
  return success(res, 200, "Room fetched", { room });
});

const leaveRoom = asyncHandler(async (req, res) => {
  await roomService.leaveRoom(req.user._id, req.params.id);
  return success(res, 200, "Left room");
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(
    req.user._id,
    req.params.id,
    req.body,
  );
  return success(res, 200, "Room updated", { room });
});

const archiveRoom = asyncHandler(async (req, res) => {
  await roomService.archiveRoom(req.user._id, req.params.id);
  return success(res, 200, "Room archived");
});

export {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  archiveRoom,
};
