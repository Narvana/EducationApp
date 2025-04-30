// middleware/auth.js

const jwt = require("jsonwebtoken");
const ApiErrors = require("../../utils/ApiResponse/ApiErrors");
require("dotenv").config();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "xQJslU3ieVjhYt0xCUu8hhUGayx265KgfP4W0abHhvfJJA8xFO8cYVChPGhjz0JT4w1GP3vURXdXBk8jC2Hu4W49jz"; 

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(ApiErrors(401, "Unauthorized: No token provided"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userID = decoded.id; // assuming your token payload includes user ID as `id`
    next();
  } catch (err) {
    return res.status(401).json(ApiErrors(401, "Invalid or expired token"));
  }
};

module.exports = verifyToken;
