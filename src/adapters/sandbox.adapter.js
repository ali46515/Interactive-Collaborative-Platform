import {run as dockerRun, warmupImages} from "../modules/execution/sandbox/dockerRunner.js";
import {run, getSupportedLanguages, isAvailable} from "../modules/execution/sandbox/vmRunner.js";
import { SUPPORTED_LANGUAGES } from "../utils/constants.js";
import logger from "../utils/logger.js";

let _dockerAvailable = null;

const checkDockerAvailable = async () => {
  if (_dockerAvailable !== null) return _dockerAvailable;
  try {
    const Docker = import("dockerode");
    const env = import("../config/env");
    const d = new Docker({ socketPath: env.DOCKER_SOCKET });
    await d.ping();
    _dockerAvailable = true;
  } catch {
    _dockerAvailable = false;
    logger.warn("Docker unavailable — VM runner will be used for JavaScript");
  }
  return _dockerAvailable;
};

const run = async (language, code, stdin = "") => {
  if (!SUPPORTED_LANGUAGES[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const dockerAvailable = await checkDockerAvailable();

  if (!dockerAvailable) {
    if (!getSupportedLanguages().includes(language)) {
      throw new Error(
        `Docker is unavailable and language "${language}" is not supported by the VM runner. ` +
          `Only JavaScript can run without Docker.`,
      );
    }
    logger.info("Using VM runner (Docker unavailable)", { language });
    return run(language, code, stdin);
  }

  return dockerRun(language, code, stdin);
};

const warmup = async (languages) => {
  const dockerAvailable = await checkDockerAvailable();
  if (dockerAvailable) return warmupImages(languages);
  logger.info("Skipping Docker warmup — Docker unavailable");
};

const isAvailable = async () => {
  const dockerAvailable = await checkDockerAvailable();
  return dockerAvailable || isAvailable();
};

const resetCache = () => {
  _dockerAvailable = null;
};

export { run, warmup, isAvailable, resetCache };
