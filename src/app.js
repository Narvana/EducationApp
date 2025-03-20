require("dotenv").config();
require("./database/education.mongoDB");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

const express = require("express");
const multer = require("multer");

const app = express();

const mongoose = require("mongoose");



const port = process.env.PORT;

const bodyParser = require("body-parser");

const cors = require("cors");

const helmet = require("helmet");

const http = require("http");
const server = http.createServer(app);

const logger = require("./Logs/logger");
const morgan = require("morgan");

// Logging and saving LOGS
const morganFormat = (tokens, req, res) => {
  const logObject = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens["response-time"](req, res),
    contentLength: tokens.res(req, res, "content-length"),
    headers: JSON.stringify(req.headers), // Accessing request headers
    body: JSON.stringify(req.body), // Accessing request body
    // responseMessage: tokens.responseMessage(req, res),
  };
  // logger.info(JSON.stringify(logObject));
  if (tokens.status(req, res) >= 400) {
    // logger.error(tokens.responseMessage(req, res));
    logger.error(JSON.stringify(logObject)); // Log as error
    // logger.info(JSON.stringify(logObject))
  } else {
    logger.info(JSON.stringify(logObject)); // Log as info
  }
};

app.use(morgan(morganFormat));

// Body parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes

// Security
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.disable("x-powered-by");

// Database connection

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

app.get("/", (req, res, next) => {
  morgan.token(
    "responseMessage",
    (req, res) => res.locals.message || "Welcome"
  );
  res.status(200).send("Success");
});

app.get("/test/port", (req, res) => {
  morgan.token(
    "responseMessage",
    (req, res) => res.locals.message || `Secure Connection with port ${port}`
  );
  res.status(201).send(`Secure Connection with port ${port}`);
});

app.get("/test/database", (req, res) => {
  const isConnected = mongoose.connection.readyStat === 1;
  if (isConnected) {
    morgan.token(
      "responseMessage",
      (req, res) => res.locals.message || `MongoDB connection is active`
    );
    res.status(201).json({ message: "MongoDB connection is active" });
  } else {
    morgan.token(
      "responseMessage",
      (req, res) => res.locals.message || `MongoDB connection is not active`
    );
    // logger.error('MongoDB connection is not active');
    res.status(500).json({ message: "MongoDB connection is not active" });
  }
});

// Swagger
const swaggerDocs = require("./swagger");
const { LEGAL_TLS_SOCKET_OPTIONS } = require("mongodb");
swaggerDocs(app);

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      morgan.token(
        "responseMessage",
        (req, res) => res.locals.message || `${err.message}, max limit is 5MB`
      );
      return res.status(413).json({
        status: 0,
        data: "",
        statusCode: 413,
        message: `${err.message}, max limit is 5MB`,
      });
    }
  }
  if (
    err.message ===
    "Invalid file type. Only JPEG, PNG, and GIF files are allowed"
  ) {
    morgan.token(
      "responseMessage",
      (req, res) =>
        res.locals.message ||
        `Invalid file type. Only JPEG, PNG, and GIF files are allowed.`
    );
    return res.status(400).json({
      status: 0,
      data: "",
      statusCode: 400,
      message: "Invalid file type. Only JPEG, PNG, and GIF files are allowed.",
    });
  }

  const status = err.status || 0;
  const statusCode = err.statusCode || 500;
  const data = err.data || "";
  const message = err.message || "Internal Server Error";
  morgan.token("responseMessage", (req, res) => res.locals.message || message);
  res.status(statusCode).json({
    status,
    data,
    statusCode,
    message,
  });
});

// Handle 404 - Not Found
app.use("*", (req, res) => {
  morgan.token(
    "responseMessage",
    (req, res) => res.locals.message || "Route not Found"
  );
  res.status(404).json({
    status: 0,
    statusCode: 404,
    message: "Route not found",
    data: "",
  });
});

server.timeout = 60000; // Set timeout to 1 minutes
server.listen(port, () => {
  console.log(`Secure Connection with port http://localhost:${port}`);
});
