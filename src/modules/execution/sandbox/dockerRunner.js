import Docker from "dockerode";
import env from "../../../config/env.js";
import limits from "./limits.js";
import {
  SUPPORTED_LANGUAGES,
  EXECUTION_STATUS,
} from "../../../utils/constants.js";
import logger from "../../../utils/logger.js";

const docker = new Docker({ socketPath: env.DOCKER_SOCKET });

const run = async (language, code, stdin = "") => {
  const lang = SUPPORTED_LANGUAGES[language];
  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const startedAt = Date.now();
  let container = null;

  try {
    const cmd = buildCommand(language, code, lang);

    container = await docker.createContainer({
      Image: lang.image,
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: !!stdin,
      StdinOnce: true,
      Tty: false,
      NetworkDisabled: limits.NetworkDisabled,
      HostConfig: {
        Memory: limits.Memory,
        MemorySwap: limits.MemorySwap,
        CpuQuota: limits.CpuQuota,
        CpuPeriod: limits.CpuPeriod,
        PidsLimit: limits.PidsLimit,
        SecurityOpt: limits.SecurityOpt,
        ReadonlyRootfs: limits.ReadonlyRootfs,
        Tmpfs: limits.Tmpfs,
        AutoRemove: false,
      },
      WorkingDir: "/tmp",
    });

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      stdin: !!stdin,
    });

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let truncated = false;

    const stdoutChunks = [];
    const stderrChunks = [];

    container.modem.demuxStream(
      stream,
      {
        write(chunk) {
          outputBytes += chunk.length;
          if (outputBytes <= limits.MAX_OUTPUT_BYTES) {
            stdoutChunks.push(chunk.toString());
          } else if (!truncated) {
            truncated = true;
            stdoutChunks.push("\n[Output truncated — exceeded 256KB limit]");
          }
        },
      },
      {
        write(chunk) {
          stderrChunks.push(chunk.toString());
        },
      },
    );

    await container.start();

    if (stdin) {
      stream.write(stdin);
      stream.end();
    }

    const result = await Promise.race([
      container.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), limits.TIMEOUT_MS),
      ),
    ]);

    stdout = stdoutChunks.join("");
    stderr = stderrChunks.join("");
    const durationMs = Date.now() - startedAt;

    logger.info("Container executed", {
      language,
      exitCode: result.StatusCode,
      durationMs,
    });

    return {
      status:
        result.StatusCode === 0
          ? EXECUTION_STATUS.SUCCESS
          : EXECUTION_STATUS.ERROR,
      stdout,
      stderr,
      exitCode: result.StatusCode,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;

    if (err.message === "TIMEOUT") {
      logger.warn("Container execution timed out", { language, durationMs });
      return {
        status: EXECUTION_STATUS.TIMEOUT,
        stdout: "",
        stderr: `Execution timed out after ${limits.TIMEOUT_MS}ms`,
        exitCode: -1,
        durationMs,
      };
    }

    logger.error("Docker run error", { error: err.message, language });
    return {
      status: EXECUTION_STATUS.ERROR,
      stdout: "",
      stderr: err.message,
      exitCode: -1,
      durationMs,
    };
  } finally {
    if (container) {
      container.remove({ force: true }).catch((e) => {
        logger.warn("Container remove failed", { error: e.message });
      });
    }
  }
};

const buildCommand = (language, code, lang) => {
  switch (language) {
    case "javascript":
      return ["node", "-e", code];
    case "python":
      return ["python3", "-c", code];
    case "go":
      return [
        "sh",
        "-c",
        `echo '${escapeShell(code)}' > /tmp/main.go && go run /tmp/main.go`,
      ];
    case "java":
      return [
        "sh",
        "-c",
        `echo '${escapeShell(code)}' > /tmp/Main.java && cd /tmp && javac Main.java && java Main`,
      ];
    case "cpp":
      return [
        "sh",
        "-c",
        `echo '${escapeShell(code)}' > /tmp/main.cpp && g++ -o /tmp/a.out /tmp/main.cpp && /tmp/a.out`,
      ];
    default:
      return [...lang.cmd, code];
  }
};

const escapeShell = (str) => str.replace(/'/g, `'\\''`);

const ensureImage = async (image) => {
  try {
    await docker.getImage(image).inspect();
  } catch {
    logger.info(`Pulling Docker image: ${image}`);
    await new Promise((resolve, reject) => {
      docker.pull(image, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err) =>
          err ? reject(err) : resolve(),
        );
      });
    });
    logger.info(`Image pulled: ${image}`);
  }
};

const warmupImages = async (languages = ["javascript", "python"]) => {
  const tasks = languages.map((lang) => {
    const cfg = SUPPORTED_LANGUAGES[lang];
    return cfg ? ensureImage(cfg.image) : Promise.resolve();
  });
  await Promise.allSettled(tasks);
};

export { run, ensureImage, warmupImages };
