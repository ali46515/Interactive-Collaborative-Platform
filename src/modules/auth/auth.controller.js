import authService from "./auth.service.js";
import { success, error } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { validationResult } from "express-validator";

const setCookies = (res, { accessToken, refreshToken }) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh",
  });
};

const clearCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
};

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 422, "Validation failed", errors.array());
  }

  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
  );
  setCookies(res, { accessToken, refreshToken });

  return success(res, 201, "Account created successfully", {
    user,
    accessToken,
    refreshToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 422, "Validation failed", errors.array());
  }

  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setCookies(res, { accessToken, refreshToken });

  return success(res, 200, "Login successful", {
    user,
    accessToken,
    refreshToken,
  });
});

const refreshTokens = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 422, "Validation failed", errors.array());
  }

  const incomingToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!incomingToken) {
    return error(res, 400, "Refresh token is required");
  }

  const { user, accessToken, refreshToken } =
    await authService.refresh(incomingToken);
  setCookies(res, { accessToken, refreshToken });

  return success(res, 200, "Tokens refreshed", {
    user,
    accessToken,
    refreshToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id.toString(), req.tokenPayload.jti);
  clearCookies(res);
  return success(res, 200, "Logged out successfully");
});

const me = asyncHandler(async (req, res) => {
  return success(res, 200, "Profile fetched", { user: req.user });
});

export { register, login, refreshTokens, logout, me };
