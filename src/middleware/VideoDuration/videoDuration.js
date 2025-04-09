// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
// const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

// ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// ffmpeg.setFfprobePath(ffprobeInstaller.path);

// const getVideoDuration = (filePath) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(filePath, (err, metadata) => {
//       if (err) return reject(err);
//       const durationInSeconds = Math.round(metadata.format.duration);
//       resolve(durationInSeconds);
//     });
//   });
// };
// module.exports = { getVideoDuration };

const { getVideoDurationInSeconds } = require("get-video-duration");

const getVideoDuration = async (filePath) => {
  try {
    const duration = await getVideoDurationInSeconds(filePath);
    console.log(`Video duration: ${duration} seconds`);
    return duration;
  } catch (error) {
    console.error("Error getting video duration:", error);
    return 0;
  }
};

module.exports = { getVideoDuration };

