import express from "express";
import { executeCode } from "./execution.controller.js";

const router = express.Router();

router.post("/", executeCode);

export default router;
