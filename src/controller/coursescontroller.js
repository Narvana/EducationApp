const Course = require("../models/courses");
const CourseVideo = require("../models/CoursesVideos");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const Category = require("../models/category");
const courseApplication = require("../models/courseApplication");
const CourseApplication = require("../models/courseApplication");

// Create a new course
const createCourse = async (req, res) => {
  const { instructorID, name, description, CategoryID } = req.body;
  const files = req.files || {};

  try {
    const categoryExists = await Category.findById(CategoryID);
    if (!categoryExists) {
      return res.status(404).json(ApiErrors(404, "Category does not exists!"));
    }

    const courseExists = await Course.findOne({ name });

    if (courseExists) {
      return res
        .status(400)
        .json(ApiErrors(400, "Course with this name already exists."));
    }

    // Ensure instructor exists
    const instructor = await Instructor.findById(instructorID);
    if (!instructor) {
      return res.status(404).json(ApiErrors(404, "Instructor not found"));
    }

    // Upload thumbnail (required)
    let thumbnailURI = "";
    if (files.thumbnail?.[0]) {
      thumbnailURI = await uploadToFirebase(files.thumbnail[0]);
    } else {
      return res
        .status(400)
        .json(ApiErrors(400, "Thumbnail image is required."));
    }

    // Create course
    const course = new Course({
      name,
      description,
      CategoryID,
      instructorID,
      thumbnail: thumbnailURI,
    });

    await course.save();
    return res
      .status(201)
      .json(ApiSuccess(201, course, "Course created successfully"));
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    let courses = await Course.find()
      .populate("CategoryID", "categoryName") // Fetch category details
      .populate("instructorID", "name");

    // Fetch videos for each course
    const courseIDs = courses.map((course) => course._id);
    const videos = await CourseVideo.find({ courseID: { $in: courseIDs } });
    console.log("Videos from database", videos);

    const totalDuration = (course) =>
      videos
        .filter((video) => video.courseID.toString() === course._id.toString())
        .map((v) => v.duration)
        .reduce((a, b) => a + b, 0);

    const filteredVideos = (course) =>
      videos.filter(
        (video) => video.courseID.toString() === course._id.toString()
      );

    // Attach videos to their respective courses
    const coursesWithVideos = courses.map((course) => {
      return {
        ...course.toObject(),
        mediaCount: filteredVideos(course).length,
        courseDuration: totalDuration(course),
        media_files: filteredVideos(course),
      };
    });

    res
      .status(200)
      .json(
        ApiSuccess(200, coursesWithVideos, "Courses fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  const { courseID } = req.query;
  try {
    const course = await Course.findById(courseID);
    if (!course) {
      return res.status(404).json(ApiErrors(404, "Course not found"));
    }

    const videos = await CourseVideo.find({ courseID });
    console.log("Videos from database", videos);

    const totalDuration = () =>
      videos?.map((v) => v.duration).reduce((a, b) => a + b, 0);

    // Attach videos to their respective courses
    const coursesWithVideos = {
      ...course?.toObject(),
      mediaCount: videos?.length,
      courseDuration: totalDuration(),
      media_files: videos,
    };

    res
      .status(200)
      .json(
        ApiSuccess(200, coursesWithVideos, "Courses fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get courses by Catgeory ID

const getCoursesByCategoryID = async (req, res) => {
  try {
    const userID = req.user ? req.user.id : null; // Check if user is logged in

    // Fetch all courses in the given category
    const courses = await Course.find({ CategoryID: req.params.id })
     

    // If no courses found
    if (!courses || courses.length === 0) {
      return res
        .status(404)
        .json(
          ApiErrors(404, "There are no courses available in this category")
        );
    }

    let enrollmentMap = {};

    // If the user is logged in, fetch course applications
    if (userID) {
      const courseIDs = courses.map((course) => course._id);

      const courseApplications = await CourseApplication.find({
        courseID: { $in: courseIDs },
        userID: userID, // Only fetch applications for the logged-in user
      }).select("status courseID");

      // Map course applications to enrollment status
      courseApplications.forEach((app) => {
        enrollmentMap[app.courseID.toString()] = app.status;
      });
    }

    // Construct response data
    const responseData = courses.map((course) => {
      const courseId = course._id.toString();
      const enrollmentStatus = enrollmentMap[courseId] || "not applied";

      return {
        _id: course._id,
        name: course.name,
        thumbnail: course.thumbnail,
        description: course.description,
        mediaCount: course.mediaCount,
        rating: course.rating,
        ratingCount: course.ratingCount,
        courseDuration: course.courseDuration,
        CategoryID: course.CategoryID,
        instructorID: course.instructorID,
        isEnrolled: userID ? enrollmentStatus === "approved" : false, // Only check if user is logged in
        enrollmentStatus: userID ? enrollmentStatus : "not logged in", // If not logged in, show "not logged in"
      };
    });

    return res
      .status(200)
      .json(ApiSuccess(200, responseData, "Courses fetched successfully"));
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};


// Update a course by ID
const updateCourse = async (req, res) => {
  try {
    const { name, description, CategoryID, instructorID } = req.body;
    const files = req.files; // Get uploaded files

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json(ApiErrors(404, "This course does not exist!"));
    }

    // 🔹 Check if thumbnail is uploaded and update it
    if (files?.thumbnail && files.thumbnail[0]) {
      course.thumbnail = await uploadToFirebase(files.thumbnail[0]); // Fix: Use [0] for single file
    }

    // 🔹 Update other course fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (CategoryID) course.CategoryID = CategoryID;
    if (instructorID) course.instructorID = instructorID;

    await course.save();

    res
      .status(200)
      .json(ApiSuccess(200, course, "Course updated successfully."));
  } catch (error) {
    res.status(400).json(ApiErrors(500, error.message));
  }
};

// Delete a course by ID
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json(ApiErrors(404, "This course does not exist!"));
    }
    res
      .status(200)
      .json({ status: 1, message: "Course has been deleted successfully" });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  createCourse,
  updateCourse,
  getCourseById,
  getCourses,
  deleteCourse,
  getCoursesByCategoryID,
};
