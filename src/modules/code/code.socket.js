import {
  getOpsSince,
  getOrCreateDocument,
  resetDocument,
  changeLanguage,
  submitOperation,
} from "./code.service.js";
import { getRoomById } from "../room/room.service.js";
import EVENTS from "../../sockets/events.js";
import { pub } from "../../config/redis.js";
import logger from "../../utils/logger.js";

const register = (io, socket) => {
  socket.on(EVENTS.CODE.JOIN, async ({ roomId }, callback) => {
    try {
      const state = await getOrCreateDocument(roomId);
      callback?.({ success: true, ...state });
    } catch (err) {
      logger.error("CODE.JOIN error", {
        error: err.message,
        userId: socket.userId,
      });
      callback?.({ error: err.message });
    }
  });

  socket.on(EVENTS.CODE.CATCHUP, async ({ roomId, sinceVersion }, callback) => {
    try {
      const result = await getOpsSince(roomId, sinceVersion);
      if (!result) return callback?.({ error: "Document not found" });
      callback?.({ success: true, ...result });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  socket.on(
    EVENTS.CODE.OPERATION,
    async ({ roomId, op, version, cursor }, callback) => {
      try {
        const room = await getRoomById(roomId);
        if (!room.hasMember(socket.userId)) {
          return callback?.({ error: "Not a room member" });
        }

        const result = await submitOperation(
          roomId,
          socket.userId,
          version,
          op,
        );

        callback?.({ success: true, version: result.version });

        socket.to(roomId).emit(EVENTS.CODE.OPERATION, {
          op: result.op,
          version: result.version,
          authorId: socket.userId,
          cursor: cursor ?? null,
        });

        await pub.publish(
          `room:${roomId}:ops`,
          JSON.stringify({
            op: result.op,
            version: result.version,
            authorId: socket.userId,
          }),
        );
      } catch (err) {
        logger.error("CODE.OPERATION error", {
          error: err.message,
          userId: socket.userId,
          roomId,
          version,
        });

        if (err.statusCode === 400) {
          try {
            const state = await getOrCreateDocument(roomId);
            socket.emit(EVENTS.CODE.ROLLBACK, state);
          } catch (_) {}
        }

        callback?.({ error: err.message });
      }
    },
  );

  socket.on(EVENTS.CODE.CURSOR, ({ roomId, cursor }) => {
    socket.to(roomId).emit(EVENTS.CODE.CURSOR, {
      userId: socket.userId,
      username: socket.user.username,
      cursor,
    });
  });

  socket.on(EVENTS.CODE.SELECTION, ({ roomId, selection }) => {
    socket.to(roomId).emit(EVENTS.CODE.SELECTION, {
      userId: socket.userId,
      username: socket.user.username,
      selection,
    });
  });

  socket.on(
    EVENTS.CODE.LANGUAGE_CHANGE,
    async ({ roomId, language }, callback) => {
      try {
        const room = await getRoomById(roomId);
        const role = room.getMemberRole(socket.userId);

        if (!["owner", "member"].includes(role)) {
          return callback?.({ error: "Insufficient permissions" });
        }

        await changeLanguage(roomId, language);

        io.to(roomId).emit(EVENTS.CODE.LANGUAGE_CHANGE, {
          language,
          changedBy: socket.userId,
        });

        callback?.({ success: true });
      } catch (err) {
        logger.error("CODE.LANGUAGE_CHANGE error", { error: err.message });
        callback?.({ error: err.message });
      }
    },
  );

  socket.on(EVENTS.CODE.RESET, async ({ roomId }, callback) => {
    try {
      const room = await getRoomById(roomId);
      if (!room.isOwner(socket.userId)) {
        return callback?.({
          error: "Only the room owner can reset the document",
        });
      }

      const result = await resetDocument(roomId, socket.userId);
      io.to(roomId).emit(EVENTS.CODE.RESET, {
        version: result.version,
        content: "",
      });
      callback?.({ success: true });
    } catch (err) {
      logger.error("CODE.RESET error", { error: err.message });
      callback?.({ error: err.message });
    }
  });
};

export { register };
