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

      socket.to(roomId).emit("event", {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
      });

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
};

export { register };
