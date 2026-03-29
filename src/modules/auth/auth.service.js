import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import env from "../../config/env";
import { client as redis } from "../../config/redis";
import User from "./auth.model";
import { TOKEN_TYPES, REDIS_KEYS } from "../../utils/constants";
import logger from "../../utils/logger";

const generateAccessToken = (userId) => {
  const jti = uuidv4();
  return {
    token: jwt.sign(
      { sub: userId, type: TOKEN_TYPES.ACCESS, jti },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      },
    ),
    jti,
  };
};

const generateRefreshToken = (userId) => {
  const jti = uuidv4();
  return {
    token: jwt.sign(
      { sub: userId, type: TOKEN_TYPES.REFRESH, jti },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
    ),
    jti,
  };
};

const storeRefreshToken = async (userId, refreshToken) => {
  const ttl = 60 * 60 * 24 * 30;
  await redis.set(REDIS_KEYS.REFRESH_TOKEN(userId), refreshToken, "EX", ttl);
};

const revokeRefreshToken = async (userId) => {
  await redis.del(REDIS_KEYS.REFRESH_TOKEN(userId));
};

const blacklistAccessToken = async (jti, expiresIn) => {
  const ttl = typeof expiresIn === "number" ? expiresIn : 60 * 60 * 24 * 7;
  await redis.set(REDIS_KEYS.BLACKLIST_TOKEN(jti), "1", "EX", ttl);
};

const isTokenBlacklisted = async (jti) => {
  const result = await redis.get(REDIS_KEYS.BLACKLIST_TOKEN(jti));
  return result === "1";
};

const register = async ({ username, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    const err = new Error(`${field} is already taken`);
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ username, email, password });
  logger.info("User registered", { userId: user._id, email });

  const { token: accessToken, jti: accessJti } = generateAccessToken(
    user._id.toString(),
  );
  const { token: refreshToken } = generateRefreshToken(user._id.toString());
  await storeRefreshToken(user._id.toString(), refreshToken);

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is deactivated");
    err.statusCode = 403;
    throw err;
  }

  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  const { token: accessToken } = generateAccessToken(user._id.toString());
  const { token: refreshToken } = generateRefreshToken(user._id.toString());
  await storeRefreshToken(user._id.toString(), refreshToken);

  logger.info("User logged in", { userId: user._id });
  return { user, accessToken, refreshToken };
};

const refresh = async (incomingRefreshToken) => {
  let payload;
  try {
    payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  if (payload.type !== TOKEN_TYPES.REFRESH) {
    const err = new Error("Invalid token type");
    err.statusCode = 401;
    throw err;
  }

  const stored = await redis.get(REDIS_KEYS.REFRESH_TOKEN(payload.sub));
  if (stored !== incomingRefreshToken) {
    const err = new Error("Refresh token reuse detected — please log in again");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    const err = new Error("User not found or deactivated");
    err.statusCode = 401;
    throw err;
  }

  const { token: accessToken } = generateAccessToken(user._id.toString());
  const { token: newRefreshToken } = generateRefreshToken(user._id.toString());
  await storeRefreshToken(user._id.toString(), newRefreshToken);

  return { user, accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, accessJti) => {
  await Promise.all([
    revokeRefreshToken(userId),
    blacklistAccessToken(accessJti, 60 * 60 * 24 * 7),
  ]);
  logger.info("User logged out", { userId });
};

const verifyAccessToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    const err = new Error("Invalid or expired token");
    err.statusCode = 401;
    throw err;
  }

  if (payload.type !== TOKEN_TYPES.ACCESS) {
    const err = new Error("Invalid token type");
    err.statusCode = 401;
    throw err;
  }

  const blacklisted = await isTokenBlacklisted(payload.jti);
  if (blacklisted) {
    const err = new Error("Token has been revoked");
    err.statusCode = 401;
    throw err;
  }

  return payload;
};

export { register, login, refresh, logout, verifyAccessToken };
