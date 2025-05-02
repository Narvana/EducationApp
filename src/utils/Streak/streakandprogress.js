const moment = require("moment");
const WatchHistory = require("../../models/watchHistory");

const calculateStreak = async (userID) => {
  const today = moment().startOf("day");
  const goalMinutes = 60; // 60 minutes goal
  const goalSeconds = goalMinutes * 60; // Convert to seconds for database comparison

  const histories = await WatchHistory.find({ userID })
    .sort({ date: -1 })
    .limit(30); // You can increase this if needed

  let streak = 0;
  let minutesWatchedToday = 0;
  let minutesLeft = goalMinutes;
  let streakProgress = 0;

  for (let i = 0; i < histories.length; i++) {
    const entryDate = moment(histories[i].date).startOf("day");
    const diff = today.diff(entryDate, "days");

    if (diff === 0) {
      // Convert seconds to minutes for today's watch time
      minutesWatchedToday = Math.round(
        (histories[i].totalSecondsWatched || 0) / 60
      );
      streakProgress = Math.min(
        100,
        Math.round((minutesWatchedToday / goalMinutes) * 100)
      );
      minutesLeft = Math.max(0, goalMinutes - minutesWatchedToday);
    }

    if (diff === streak) {
      // Check if they watched at least 60 minutes
      if ((histories[i].totalSecondsWatched || 0) >= goalSeconds) {
        streak++;
      } else {
        break;
      }
    } else if (diff > streak) {
      break;
    }
  }

  return {
    streak,
    minutesWatchedToday,
    minutesLeft,
    streakProgress,
  };
};

module.exports = calculateStreak;
