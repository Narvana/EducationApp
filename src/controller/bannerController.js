const ApiSuccess = require("../utils/ApiResponse/ApiSuccess");
const ApiErrors = require("../utils/ApiResponse/ApiErrors");
const { uploadToFirebase } = require("../utils/firebase/firebaseConfig");
const Banner = require("../models/banner");

// CREATE banner
const createBanner = async (req, res) => {
  try {
    const file = req.file;

    let imageUrl = "";

    // Upload each image to Firebase
    if (file) {
      imageUrl = await uploadToFirebase(file);
    }

    const banner = new Banner({ image: imageUrl });
    await banner.save();

    return res
      .status(201)
      .json(ApiSuccess(201, banner, "Banner created successfully"));
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// GET all banners
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    return res
      .status(200)
      .json(ApiSuccess(200, banners, "Banners retrieved successfully"));
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

// UPDATE banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json(ApiErrors(404, "Banner not found."));
    }

    // Replace image if a new file is uploaded
    if (file) {
      const newImageUrl = await uploadToFirebase(file);
      banner.image = newImageUrl;
    }

    await banner.save();

    return res
      .status(200)
      .json(ApiSuccess(200, banner, "Banner updated successfully."));
  } catch (error) {
    console.error("Error updating banner:", error);
    return res.status(500).json(ApiErrors(500, error.message));
  }
};

// DELETE banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Banner.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json(ApiErrors(404, "Banner not found"));
    }

    return res
      .status(200)
      .json(ApiSuccess(200, deleted, "Banner deleted successfully"));
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json(ApiErrors(500, error.message));
  }
};

module.exports = {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
};
