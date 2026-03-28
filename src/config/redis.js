import Redis from "ioredis";

const pub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const sub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

export { pub, sub };
