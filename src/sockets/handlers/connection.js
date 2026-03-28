import { EVENTS } from "../events.js";

const handleConnection = (io, socket) => {
  console.log("User connected:", socket.id);

  socket.on(EVENTS.JOIN_ROOM, ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit(EVENTS.USER_JOINED, socket.id);
  });

  socket.on(EVENTS.CODE_CHANGE, ({ roomId, code }) => {
    socket.to(roomId).emit(EVENTS.CODE_UPDATE, code);
  });

  socket.on(EVENTS.CHAT_MESSAGE, ({ roomId, message }) => {
    io.to(roomId).emit(EVENTS.CHAT_MESSAGE, {
      user: socket.id,
      message,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

export { handleConnection };
