import {
  execute,
  getExecution,
  getSupportedLanguages,
} from "./execution.service.js";
import { success, error } from "../../utils/response.js";
import asyncHandler from "../../utils/asyncHandler.js";
import express from "express";
const router = express.Router();
import { protect } from "../auth/auth.middleware.js";

const run = asyncHandler(async (req, res) => {
  const { language, code, stdin, roomId } = req.body;

  if (!language || !code) {
    return error(res, 400, "language and code are required");
  }

  const result = await execute({
    language,
    code,
    stdin,
    roomId,
    userId: req.user._id.toString(),
  });

  return success(res, 200, "Execution complete", result);
});

const languages = asyncHandler(async (req, res) => {
  return success(res, 200, "Supported languages", {
    languages: getSupportedLanguages(),
  });
});

const getResult = asyncHandler(async (req, res) => {
  const record = getExecution(req.params.id);
  if (!record) return error(res, 404, "Execution not found");
  return success(res, 200, "Execution result", record);
});

router.use(protect);
router.post("/run", run);
router.get("/languages", languages);
router.get("/:id", getResult);

export default router;
