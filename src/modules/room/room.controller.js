import { v4 as uuid } from "uuid";
import Room from "./room.model.js";

const createRoom = async (req, res) => {
  const roomId = uuid();

  const room = await Room.create({ roomId });

  res.json({ roomId: room.roomId });
};

export { createRoom };
