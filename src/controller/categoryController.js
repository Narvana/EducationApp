const { log } = require("winston");
const Category = require("../models/category");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");

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
    res.status(201).json({ msg: "Category created successfully", category });
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
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
