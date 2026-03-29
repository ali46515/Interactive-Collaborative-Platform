import User from "./auth.model";
import { verifyAccessToken } from "./auth.service.js";
import { error } from "../../utils/response.js";
import logger from "../../utils/logger.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return error(res, 401, "Authentication required");
    }

    const payload = await verifyAccessToken(token);

    const user = await User.findById(payload.sub).select("-password");
    if (!user || !user.isActive) {
      return error(res, 401, "User not found or deactivated");
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    return error(res, err.statusCode || 401, err.message);
  }
};

const protectSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = await verifyAccessToken(token);

    const user = await User.findById(payload.sub).select("-password");
    if (!user || !user.isActive) {
      return next(new Error("User not found or deactivated"));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (err) {
    logger.warn("Socket auth failed", { error: err.message });
    next(new Error(err.message || "Authentication failed"));
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return error(res, 401, "Authentication required");
    next();
  };

module.exports = { protect, protectSocket, requireRole };
