const Instructor = require("../models/instructor");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

const updateInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
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
    res.status(400).json({ status: 0, message: error.message });
  }
};

const getInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.find();
    res
      .status(200)
      .json(ApiSuccess(200, instructor, "Instructor fetched successfully."));
  } catch (error) {
    res.status(500).json(ApiErrors(500, error.message ));
  }
};

const deleteInstructor = async (req, res) => {
  try {
    const instructor = await findByIdAndDelete(req.params.id);
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
