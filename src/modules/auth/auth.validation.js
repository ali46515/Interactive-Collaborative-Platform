import { body } from "express-validator";

const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores and dashes",
    ),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

export { registerValidation, loginValidation, refreshValidation };
