const CourseVideo = require("../models/CoursesVideos");
const Course = require("../models/courses");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

// Create a new course video
const createVideo = async (req, res) => {
  try {
    console.log("Request received:", req.body);
    console.log("Uploaded file:", req.file);

    const { courseID, title, duration } = req.body;
    const file = req.file;

    // Validate course existence
    const course = await Course.findById(courseID);
    if (!course) {
      return res.status(404).json(ApiErrors(404, "Course not found!"));
    }

    let videoLink = "";
    if (file) {
      videoLink = await uploadToFirebase(file);
    }

    const newVideo = new CourseVideo({
      courseID,
      courseName: course.name,
      title,
      duration,
      video: videoLink,
    });

    await newVideo.save();

    res
      .status(201)
      .json(ApiSuccess(201, newVideo, "Video added successfully!"));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update an existing course video
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration } = req.body;
    const file = req.file; // Get uploaded file

    // Find the existing video
    const existingVideo = await CourseVideo.findById(id);
    if (!existingVideo) {
      return res
        .status(404)
        .json(ApiErrors(404, "No video found with this id"));
    }

    let videoLink = existingVideo.video; // Keep the old video if no new file is uploaded

    if (file) {
      videoLink = await uploadToFirebase(file); // Upload new video
    }

    const updatedVideo = await CourseVideo.findByIdAndUpdate(
      id,
      { title, duration, video: videoLink },
      { new: true }
    );

    res
      .status(200)
      .json(ApiSuccess(200, updatedVideo, "Updated successfully!"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Delete a course video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await CourseVideo.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Update course video count
    const course = await Course.findById(video.courseID);
    if (course) {
      course.videosCount = Math.max(0, course.videosCount - 1);
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
