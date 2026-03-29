const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
};

const USER_ROLES = {
  OWNER: "owner",
  MEMBER: "member",
  VIEWER: "viewer",
};

const ROOM_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
};

const MAX_ROOM_MEMBERS = 10;

const SUPPORTED_LANGUAGES = {
  javascript: { image: "node:20-alpine", cmd: ["node", "-e"], ext: "js" },
  typescript: {
    image: "node:20-alpine",
    cmd: ["npx", "ts-node", "-e"],
    ext: "ts",
  },
  python: { image: "python:3.12-alpine", cmd: ["python3", "-c"], ext: "py" },
  go: { image: "golang:1.22-alpine", cmd: ["go", "run"], ext: "go" },
  rust: {
    image: "rust:1.79-alpine",
    cmd: ["rustc", "-o", "/tmp/out"],
    ext: "rs",
  },
  java: { image: "openjdk:21-alpine", cmd: ["java", "-"], ext: "java" },
  cpp: { image: "gcc:13-alpine", cmd: ["g++", "-x", "c++", "-"], ext: "cpp" },
};

const EXECUTION_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  SUCCESS: "success",
  ERROR: "error",
  TIMEOUT: "timeout",
};

const REDIS_KEYS = {
  ROOM_USERS: (roomId) => `room:${roomId}:users`,
  ROOM_CODE: (roomId) => `room:${roomId}:code`,
  USER_SOCKET: (userId) => `user:${userId}:socket`,
  REFRESH_TOKEN: (userId) => `refresh:${userId}`,
  BLACKLIST_TOKEN: (jti) => `blacklist:${jti}`,
};

const OT_OPERATION_TYPES = {
  INSERT: "insert",
  DELETE: "delete",
  RETAIN: "retain",
};

export {
  TOKEN_TYPES,
  USER_ROLES,
  ROOM_STATUS,
  MAX_ROOM_MEMBERS,
  SUPPORTED_LANGUAGES,
  EXECUTION_STATUS,
  REDIS_KEYS,
  OT_OPERATION_TYPES,
};
