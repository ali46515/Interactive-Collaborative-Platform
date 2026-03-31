import { v4 as uuidv4 } from "uuid";
import dockerRunner from "./sandbox/dockerRunner.js";
import {
  EXECUTION_STATUS,
  SUPPORTED_LANGUAGES,
} from "../../utils/constants.js";
import logger from "../../utils/logger.js";

const executions = new Map();

const execute = async ({
  language,
  code,
  stdin = "",
  roomId,
  userId,
  onOutput,
}) => {
  if (!SUPPORTED_LANGUAGES[language]) {
    const err = new Error(`Language "${language}" is not supported`);
    err.statusCode = 400;
    throw err;
  }

  if (!code || code.trim().length === 0) {
    const err = new Error("Code cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  if (code.length > 100_000) {
    const err = new Error("Code exceeds 100KB size limit");
    err.statusCode = 400;
    throw err;
  }

  const executionId = uuidv4();
  const record = {
    id: executionId,
    roomId,
    userId,
    language,
    status: EXECUTION_STATUS.RUNNING,
    startedAt: new Date(),
    result: null,
  };

  executions.set(executionId, record);

  logger.info("Execution started", { executionId, language, roomId, userId });

  try {
    const result = await dockerRunner.run(language, code, stdin);

    record.status = result.status;
    record.result = result;
    record.completedAt = new Date();

    logger.info("Execution completed", {
      executionId,
      status: result.status,
      durationMs: result.durationMs,
    });

    return { executionId, ...result };
  } catch (err) {
    record.status = EXECUTION_STATUS.ERROR;
    record.result = { stderr: err.message };
    logger.error("Execution failed", { executionId, error: err.message });
    throw err;
  } finally {
    setTimeout(() => executions.delete(executionId), 5 * 60 * 1000);
  }
};

const getExecution = (executionId) => executions.get(executionId) ?? null;

const getSupportedLanguages = () =>
  Object.entries(SUPPORTED_LANGUAGES).map(([id, cfg]) => ({
    id,
    image: cfg.image,
    extension: cfg.ext,
  }));

export { execute, getExecution, getSupportedLanguages };
