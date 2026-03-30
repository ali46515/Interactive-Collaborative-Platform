import {
  setUserSocket,
  getRoomUsers,
  removeUserSocket,
} from "./presence.service.js";
import EVENTS from "../../sockets/events.js";
import logger from "../../utils/logger.js";

const register = (io, socket) => {
  setUserSocket(socket.userId, socket.id).catch(() => {});

  socket.on(EVENTS.PRESENCE.USER_LIST, async ({ roomId }, callback) => {
    try {
      const users = await getRoomUsers(roomId);
      callback?.({ success: true, users });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  socket.on(EVENTS.PRESENCE.TYPING, ({ roomId, isTyping }) => {
    socket.to(roomId).emit(EVENTS.PRESENCE.TYPING, {
      userId: socket.userId,
      username: socket.user.username,
      isTyping,
    });
  });

  socket.on("disconnect", async () => {
    await removeUserSocket(socket.userId);
    logger.info("Socket disconnected, presence cleaned up", {
      userId: socket.userId,
    });
  });
};

export { register };
