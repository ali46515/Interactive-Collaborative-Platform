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

const REDIS_KEYS = {
  ROOM_USERS: (roomId) => `room:${roomId}:users`,
  ROOM_CODE: (roomId) => `room:${roomId}:code`,
  USER_SOCKET: (userId) => `user:${userId}:socket`,
  REFRESH_TOKEN: (userId) => `refresh:${userId}`,
  BLACKLIST_TOKEN: (jti) => `blacklist:${jti}`,
};

export { USER_ROLES, ROOM_STATUS, MAX_ROOM_MEMBERS, REDIS_KEYS };
