// middleware/auth.js

const jwt = require("jsonwebtoken");
const ApiErrors = require("../../utils/ApiResponse/ApiErrors");
require("dotenv").config();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "xQJslU3ieVjhYt0xCUu8hhUGayx265KgfP4W0abHhvfJJA8xFO8cYVChPGhjz0JT4w1GP3vURXdXBk8jC2Hu4W49jz";

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(ApiErrors(401, "Unauthorized: No token provided"));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(ApiErrors(401, "Unauthorized: Invalid token format"));
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res
        .status(401)
        .json(ApiErrors(401, "Unauthorized: Invalid token payload"));
    }

    req.userID = decoded.id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(ApiErrors(401, "Unauthorized: Token has expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json(ApiErrors(401, "Unauthorized: Invalid token"));
    }
    console.error("Token verification error:", err);
    return res
      .status(500)
      .json(ApiErrors(500, "Internal server error during token verification"));
  }
};

module.exports = verifyToken;
