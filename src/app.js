require("dotenv").config();
const connectDB = require("./database/education.mongoDB");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const express = require("express");
const multer = require("multer");
const app = express();
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const server = http.createServer(app);
const logger = require("./Logs/logger");
const morgan = require("morgan");

// Connect to MongoDB
connectDB();

// Logging and saving LOGS
const morganFormat = (tokens, req, res) => {
  const logObject = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens["response-time"](req, res),
    contentLength: tokens.res(req, res, "content-length"),
    headers: JSON.stringify(req.headers),
    body: JSON.stringify(req.body),
  };
  if (tokens.status(req, res) >= 400) {
    logger.error(JSON.stringify(logObject));
  } else {
    logger.info(JSON.stringify(logObject));
  }
};

app.use(morgan(morganFormat));

// Body parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Security
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.disable("x-powered-by");

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin/attendance", attendanceRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/client", studentRoutes);

// Health check endpoints
app.get("/", (req, res) => {
  res.status(200).send("Success");
});

app.get("/test/port", (req, res) => {
  res.status(201).send(`Secure Connection with port ${port}`);
});

app.get("/test/database", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (isConnected) {
    res.status(201).json({ message: "MongoDB connection is active" });
  } else {
    res.status(500).json({ message: "MongoDB connection is not active" });
  }
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        status: 0,
        data: "",
        statusCode: 413,
        message: `${err.message}, max limit is 5MB`,
      });
    }
  }

  const status = err.status || 0;
  const statusCode = err.statusCode || 500;
  const data = err.data || "";
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status,
    data,
    statusCode,
    message,
  });
});

// Handle 404 - Not Found
app.use("*", (req, res) => {
  res.status(404).json({
    status: 0,
    statusCode: 404,
    message: "Route not found",
    data: "",
  });
});

server.timeout = 60000; // Set timeout to 1 minute
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
