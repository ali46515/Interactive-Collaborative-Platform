import Redis from "ioredis";
import env from "./env.js";

const REDIS_CONFIG = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    console.warn(`Redis retry attempt ${times}, next attempt in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

const client = new Redis(REDIS_CONFIG);

const sub = new Redis(REDIS_CONFIG);

const pub = new Redis(REDIS_CONFIG);

const attachListeners = (instance, name) => {
  instance.on("connect", () => console.log(`Redis [${name}] connecting...`));
  instance.on("ready", () => console.log(`Redis [${name}] ready`));
  instance.on("error", (err) =>
    console.error(`Redis [${name}] error`, { error: err.message }),
  );
  instance.on("close", () => console.warn(`Redis [${name}] connection closed`));
  instance.on("reconnecting", () =>
    console.warn(`Redis [${name}] reconnecting...`),
  );
};

attachListeners(client, "client");
attachListeners(sub, "subscriber");
attachListeners(pub, "publisher");

const connect = async () => {
  await Promise.all([client.connect(), sub.connect(), pub.connect()]);
  console.log("Redis all clients connected");
};

const disconnect = async () => {
  await Promise.all([client.quit(), sub.quit(), pub.quit()]);
  console.log("Redis all clients disconnected");
};

export { client, sub, pub, connect, disconnect };
