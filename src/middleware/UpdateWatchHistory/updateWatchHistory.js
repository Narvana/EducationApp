const moment = require("moment");
const WatchHistory = require("../../models/watchHistory");

const updateWatchHistory = async (userID, secondsWatched) => {
  const today = moment().startOf("day").toDate();

  const history = await WatchHistory.findOne({ userID, date: today });

  if (history) {
    history.totalWatched += secondsWatched;
    await history.save();
  } else {
    await WatchHistory.create({
      userID,
      date: today,
      totalWatched: secondsWatched,
    });
  }
};

module.exports = { updateWatchHistory };
