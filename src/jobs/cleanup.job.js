import Room from "../modules/room/room.model.js";
import CodeDocument from "../modules/code/code.model.js";
import { client as redis } from "../config/redis.js";
import { ROOM_STATUS } from "../utils/constants.js";
import logger from "../utils/logger.js";

const pruneCodeHistory = async () => {
  const docs = await CodeDocument.find({}, "_id history");
  let pruned = 0;

  for (const doc of docs) {
    if (doc.history.length > 500) {
      doc.pruneHistory(500);
      await doc.save();
      pruned++;
    }
  }

  logger.info("Code history pruned", {
    documentsProcessed: docs.length,
    pruned,
  });
};

const cleanupStalePresence = async () => {
  const keys = await redis.keys("room:*:users");
  let removed = 0;

  for (const key of keys) {
    const ttl = await redis.ttl(key);
    const count = await redis.hlen(key);

    if (count === 0 && ttl < 0) {
      await redis.del(key);
      removed++;
    }
  }

  logger.info("Stale presence keys cleaned", { scanned: keys.length, removed });
};

const archiveInactiveRooms = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await Room.updateMany(
    {
      status: ROOM_STATUS.ACTIVE,
      updatedAt: { $lt: thirtyDaysAgo },
    },
    { $set: { status: ROOM_STATUS.ARCHIVED } },
  );

  logger.info("Inactive rooms archived", { count: result.modifiedCount });
};

const runAll = async () => {
  logger.info("Running cleanup jobs...");
  await Promise.allSettled([
    pruneCodeHistory(),
    cleanupStalePresence(),
    archiveInactiveRooms(),
  ]);
  logger.info("Cleanup jobs complete");
};

const scheduleDaily = () => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  setTimeout(() => {
    runAll();
    setInterval(runAll, TWENTY_FOUR_HOURS);
  }, 60_000);
};

export {
  runAll,
  scheduleDaily,
  pruneCodeHistory,
  cleanupStalePresence,
  archiveInactiveRooms,
};
