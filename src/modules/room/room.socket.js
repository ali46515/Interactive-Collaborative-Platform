import { getRoomBySlug } from "./room.service.js";
import {
  userJoinedRoom,
  getRoomUsers,
  userLeftRoom,
} from "../presence/presence.service.js";
import EVENTS from "../../sockets/events.js";
import logger from "../../utils/logger.js";

const register = (io, socket) => {
  socket.on(EVENTS.ROOM.JOIN, async ({ roomSlug }, callback) => {
    try {
      const room = await getRoomBySlug(roomSlug);
      const roomId = room._id.toString();

      if (!room.hasMember(socket.userId)) {
        return callback?.({ error: "You are not a member of this room" });
      }

      await socket.join(roomId);
      socket.currentRoomId = roomId;

      await userJoinedRoom(socket.userId, roomId, socket.user.username);

      socket.to(roomId).emit(EVENTS.PRESENCE.USER_JOINED, {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
      });

      const activeUsers = await getRoomUsers(roomId);

      callback?.({ success: true, room, activeUsers });

      logger.info("Socket joined room", { userId: socket.userId, roomId });
    } catch (err) {
      logger.error("ROOM.JOIN error", {
        error: err.message,
        userId: socket.userId,
      });
      callback?.({ error: err.message });
    }
  });

  socket.on(EVENTS.ROOM.LEAVE, async ({ roomId }, callback) => {
    try {
      await socket.leave(roomId);
      await userLeftRoom(socket.userId, roomId);

      socket.to(roomId).emit(EVENTS.PRESENCE.USER_LEFT, {
        userId: socket.userId,
        username: socket.user.username,
      });

      socket.currentRoomId = null;
      callback?.({ success: true });

      logger.info("Socket left room", { userId: socket.userId, roomId });
    } catch (err) {
      logger.error("ROOM.LEAVE error", { error: err.message });
      callback?.({ error: err.message });
    }
  });

  socket.on("disconnecting", async () => {
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    for (const roomId of rooms) {
      await userLeftRoom(socket.userId, roomId);
      socket.to(roomId).emit(EVENTS.PRESENCE.USER_LEFT, {
        userId: socket.userId,
        username: socket.user?.username,
      });
    }
  });
};

export { register };
