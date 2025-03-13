const Category = require("../../models/category");
const Instructor = require("../../models/instructor");

const fetchCourseDetails = async function (next) {
  try {
    this.videosCount = this.videos.length; // Update videos count

    // Fetch Category Name
    const category = await Category.findById(this.CategoryID);
    if (category) {
      this.categoryName = category.categoryName;
    } else {
      return next(new Error("Invalid Category ID"));
    }

    // Fetch Instructor Name
    const instructor = await Instructor.findById(this.instructorID);
    if (instructor) {
      this.instructorName = instructor.name;
    } else {
      return next(new Error("Invalid Instructor ID"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { fetchCourseDetails };
