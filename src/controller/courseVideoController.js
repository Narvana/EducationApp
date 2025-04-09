const { getVideoDuration } = require("../middleware/VideoDuration/videoDuration");
const CourseVideo = require("../models/CoursesVideos");
const Course = require("../models/courses");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

// Create a new course video
const createVideo = async (req, res) => {
  try {
    const { courseID, title, mediaType, duration } = req.body;
    const files = req.files;
     const buffer = files.buffer;

    const course = await Course.findById(courseID);
    if (!course) {
      return res.status(404).json(ApiErrors(404, "Course not found!"));
    }

    // if (mediaType !== "pdf" && !duration) {
    //   return res
    //     .status(400)
    //     .json({ message: "Duration is required for videos and audio files" });
    // }

    let mediaLink = "";
    let documentLink = "";
    let mediaDuration = 0;

    if (files?.media?.[0]) {
      mediaLink = await uploadToFirebase(files.media[0]); // this must be a valid file object
    }

    if (files?.document?.[0]) {
      documentLink = await uploadToFirebase(files.document[0]);
    }
    if (mediaType === "video" || mediaType === "audio") {
    try {
      mediaDuration = await getVideoDuration(mediaLink);
      console.log("✔ Duration:", duration);
    } catch (error) {
      console.error("❌ Render error:", error.message);
      console.error("❌ Full stack:", error.stack);
    }
    }

    const newMedia = new CourseVideo({
      courseID,
      courseName: course.name,
      title,
      mediaType,
      duration: mediaType !== "pdf" ? mediaDuration : 0,
      media: mediaLink,
      document: documentLink,
    });

    await newMedia.save();

    res
      .status(201)
      .json(ApiSuccess(201, newMedia, "Media added successfully!"));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update an existing course video
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, mediaType } = req.body;
    const files = req.files; // Get uploaded file

    // Find the existing video
    const existingVideo = await CourseVideo.findById(id);
    if (!existingVideo) {
      return res
        .status(404)
        .json(ApiErrors(404, "No video found with this id"));
    }

    let mediaLink = existingVideo.video; // Keep the old video if no new file is uploaded
    let documentLink = existingVideo?.document; // Keep the old document if no new file is uploaded

    if (files?.media?.[0]) {
      mediaLink = await uploadToFirebase(files.media[0]); // this must be a valid file object
    }

    if (files?.document?.[0]) {
      documentLink = await uploadToFirebase(files.document[0]);
    }

    const updatedMedia = await CourseVideo.findByIdAndUpdate(
      id,
      {
        title,
        duration: mediaType !== "pdf" ? duration : 0,
        mediaType,
        media: mediaLink,
        document: documentLink,
      },
      { new: true }
    );

    res
      .status(200)
      .json(ApiSuccess(200, updatedMedia, "Updated successfully!"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Delete a course video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await CourseVideo.findByIdAndDelete(id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Update course video count
    const course = await Course.findById(media.courseID);
    if (course) {
      course.mediaCount = Math.max(0, course.mediaCount - 1);
      await course.save();
    }

    res.status(200).json({ status: 1, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getVideosByCourseID = async (req, res) => {
  try {
    const { courseID } = req.params;
    const videos = await CourseVideo.find({ courseID });

    if (!videos.length) {
      return res
        .status(404)
        .json({ message: "No videos found for this course" });
    }

    res
      .status(200)
      .json(ApiSuccess(200, videos, "Videos fetched successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = { createVideo, updateVideo, deleteVideo, getVideosByCourseID };
