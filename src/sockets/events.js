const EVENTS = {
  ROOM: {
    JOIN: "room:join",
    LEAVE: "room:leave",
    UPDATED: "room:updated",
    ARCHIVED: "room:archived",
  },

  PRESENCE: {
    USER_JOINED: "presence:user_joined",
    USER_LEFT: "presence:user_left",
    USER_LIST: "presence:user_list",
    TYPING: "presence:typing",
  },
};

export default EVENTS;
