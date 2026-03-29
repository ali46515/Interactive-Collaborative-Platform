import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  ROOM_STATUS,
  USER_ROLES,
  SUPPORTED_LANGUAGES,
} from "../../utils/constants.js";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [3, "Room name must be at least 3 characters"],
      maxlength: [60, "Room name cannot exceed 60 characters"],
    },
    slug: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, "").slice(0, 12),
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "",
    },
    language: {
      type: String,
      enum: Object.keys(SUPPORTED_LANGUAGES),
      default: "javascript",
    },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.ACTIVE,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      select: false,
      default: null,
    },
    members: [memberSchema],
    codeSnapshot: {
      content: { type: String, default: "" },
      version: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 10,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  },
);

roomSchema.index({ slug: 1 }, { unique: true });
roomSchema.index({ "members.user": 1 });
roomSchema.index({ status: 1 });

roomSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

roomSchema.methods.hasMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

roomSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member?.role ?? null;
};

roomSchema.methods.isOwner = function (userId) {
  return this.getMemberRole(userId) === USER_ROLES.OWNER;
};

const RoomModel = mongoose.model("Room", roomSchema);

export default RoomModel;
