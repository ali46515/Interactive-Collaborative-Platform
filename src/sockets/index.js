import { getIO } from "../config/socket.js";
import { protectSocket } from "../modules/auth/auth.middleware.js";
import { register as roomRegister } from "../modules/room/room.socket.js";
import { register as socketRegister } from "../modules/code/code.socket.js";
import { register } from "../modules/presence/presence.socket.js";
import { sub } from "../config/redis.js";
import EVENTS from "./events.js";
import logger from "../utils/logger.js";

const initSockets = () => {
  const io = getIO();

  io.use(protectSocket);

  io.on("connection", (socket) => {
    logger.info("Socket connected", {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.user?.username,
    });

    register(io, socket);
    register(io, socket);
    register(io, socket);

    socket.on("error", (err) => {
      logger.error("Socket error", { socketId: socket.id, error: err.message });
      socket.emit(EVENTS.SYSTEM.ERROR, {
        message: "An unexpected error occurred",
      });
    });

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
    });
  });

  sub.psubscribe("room:*:ops", (err) => {
    if (err) logger.error("Redis psubscribe error", { error: err.message });
  });

  sub.on("pmessage", (pattern, channel, message) => {
    const parts = channel.split(":");
    const roomId = parts[1];
    try {
      const payload = JSON.parse(message);

      io.to(roomId).emit(EVENTS.CODE.OPERATION, payload);
    } catch (err) {
      logger.error("Redis pmessage parse error", { error: err.message });
    }
  });

  logger.info("Socket.io orchestrator initialized");
};

export { initSockets };
