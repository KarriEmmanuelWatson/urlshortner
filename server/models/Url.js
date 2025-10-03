import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  }, // default 10 mins
});

// Optional: auto-delete expired URLs using MongoDB TTL index
urlSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Url", urlSchema);
