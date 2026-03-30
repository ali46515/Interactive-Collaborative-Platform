import CodeDocument from "./code.model.js";
import { transform, validate, apply } from "./code.utils.js";
import { client as redis } from "../../config/redis.js";
import { REDIS_KEYS } from "../../utils/constants.js";
import logger from "../../utils/logger.js";

const CACHE_TTL = 60 * 60 * 2;

const getCacheKey = (roomId) => REDIS_KEYS.ROOM_CODE(roomId);

const readCache = async (roomId) => {
  const raw = await redis.get(getCacheKey(roomId));
  return raw ? JSON.parse(raw) : null;
};

const writeCache = async (roomId, state) => {
  await redis.set(getCacheKey(roomId), JSON.stringify(state), "EX", CACHE_TTL);
};

const getOrCreateDocument = async (roomId, language = "javascript") => {
  const cached = await readCache(roomId);
  if (cached) return cached;

  let doc = await CodeDocument.findOne({ room: roomId });

  if (!doc) {
    doc = await CodeDocument.create({ room: roomId, language });
    logger.info("Code document created", { roomId });
  }

  const state = {
    content: doc.content,
    version: doc.version,
    language: doc.language,
  };
  await writeCache(roomId, state);
  return state;
};

const submitOperation = async (roomId, authorId, clientVersion, op) => {
  const doc = await CodeDocument.findOne({ room: roomId });
  if (!doc) {
    const err = new Error("Code document not found");
    err.statusCode = 404;
    throw err;
  }

  let transformedOp = op;

  if (clientVersion < doc.version) {
    const concurrentOps = doc.history
      .filter((h) => h.version > clientVersion)
      .sort((a, b) => a.version - b.version)
      .map((h) => h.op);

    for (const serverOp of concurrentOps) {
      const [clientTransformed] = transform(
        JSON.parse(JSON.stringify(transformedOp)),
        JSON.parse(JSON.stringify(serverOp)),
        "left",
      );
      transformedOp = clientTransformed;
    }
  }

  try {
    validate(transformedOp, doc.content);
  } catch (err) {
    logger.warn("OT validation failed", {
      roomId,
      clientVersion,
      error: err.message,
    });
    err.statusCode = 400;
    throw err;
  }

  const newContent = apply(doc.content, transformedOp);
  const newVersion = doc.version + 1;

  doc.content = newContent;
  doc.version = newVersion;
  doc.history.push({
    version: newVersion,
    op: transformedOp,
    author: authorId,
  });
  doc.pruneHistory(500);
  await doc.save();

  await writeCache(roomId, {
    content: newContent,
    version: newVersion,
    language: doc.language,
  });

  return { op: transformedOp, version: newVersion, content: newContent };
};

const getOpsSince = async (roomId, sinceVersion) => {
  const doc = await CodeDocument.findOne({ room: roomId }).select(
    "history version content language",
  );
  if (!doc) return null;

  const ops = doc.history
    .filter((h) => h.version > sinceVersion)
    .sort((a, b) => a.version - b.version);

  return {
    ops,
    currentVersion: doc.version,
    content: doc.content,
    language: doc.language,
  };
};

const changeLanguage = async (roomId, language) => {
  await CodeDocument.findOneAndUpdate({ room: roomId }, { language });
  const cached = await readCache(roomId);
  if (cached) {
    cached.language = language;
    await writeCache(roomId, cached);
  }
};

const resetDocument = async (roomId, authorId) => {
  const doc = await CodeDocument.findOne({ room: roomId });
  if (!doc) throw new Error("Code document not found");

  doc.content = "";
  doc.version += 1;
  doc.history.push({
    version: doc.version,
    op: [-(doc.content.length || 1)],
    author: authorId,
  });
  await doc.save();
  await writeCache(roomId, {
    content: "",
    version: doc.version,
    language: doc.language,
  });

  return { version: doc.version };
};

export {
  getOrCreateDocument,
  submitOperation,
  getOpsSince,
  changeLanguage,
  resetDocument,
};
