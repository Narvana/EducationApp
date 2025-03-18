const Course = require("../models/courses");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

// Create a new course
const createCourse = async (req, res) => {
  const { instructorID, name, description, CategoryID, videos } = req.body;
  const files = req.files; // Ensure multer is configured to handle multiple files

  try {
    // Check if course already exists
    let courseExists = await Course.findOne({ name });
    if (courseExists) {
      return res
        .status(400)
        .json({ message: "Course with this name already exists." });
    }

    // Upload single thumbnail image
    let thumbnailURI = "";
    if (files.thumbnail && files.thumbnail[0]) {
      thumbnailURI = await uploadToFirebase(files.thumbnail[0]); // Upload first file in 'thumbnail'
    }

    // Upload multiple video files
    let videosURI = [];
    if (files.videos) {
      await Promise.all(
        files.videos.map(async (videoFile, index) => {
          let videoURL = await uploadToFirebase(videoFile);
          videosURI.push({
            title: `Video ${index + 1}`, // Assign default title if not provided
            url: videoURL,
            duration: 0, // Placeholder; ideally, get duration from metadata
          });
        })
      );
    }

    // Check if instructor exists
    const instructor = await Instructor.findById(instructorID);
    if (!instructor) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    // Create course
    const course = new Course({
      name,
      description,
      CategoryID,
      instructorID,
      thumbnail: thumbnailURI,
      videos: videosURI,
      videosCount: videosURI.length, // Auto-calculate videos count
    });

    await course.save();

    res
      .status(201)
      .json(ApiSuccess(201, course, "Course created successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    let courses = await Course.find();

    res
      .status(200)
      .json(ApiSuccess(200, courses, "Courses fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "This course does not exist!" });
    }
    res
      .status(200)
      .json(ApiSuccess(200, course, "Course fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Update a course by ID
const updateCourse = async (req, res) => {
  try {
    const { name, description, CategoryID, instructorID, videos } = req.body;
    const files = req.files; // Get uploaded files

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ status: 0, message: "This course does not exist!" });
    }

    // 🔹 Check if thumbnail is uploaded and update it
    if (files?.thumbnail && files.thumbnail[0]) {
      course.thumbnail = await uploadToFirebase(files.thumbnail[0]); // Fix: Use [0] for single file
    }

    // 🔹 Replace videos if new ones are uploaded
    if (files?.videos && files.videos.length > 0) {
      let newVideos = [];
      await Promise.all(
        files.videos.map(async (video) => {
          let videoURL = await uploadToFirebase(video);
          newVideos.push({ title: video.originalname, url: videoURL });
        })
      );
      course.videos = newVideos; // ❌ Remove old videos and replace with new ones
    }

    // 🔹 Replace YouTube video links if provided in the request body
    if (videos) {
      let videoData = JSON.parse(videos); // Convert stringified JSON to object
      course.videos = videoData; // ❌ Replace old videos with new ones
    }

    // 🔹 Update other course fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (CategoryID) course.CategoryID = CategoryID;
    if (instructorID) course.instructorID = instructorID;
    course.videosCount = course.videos.length;

    await course.save();

    res
      .status(200)
      .json(ApiSuccess(200, course, "Course updated successfully."));
  } catch (error) {
    console.error(error); // 🔹 Log the error for debugging
    res.status(400).json({ status: 0, message: error.message });
  }
};



// Delete a course by ID
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ status: 0, message: "This course does not exist!" });
    }
    res
      .status(200)
      .json({ status: 1, message: "Course has been deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getCourseById,
  getCourses,
  deleteCourse,
};
