const moment = require("moment");
const WatchHistory = require("../../models/watchHistory");

const calculateStreak = async (userID) => {
  const today = moment().startOf("day");
  const goalSeconds = 60 * 60; // 60 minutes = 3600 seconds

  const histories = await WatchHistory.find({ userID })
    .sort({ date: -1 })
    .limit(30); // You can increase this if needed

  let streak = 0;
  let secondsWatchedToday = 0;
  let secondsLeft = goalSeconds;
  let streakProgress = 0;

  for (let i = 0; i < histories.length; i++) {
    const entryDate = moment(histories[i].date).startOf("day");
    const diff = today.diff(entryDate, "days");

    if (diff === 0) {
      secondsWatchedToday = histories[i].totalSecondsWatched || 0;
      streakProgress = Math.min(
        100,
        Math.round((secondsWatchedToday / goalSeconds) * 100)
      );
      secondsLeft = Math.max(0, goalSeconds - secondsWatchedToday);
    }

    if (diff === streak) {
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
    secondsWatchedToday,
    secondsLeft,
    streakProgress,
  };
};

module.exports = calculateStreak;
