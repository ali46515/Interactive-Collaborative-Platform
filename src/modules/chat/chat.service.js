import ChatMessage from "./chat.model.js";

const getHistory = async (roomId, limit = 50, before = null) => {
  const query = { room: roomId };
  if (before) query.createdAt = { $lt: new Date(before) };
  return ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "username avatar")
    .then((msgs) => msgs.reverse());
};

const saveMessage = async (roomId, authorId, content, type = "text") => {
  const msg = await ChatMessage.create({
    room: roomId,
    author: authorId,
    content,
    type,
  });
  return msg.populate("author", "username avatar");
};

export { getHistory, saveMessage };
