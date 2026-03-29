import express from "express";
const router = express.Router();
import controller from "./auth.controller.js";
import { protect } from "./auth.middleware.js";
import {
  registerValidation,
  loginValidation,
  refreshValidation,
} from "./auth.validation.js";

router.post("/register", registerValidation, controller.register);
router.post("/login", loginValidation, controller.login);
router.post("/refresh", refreshValidation, controller.refreshTokens);
router.post("/logout", protect, controller.logout);
router.get("/me", protect, controller.me);

export default router;
