const express = require("express");

const {
  createCourse,
  getCourses,
  getCourseById,
  deleteCourse,
  updateCourse,
} = require("../controller/coursescontroller");
const {
  registerSuperAdmin,
  createInstructor,
  loginAdmin,
  getInstructors,
} = require("../controller/adminController");
const {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
} = require("../controller/categoryController");
const {
  authMiddleware,
  superAdminMiddleware,
} = require("../middleware/Admin/authMiddleware");

const {
  createVideo,
  updateVideo,
  deleteVideo,
  getVideosByCourseID,
} = require("../controller/courseVideoController");
const upload = require("../middleware/ImageUpload/imageUploadMiddleware");
const {
  getStudent,
  updateStudent,
  createStudent,
  deleteStudent,
} = require("../controller/studentController");
const {
  updateInstructor,
  deleteInstructor,
} = require("../controller/instructorController");

const router = express.Router();

// Auth

router.post("/register-superadmin", registerSuperAdmin);
router.post("/login", loginAdmin);

// Instructors
router.post(
  "/create-instructor",
  authMiddleware,
  superAdminMiddleware,
  createInstructor
);

router.get("/instructors", getInstructors);

router.put(
  "/instructors/update/:id",
  authMiddleware,
  superAdminMiddleware,
  updateInstructor
);

router.delete(
  "/instructors/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteInstructor
);

// Categories
router.post(
  "/createCategory",
  authMiddleware,
  superAdminMiddleware,
  upload.single("image"),
  createCategory
);

router.put(
  "/updateCategory/:id",
  upload.single("image"),
  authMiddleware,
  superAdminMiddleware,
  updateCategory
);

router.get("/getCategories", getCategories);
router.delete(
  "/deleteCategory/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteCategory
);

// Courses

router.post(
  "/courses/create",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Single file // Multiple files
  ]),
  superAdminMiddleware,
  createCourse
);

// Get all courses
router.get("/courses/get", getCourses);

// Get a single course by ID
router.get("/courses/get/:id", getCourseById);

// Update a course by ID
router.put(
  "/courses/update/:id",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Single file
    { name: "videos", maxCount: 10 }, // Multiple files
  ]),
  superAdminMiddleware,
  updateCourse
);

// Delete a course by ID
router.delete(
  "/courses/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteCourse
);

// Course Videos

router.post(
  "/courses/videos/add",
  authMiddleware,
  upload.single("video"),
  superAdminMiddleware,
  createVideo
);

router.put(
  "/courses/videos/update/:id",
  authMiddleware,
  upload.single("video"),
  superAdminMiddleware,
  updateVideo
);

router.delete(
  "/courses/videos/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteVideo
);

router.get("/courses/videos/:courseID", getVideosByCourseID);

// Students

router.get("/students", getStudent);
router.post(
  "/students/create",
  createStudent,
  authMiddleware,
  superAdminMiddleware
);
router.put(
  "/students/update/:id",
  updateStudent,
  authMiddleware,
  superAdminMiddleware
);
router.delete(
  "/students/delete/:id",
  deleteStudent,
  authMiddleware,
  superAdminMiddleware
);

module.exports = router;
