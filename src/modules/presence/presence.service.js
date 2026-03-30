import { client as redis } from "../../config/redis.js";
import { REDIS_KEYS } from "../../utils/constants.js";

const USER_TTL = 60 * 60 * 2;

const userJoinedRoom = async (userId, roomId, username) => {
  const key = REDIS_KEYS.ROOM_USERS(roomId);
  const userData = JSON.stringify({ userId, username, joinedAt: Date.now() });
  await redis.hset(key, userId, userData);
  await redis.expire(key, USER_TTL);
};

const userLeftRoom = async (userId, roomId) => {
  await redis.hdel(REDIS_KEYS.ROOM_USERS(roomId), userId);
};

const getRoomUsers = async (roomId) => {
  const raw = await redis.hgetall(REDIS_KEYS.ROOM_USERS(roomId));
  if (!raw) return [];
  return Object.values(raw).map((v) => JSON.parse(v));
};

const getRoomUserCount = async (roomId) => {
  return redis.hlen(REDIS_KEYS.ROOM_USERS(roomId));
};

const setUserSocket = async (userId, socketId) => {
  await redis.set(REDIS_KEYS.USER_SOCKET(userId), socketId, "EX", USER_TTL);
};

const removeUserSocket = async (userId) => {
  await redis.del(REDIS_KEYS.USER_SOCKET(userId));
};

const getUserSocket = async (userId) => {
  return redis.get(REDIS_KEYS.USER_SOCKET(userId));
};

export {
  userJoinedRoom,
  userLeftRoom,
  getRoomUsers,
  getRoomUserCount,
  setUserSocket,
  removeUserSocket,
  getUserSocket,
};
