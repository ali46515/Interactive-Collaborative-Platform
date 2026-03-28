import { Server } from "socket.io";
import { registerSocketHandlers } from "../sockets/index.js";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  registerSocketHandlers(io);

  return io;
};

export { initSocket };
