const express = require("express");
const {
  registerSuperAdmin,
  createInstructor,
  loginAdmin,
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

router.post("/register-superadmin", registerSuperAdmin);
router.post("/login", loginAdmin);
router.post(
  "/create-instructor",
  authMiddleware,
  superAdminMiddleware,
  createInstructor
);
router.post(
  "/createCategory",
  authMiddleware,
  superAdminMiddleware,
  createCategory
);

router.put(
  "/updateCategory/:_id",
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

module.exports = router;
