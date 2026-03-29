import bcrypt from "bcryptjs";
import Room from "./room.model.js";
import User from "../auth/auth.model.js";
import { client as redis } from "../../config/redis.js";
import {
  USER_ROLES,
  ROOM_STATUS,
  REDIS_KEYS,
  MAX_ROOM_MEMBERS,
} from "../../utils/constants.js";
import logger from "../../utils/logger.js";

const createRoom = async (
  userId,
  { name, description, language, isPrivate, password, maxMembers },
) => {
  const roomData = {
    name,
    description,
    language,
    isPrivate: isPrivate ?? false,
    maxMembers: maxMembers ?? MAX_ROOM_MEMBERS,
    members: [{ user: userId, role: USER_ROLES.OWNER }],
  };

  if (isPrivate && password) {
    const salt = await bcrypt.genSalt(10);
    roomData.password = await bcrypt.hash(password, salt);
  }

  const room = await Room.create(roomData);

  await User.findByIdAndUpdate(userId, { $addToSet: { rooms: room._id } });

  logger.info("Room created", { roomId: room._id, slug: room.slug, userId });
  return room;
};

const getRoomBySlug = async (slug, includePassword = false) => {
  const query = Room.findOne({ slug }).populate(
    "members.user",
    "username avatar lastSeen",
  );
  if (includePassword) query.select("+password");
  const room = await query;
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }
  return room;
};

const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId).populate(
    "members.user",
    "username avatar lastSeen",
  );
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }
  return room;
};

const listUserRooms = async (userId) => {
  return Room.find({
    "members.user": userId,
    status: ROOM_STATUS.ACTIVE,
  })
    .populate("members.user", "username avatar")
    .sort({ updatedAt: -1 });
};

const joinRoom = async (userId, slug, password) => {
  const room = await Room.findOne({ slug }).select("+password");
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }

  if (room.status !== ROOM_STATUS.ACTIVE) {
    const err = new Error("Room is no longer active");
    err.statusCode = 403;
    throw err;
  }

  // Already a member — just return
  if (room.hasMember(userId)) {
    return room.populate("members.user", "username avatar lastSeen");
  }

  if (room.members.length >= room.maxMembers) {
    const err = new Error("Room is full");
    err.statusCode = 403;
    throw err;
  }

  if (room.isPrivate) {
    if (!password) {
      const err = new Error("Password required for private room");
      err.statusCode = 403;
      throw err;
    }
    const valid = await bcrypt.compare(password, room.password);
    if (!valid) {
      const err = new Error("Incorrect room password");
      err.statusCode = 403;
      throw err;
    }
  }

  room.members.push({ user: userId, role: USER_ROLES.MEMBER });
  await room.save();
  await User.findByIdAndUpdate(userId, { $addToSet: { rooms: room._id } });

  logger.info("User joined room", { userId, roomId: room._id, slug });
  return room.populate("members.user", "username avatar lastSeen");
};

const leaveRoom = async (userId, roomId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }

  if (!room.hasMember(userId)) {
    const err = new Error("You are not a member of this room");
    err.statusCode = 403;
    throw err;
  }

  const isOwner = room.isOwner(userId);
  room.members = room.members.filter(
    (m) => m.user.toString() !== userId.toString(),
  );

  if (isOwner && room.members.length > 0) {
    room.members[0].role = USER_ROLES.OWNER;
  }

  if (room.members.length === 0) {
    room.status = ROOM_STATUS.ARCHIVED;
  }

  await room.save();
  await User.findByIdAndUpdate(userId, { $pull: { rooms: room._id } });

  logger.info("User left room", { userId, roomId });
  return room;
};

const updateRoom = async (userId, roomId, updates) => {
  const room = await Room.findById(roomId);
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }

  if (!room.isOwner(userId)) {
    const err = new Error("Only the room owner can update settings");
    err.statusCode = 403;
    throw err;
  }

  const allowed = [
    "name",
    "description",
    "language",
    "isPrivate",
    "maxMembers",
  ];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) room[key] = updates[key];
  });

  await room.save();
  return room;
};

const archiveRoom = async (userId, roomId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }
  if (!room.isOwner(userId)) {
    const err = new Error("Only the room owner can archive this room");
    err.statusCode = 403;
    throw err;
  }

  room.status = ROOM_STATUS.ARCHIVED;
  await room.save();

  await redis.del(REDIS_KEYS.ROOM_CODE(roomId));
  await redis.del(REDIS_KEYS.ROOM_USERS(roomId));

  logger.info("Room archived", { roomId, userId });
  return room;
};

const persistCodeSnapshot = async (roomId, content, version) => {
  await Room.findByIdAndUpdate(roomId, {
    codeSnapshot: { content, version, updatedAt: new Date() },
  });
};

export {
  createRoom,
  getRoomBySlug,
  getRoomById,
  listUserRooms,
  joinRoom,
  leaveRoom,
  updateRoom,
  archiveRoom,
  persistCodeSnapshot,
};
