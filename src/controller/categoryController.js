const Category = require("../models/category");

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
    res.status(201).json({ msg: "Category created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  const { categoryName, image } = req.body;

  try {
    const id = req.params._id;
    const categoryExist = await Category.findOne({_id: id});
    if (!categoryExist) {
      return res.status(404).json({ msg: "Category not found" });
    }
    await Category.findByIdAndUpdate(
      { _id: req.params._id },
      { categoryName, image }
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
