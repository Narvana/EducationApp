const Course = require("../models/courses");
const CourseVideo = require("../models/CoursesVideos");
const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const Category = require("../models/category");

const CourseApplication = require("../models/courseApplication");
const Admin = require("../models/admin");

// Create a new course
const createCourse = async (req, res) => {
  const { instructorID, name, description, CategoryID, title, mediaType } =
    req.body;
  const files = req.files || {};
  const userID = req.userID;
  let createdBy = null;

  const byInstructor = await Instructor.findById(userID);

  if (byInstructor) {
    createdBy = byInstructor.name;
  } else {
    createdBy = "Admin";
  }

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
      instructorID: {
        name: "Admin";
      }
    }

    // Validate required video
    if (!files.media?.[0]) {
      return res
        .status(400)
        .json(ApiErrors(400, "First video is required for course creation."));
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

    // Upload first video
    const videoURI = await uploadToFirebase(files.media[0]);

    // Create course
    const course = new Course({
      name,
      description,
      CategoryID,
      instructorID,
      thumbnail: thumbnailURI,
      createdBy,
    });

    await course.save();

    // Create first video entry
    const media_files = new CourseVideo({
      courseID: course._id,
      courseName: name,
      title: title || "Introduction Video",
      mediaType: mediaType || "video",
      media: videoURI,
      duration: 0, // You might want to calculate this from the video file
    });

    await media_files.save();

    return res.status(201).json(
      ApiSuccess(
        201,
        {
          course,
          media_files,
        },
        "Course created successfully with first video"
      )
    );
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    let courses = await Course.find({ isVerified: true })
      .populate("CategoryID", "categoryName")
      .populate("instructorID", "name email");

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

const getUnverifiedCourses = async (req, res) => {
  try {
    let courses = await Course.find({ isVerified: false })
      .populate("CategoryID", "categoryName")
      .populate("instructorID", "name email");

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
const getAllCourses = async (req, res) => {
  try {
    let courses = await Course.find()
      .populate("CategoryID", "categoryName")
      .populate("instructorID", "name email");

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
  const userID = req.user?.id;
  try {
    const course = await Course.findById(courseID);

    if (!course) {
      return res.status(404).json(ApiErrors(404, "Course not found"));
    }

    // Check if student is enrolled
    let isEnrolled = false;
    let enrollmentStatus = "not_logged_in";

    if (userID) {
      const enrollment = await CourseApplication.findOne({
        userID,
        courseID,
      });

      if (enrollment) {
        if (enrollment.status === "Approved") {
          isEnrolled = true;
          enrollmentStatus = "Approved";
        } else if (enrollment.status === "pending") {
          isEnrolled = false;
          enrollmentStatus = "Pending";
        } else if (enrollment.status === "declined") {
          isEnrolled = false;
          enrollmentStatus = "Declined";
        }
      } else {
        isEnrolled = false;
        enrollmentStatus = "Not Applied";
      }
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
      isEnrolled,
      enrollmentStatus,
    };

    res
      .status(200)
      .json(ApiSuccess(200, coursesWithVideos, "Course fetched successfully."));
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};
const getCourseByIdAdmin = async (req, res) => {
  const { courseID } = req.query;
  try {
    const course = await Course.findById(courseID)
      .populate("CategoryID", "categoryName")
      .populate("instructorID", "name email");

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
      .json(ApiSuccess(200, coursesWithVideos, "Course fetched successfully."));
  } catch (error) {
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// Get courses by Category ID
const getCoursesByCategoryID = async (req, res) => {
  try {
    const userID = req.user ? req.user.id : null;

    // Check if category exists
    const categoryExists = await Category.findById(req.params.id);
    if (!categoryExists) {
      return res.status(404).json(ApiErrors(404, "Category does not exist"));
    }

    // Fetch all courses in the given category
    const courses = await Course.find({ CategoryID: req.params.id });

    // If no courses found

    let enrollmentMap = {};

    // If the user is logged in, fetch course applications
    if (userID) {
      const courseIDs = courses.map((course) => course._id);

      const courseApplications = await CourseApplication.find({
        courseID: { $in: courseIDs },
        userID: userID,
      }).select("status courseID");

      // Map course applications to enrollment status
      courseApplications.forEach((app) => {
        enrollmentMap[app.courseID.toString()] = app.status;
      });
    }

    // Construct response data
    const responseData = courses.map((course) => {
      const courseId = course._id.toString();
      const enrollmentStatus = enrollmentMap[courseId] || "Not Applied";

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
        isEnrolled: userID ? enrollmentStatus === "approved" : false,
        enrollmentStatus: userID ? enrollmentStatus : "not_logged_in",
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
    const { name, description, CategoryID, instructorID, isVerified } =
      req.body;
    const files = req.files;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json(ApiErrors(404, "This course does not exist!"));
    }

    // Check if thumbnail is uploaded and update it
    if (files?.thumbnail && files.thumbnail[0]) {
      course.thumbnail = await uploadToFirebase(files.thumbnail[0]);
    }

    // Update other course fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (CategoryID) course.CategoryID = CategoryID;
    if (instructorID) course.instructorID = instructorID;
    if (typeof isVerified !== "undefined") course.isVerified = isVerified;

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
  getCourseByIdAdmin,
  getUnverifiedCourses,
  getAllCourses,
};
