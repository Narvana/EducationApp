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

// const { getVideoDurationInSeconds } = require("get-video-duration");

// const getVideoDuration = async (filePath) => {
//   try {
//     const duration = await getVideoDurationInSeconds(filePath);
//     console.log(`Video duration: ${duration} seconds`);
//     return duration;
//   } catch (error) {
//     console.error("Error getting video duration:", error);
  
//   }
// };

// module.exports = { getVideoDuration };

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
ffmpeg.setFfprobePath(ffprobe.path);

/**
 * Save buffer to temp file and get duration
 */
const getVideoDuration = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join("/tmp", Date.now() + "-" + originalName);
    fs.writeFileSync(tempFilePath, buffer);

    ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = Math.round(metadata.format.duration);
      // Clean up
      fs.unlinkSync(tempFilePath);
      resolve(duration);
    });
  });
};

module.exports = { getVideoDuration };







