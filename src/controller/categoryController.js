const Category = require("../models/category");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");

// Create Category
const createCategory = async (req, res) => {
  const { categoryName, image } = req.body;

  try {
    let categoryExists = await Category.findOne({ categoryName });
    if (categoryExists)
      return res.status(400).json({ msg: "Category already exists" });

    const category = new Category({
      categoryName,
      image,
    });

    await category.save();
    res
      .status(201)
      .json(ApiSuccess(201, category, "Category created successfully"));
  } catch (error) {
    res.status(500).json(ApiErrors(500, { error: error.message }));
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
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  const { categoryName, image } = req.body;


  try {
    const id = req.params.id;
    const categoryExist = await Category.findById(id);
    if (!categoryExist) {
      return res.status(404).json({ msg: "Category not found" });
    }

    await Category.findByIdAndUpdate(
      id,
      { categoryName, image: image || categoryExist.image },
      { new: true }
    );

    res.status(200).json({ msg: "Category updated successfully" });
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
