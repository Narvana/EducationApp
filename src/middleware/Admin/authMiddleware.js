const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      "xQJslU3ieVjhYt0xCUu8hhUGayx265KgfP4W0abHhvfJJA8xFO8cYVChPGhjz0JT4w1GP3vURXdXBk8jC2Hu4W49jz"
    );

    req.user = decoded; // Attach decoded data to req
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

// Middleware to allow only Super Admins
const superAdminMiddleware = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      msg: "Access Denied! Only Super Admins can perform this action.",
    });
  }
  next();
};

module.exports = { authMiddleware, superAdminMiddleware };
