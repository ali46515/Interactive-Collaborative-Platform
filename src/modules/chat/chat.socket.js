import EVENTS from "../../sockets/events.js";
import logger from "../../utils/logger.js";
import { getHistory, saveMessage } from "./chat.service.js";

const register = (io, socket) => {
  socket.on(EVENTS.CHAT.HISTORY, async ({ roomId, before }, callback) => {
    try {
      const messages = await getHistory(roomId, 50, before);
      callback?.({ success: true, messages });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  socket.on(EVENTS.CHAT.MESSAGE, async ({ roomId, content }, callback) => {
    try {
      if (!content || content.trim().length === 0) {
        return callback?.({ error: "Message cannot be empty" });
      }
      if (content.length > 2000) {
        return callback?.({ error: "Message too long (max 2000 chars)" });
      }

      const message = await saveMessage(roomId, socket.userId, content.trim());

      io.to(roomId).emit(EVENTS.CHAT.MESSAGE, { message });
      callback?.({ success: true, message });
    } catch (err) {
      logger.error("CHAT.MESSAGE error", { error: err.message });
      callback?.({ error: err.message });
    }
  });

  socket.on(EVENTS.CHAT.TYPING_START, ({ roomId }) => {
    socket.to(roomId).emit(EVENTS.CHAT.TYPING_START, {
      userId: socket.userId,
      username: socket.user.username,
    });
  });

  socket.on(EVENTS.CHAT.TYPING_STOP, ({ roomId }) => {
    socket.to(roomId).emit(EVENTS.CHAT.TYPING_STOP, { userId: socket.userId });
  });
};

export { register };
