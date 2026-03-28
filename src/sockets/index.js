import { handleConnection } from "./handlers/connection.js";

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });
};

export { registerSocketHandlers };
