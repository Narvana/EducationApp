const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const Course = require("../models/courses");

const updateInstructor = async (req, res) => {
  const { name, email, password, contact, idProof } = req.body;
  const file = req.file;
  try {
    const instructorExists = await Instructor.findById(req.params.id);

    if (!instructorExists) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    let imageLink = instructorExists.image;
    if (file) {
      imageLink = await uploadToFirebase(file);
    }

    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { name, email, password, contact, idProof, image: imageLink },
      {
        new: true,
      }
    );

    if (!instructor) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          instructor,
          "Instructure details has been succesfully updated!"
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const getInstructor = async (req, res) => {
  try {
    const instructors = await Instructor.find();

    // For each instructor, fetch their courses
    // const instructorWithCourses = await Promise.all(
    //   instructors.map(async (instructor) => {
    //     const courses = await Course.find({
    //       instructorID: ObjectId(instructor._id),
    //     });

    //     return {
    //       ...instructor.toObject(),
    //       courses,
    //     };
    //   })
    // );

    let courses = [];

    instructors.forEach(async (instructor) => {
      const course = await Course.find({
        instructorID: ObjectId(instructor._id),
      });
      courses.push(course);
    });

    console.log(courses);

    res
      .status(200)
      .json(
        ApiSuccess(
          200,
          instructorWithCourses,
          "Instructors with courses fetched successfully."
        )
      );
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

const deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!instructor) {
      return res
        .status(404)
        .json({ status: 0, message: "Instructor not found!" });
    }

    res
      .status(200)
      .json({ status: 1, message: "Instructor deleted successfully." });
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = { getInstructor, deleteInstructor, updateInstructor };
