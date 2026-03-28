import { Server } from "socket.io";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  return io;
};

export { initSocket };
