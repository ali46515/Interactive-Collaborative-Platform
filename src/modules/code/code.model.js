import mongoose from "mongoose";

const operationSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    op: { type: mongoose.Schema.Types.Mixed, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedAt: { type: Date, default: Date.now },
    metadata: {
      cursorBefore: Number,
      cursorAfter: Number,
      selectionLength: Number,
    },
  },
  { _id: false },
);

const codeDocumentSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true,
    },
    content: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "javascript",
    },
    history: {
      type: [operationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

codeDocumentSchema.index({ "history.version": 1 });

codeDocumentSchema.methods.pruneHistory = function (keep = 500) {
  if (this.history.length > keep) {
    this.history = this.history.slice(this.history.length - keep);
  }
};

const CodeModel = mongoose.model("CodeDocument", codeDocumentSchema);

export default CodeModel;
