import { pub, sub } from "../config/redis.js";
import logger from "../utils/logger.js";

const subscriptions = new Map();

const publish = async (channel, payload) => {
  try {
    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    await pub.publish(channel, message);
  } catch (err) {
    logger.error("Redis publish error", { channel, error: err.message });
  }
};

const subscribe = async (channel, handler) => {
  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, new Set());
    await sub.subscribe(channel);
    logger.debug("Redis subscribed", { channel });
  }
  subscriptions.get(channel).add(handler);
};

const unsubscribe = async (channel, handler) => {
  const handlers = subscriptions.get(channel);
  if (!handlers) return;

  handlers.delete(handler);

  if (handlers.size === 0) {
    subscriptions.delete(channel);
    await sub.unsubscribe(channel);
    logger.debug("Redis unsubscribed", { channel });
  }
};

const psubscribe = async (pattern, handler) => {
  await sub.psubscribe(pattern);
  sub.on("pmessage", (pat, channel, message) => {
    if (pat === pattern) {
      try {
        handler(channel, JSON.parse(message));
      } catch {
        handler(channel, message);
      }
    }
  });
};

sub.on("message", (channel, message) => {
  const handlers = subscriptions.get(channel);
  if (!handlers) return;

  let payload;
  try {
    payload = JSON.parse(message);
  } catch {
    payload = message;
  }

  for (const handler of handlers) {
    try {
      handler(payload);
    } catch (err) {
      logger.error("Redis message handler error", {
        channel,
        error: err.message,
      });
    }
  }
});

const set = async (key, value, ttlSeconds) => {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (ttlSeconds) {
    await pub.set(key, serialized, "EX", ttlSeconds);
  } else {
    await pub.set(key, serialized);
  }
};

const get = async (key) => {
  const raw = await pub.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const del = async (...keys) => pub.del(...keys);

export { publish, subscribe, unsubscribe, psubscribe, set, get, del };
