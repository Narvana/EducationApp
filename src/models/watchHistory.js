const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: { type: String, required: true },
    totalSecondsWatched: { type: Number, default: 0 },
  },
  { timestamps: true }
);

watchHistorySchema.index({ userID: 1, date: 1 }, { unique: true });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

module.exports = WatchHistory;
