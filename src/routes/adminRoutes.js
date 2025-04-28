const express = require("express");

const {
  createCourse,
  getCourses,
  getCourseById,
  deleteCourse,
  updateCourse,
  getCourseByIdAdmin,
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
const {
  updateEnrollmentStatus,
  getPendingApplications,
  deleteApplication,
  getAllApplications,
} = require("../controller/courseEnrollment");
const {
  getCourseRatings,
  deleteRating,
  getRatingsAll,
  addRating,
  addAdminRating,
} = require("../controller/ratingController");
const { getDashboardData } = require("../controller/dashboardController");
const { verify } = require("jsonwebtoken");
const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} = require("../controller/bannerController");
const {
  createStudentFee,
  getAllStudents,
  addPayment,
  getStudentById,
} = require("../controller/feeController");
const {
  getUnapprovedProfiles,
  approveStudent,
  getAllProfile,
} = require("../controller/studentProfile");
const verifyToken = require("../middleware/token/verifyToken.js");
const {
  createFeeEntry,
  updateFeeStatus,
  getEntries,
} = require("../controller/feeEntry.js");

const router = express.Router();

// Auth

router.post("/register-superadmin", registerSuperAdmin);
router.post("/login", loginAdmin);

// Instructors
router.post(
  "/create-instructor",
  authMiddleware,
  upload.single("image"),
  superAdminMiddleware,
  createInstructor
);

router.get("/instructors", getInstructors);

router.put(
  "/instructors/update/:id",
  authMiddleware,
  upload.single("image"),
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
    { name: "media", maxCount: 1 }, // Single file // Multiple files
  ]),
  superAdminMiddleware,
  createCourse
);

// Get all courses
router.get("/courses/get", getCourses);

// Get a single course by ID
router.get("/courses/get", getCourseByIdAdmin);

// Update a course by ID
router.put(
  "/courses/update/:id",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Single file
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
  upload.fields([
    { name: "media", maxCount: 1 }, // Single file // Multiple files
    { name: "document", maxCount: 1 }, // Single file // Multiple files
  ]),
  superAdminMiddleware,
  createVideo
);

router.put(
  "/courses/videos/update/:id",
  authMiddleware,
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
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

// Enrolled Courses pending request
router.put(
  "/enrollment/update/:id",
  authMiddleware,
  superAdminMiddleware,
  updateEnrollmentStatus
);

router.get("/enrollment/pending", getPendingApplications);

router.get("/enrollment/all", getAllApplications);

router.delete(
  "/enrollment/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteApplication
);

// Ratings & Reviews
router.get("/ratings", getRatingsAll);

router.delete(
  "/ratings/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteRating
);

// Dashboard
router.get("/dashboard", getDashboardData);

// Verify Token

// router.get("/verify-token", authMiddleware, superAdminMiddleware, verifyToken);

// Banner
router.post(
  "/banners/create",
  authMiddleware,
  superAdminMiddleware,
  upload.single("image"),
  createBanner
);
router.get("/banners/get", getBanners);
router.put(
  "/banners/update/:id",
  upload.single("image"),
  authMiddleware,
  superAdminMiddleware,
  updateBanner
);
router.delete(
  "/banners/delete/:id",
  authMiddleware,
  superAdminMiddleware,
  deleteBanner
);

// Fee Payment

// Create student fee record
router.post(
  "/student/fee/create",
  authMiddleware,
  superAdminMiddleware,
  createStudentFee
);

// Add payment to student record
router.post(
  "/student/fee/pay/:id",
  authMiddleware,
  superAdminMiddleware,
  addPayment
);

// Get all students
router.get("/student/fee", getAllStudents);

// Get single student by ID
router.get("/student/fee/:id", getStudentById);

// FEE ENTRIES

router.post(
  "/entry/create",
  authMiddleware,
  superAdminMiddleware,
  createFeeEntry
);
// router.post("/reminder/manual/:id", controller.sendManualReminder);
// router.post("/reminder/auto", controller.sendAutoReminders); // You can schedule this
router.put(
  "/entry/status/:id",
  authMiddleware,
  superAdminMiddleware,
  updateFeeStatus
);
router.get("/entries", getEntries);

// Student Profile

// Get all unapproved profiles (admin only)
router.get("/student-profile/unapproved", getUnapprovedProfiles);

router.put(
  "/student-profile/status/:id",
  authMiddleware,
  superAdminMiddleware,
  approveStudent
);

router.get("/student-profile", getAllProfile);

// Rating

router.post(
  "/rating",
  authMiddleware,
  superAdminMiddleware,
  verifyToken,
  addAdminRating
);

module.exports = router;
