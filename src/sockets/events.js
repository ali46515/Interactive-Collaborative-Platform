const EVENTS = {
  ROOM: {
    JOIN: "room:join",
    LEAVE: "room:leave",
    UPDATED: "room:updated",
    ARCHIVED: "room:archived",
  },

  CODE: {
    JOIN: "code:join",
    CATCHUP: "code:catchup",
    OPERATION: "code:operation",
    ACK: "code:ack",
    ROLLBACK: "code:rollback",
    CURSOR: "code:cursor",
    SELECTION: "code:selection",
    LANGUAGE_CHANGE: "code:language_change",
    RESET: "code:reset",
  },

  PRESENCE: {
    USER_JOINED: "presence:user_joined",
    USER_LEFT: "presence:user_left",
    USER_LIST: "presence:user_list",
    TYPING: "presence:typing",
  },

  CHAT: {
    MESSAGE: "chat:message",
    HISTORY: "chat:history",
    TYPING_START: "chat:typing_start",
    TYPING_STOP: "chat:typing_stop",
  },

  EXECUTION: {
    RUN: "execution:run",
    OUTPUT: "execution:output",
    DONE: "execution:done",
    ERROR: "execution:error",
    CANCEL: "execution:cancel",
  },

  SYSTEM: {
    ERROR: "system:error",
    RECONNECT: "system:reconnect",
  },
};

export default EVENTS;
