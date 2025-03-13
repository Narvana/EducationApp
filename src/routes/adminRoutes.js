const express = require("express");
const upload = require("../middleware/ImageUpload/imageUploadMiddleware");

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

// Categories
router.post(
  "/createCategory",
  authMiddleware,
  superAdminMiddleware,
  // upload.single("image"),
  createCategory
);

router.put(
  "/updateCategory/:id",
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

// Create a new course
router.post(
  "/courses/create",
  authMiddleware,
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

module.exports = router;
