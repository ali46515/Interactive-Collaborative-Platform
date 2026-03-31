import env from "../../../config/env.js";

const limits = {
  CpuQuota: env.SANDBOX_CPU_QUOTA,
  CpuPeriod: 100000,

  Memory: env.SANDBOX_MEMORY_LIMIT,
  MemorySwap: env.SANDBOX_MEMORY_LIMIT,

  NetworkDisabled: env.SANDBOX_NETWORK_DISABLED,

  PidsLimit: 64,

  SecurityOpt: ["no-new-privileges"],

  ReadonlyRootfs: true,

  Tmpfs: { "/tmp": "size=32m,noexec" },

  TIMEOUT_MS: env.SANDBOX_TIMEOUT_MS,

  MAX_OUTPUT_BYTES: 1024 * 256,
};

export default limits;
