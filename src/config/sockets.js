import { Server } from "socket.io";
import env from "./env.js";
import { logger } from "../utils/logger.js";

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
  });

  logger.info("Socket.io initialized", { clientUrl: env.CLIENT_URL });
  return io;
};

const getIO = () => {
  if (!io)
    throw new Error("Socket.io has not been initialized. Call init() first.");
  return io;
};

export { init, getIO };
