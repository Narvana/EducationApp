const moment = require("moment");
const WatchHistory = require('../models/watchHistory')

const getStreak = async (userID) => {
  const history = await WatchHistory.find({ userID })
    .sort({ date: -1 })
    .limit(30); // last 30 days

  let streak = 0;
  let currentDate = moment();

  for (const entry of history) {
    const entryDate = moment(entry.date, "YYYY-MM-DD");

    if (entryDate.isSame(currentDate, "day")) {
      if (entry.minutesWatched >= 60) {
        streak++;
        currentDate.subtract(1, "day");
      } else break;
    } else if (entryDate.isBefore(currentDate, "day")) {
      break;
    }
  }

  return streak;
};

module.exports = getStreak;
