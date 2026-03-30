import { getRoomBySlug } from "./room.service.js";
import logger from "../../utils/logger.js";

const register = (io, socket) => {
  socket.on("events", async ({ roomSlug }, callback) => {
    try {
      const room = await getRoomBySlug(roomSlug);
      const roomId = room._id.toString();

      if (!room.hasMember(socket.userId)) {
        return callback?.({ error: "You are not a member of this room" });
      }

      await socket.join(roomId);
      socket.currentRoomId = roomId;

      socket.to(roomId).emit("events", {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
      });

      callback?.({ success: true, room });

      logger.info("Socket joined room", { userId: socket.userId, roomId });
    } catch (err) {
      logger.error("ROOM.JOIN error", {
        error: err.message,
        userId: socket.userId,
      });
      callback?.({ error: err.message });
    }
  });

  socket.on("events", async ({ roomId }, callback) => {
    try {
      await socket.leave(roomId);
      await presenceService.userLeftRoom(socket.userId, roomId);

      socket.to(roomId).emit("events", {
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
      await presenceService.userLeftRoom(socket.userId, roomId);
      socket.to(roomId).emit("events", {
        userId: socket.userId,
        username: socket.user?.username,
      });
    }
  });
};

export { register };
