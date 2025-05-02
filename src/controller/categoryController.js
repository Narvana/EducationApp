const { log } = require("winston");
const Category = require("../models/category");
const Course = require("../models/courses");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const mongoose = require("mongoose");
const CourseVideo = require("../models/CoursesVideos");
const CourseApplication = require("../models/courseApplication");
const RecentCourse = require("../models/recentCourse");
const WatchHistory = require("../models/watchHistory");

// Create Category
const createCategory = async (req, res) => {
  const { categoryName } = req.body;
  const image = req.file; // With Multer, single file is in `req.file`

  try {
    let categoryExists = await Category.findOne({ categoryName });
    if (categoryExists) {
      return res.status(400).json({ msg: "Category already exists" });
    }

    let categoryImg = "";
    if (image) {
      categoryImg = await uploadToFirebase(image);
      console.log(categoryImg);
    }

    const category = new Category({
      categoryName,
      image: categoryImg,
    });

    await category.save();
    res
      .status(201)
      .json(ApiSuccess(201, category, "Category created successfully"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res
      .status(200)
      .json(ApiSuccess(200, categories, "Catgeories fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find all courses in this category
      const courses = await Course.find({ CategoryID: categoryID });
      const courseIds = courses.map((course) => course._id);

      // Delete all course videos associated with these courses
      await CourseVideo.deleteMany(
        { courseID: { $in: courseIds } },
        { session }
      );

      // Delete all course applications for these courses
      await CourseApplication.deleteMany(
        { courseID: { $in: courseIds } },
        { session }
      );

      // Delete all recent courses for these courses
      await RecentCourse.deleteMany(
        {
          mediaID: {
            $in: await CourseVideo.find({
              courseID: { $in: courseIds },
            }).select("_id"),
          },
        },
        { session }
      );

      // Delete all watch history for these courses
      await WatchHistory.deleteMany(
        {
          mediaID: {
            $in: await CourseVideo.find({
              courseID: { $in: courseIds },
            }).select("_id"),
          },
        },
        { session }
      );

      // Delete the courses
      await Course.deleteMany({ CategoryID: categoryID }, { session });

      // Finally delete the category
      const deletedCategory = await Category.findByIdAndDelete(categoryID, {
        session,
      });

      if (!deletedCategory) {
        await session.abortTransaction();
        return res.status(404).json(ApiErrors(404, "Category not found!"));
      }

      // If everything is successful, commit the transaction
      await session.commitTransaction();

      res
        .status(200)
        .json(
          ApiSuccess(
            200,
            null,
            "Category and all associated courses deleted successfully!"
          )
        );
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// Update Category
const updateCategory = async (req, res) => {
  const { categoryName } = req.body;
  const image = req.file;

  try {
    const id = req.params.id;
    const categoryExist = await Category.findById(id);
    if (!categoryExist) {
      return res.status(404).json({ msg: "Category not found" });
    }

    let categoryImg = "";
    if (image) {
      try {
        categoryImg = await uploadToFirebase(image);
        console.log("Firebase URL:", categoryImg);
      } catch (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({ msg: "Error uploading image" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { categoryName, image: categoryImg || categoryExist.image },
      { new: true }
    );

    await category.save();

    res.status(200).json({ msg: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
};
