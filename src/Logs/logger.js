const { createLogger, format, transports } =require("winston");
const { combine, timestamp, json, colorize } = format;

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
  format.colorize(),
  format.printf(({ level, message, timestamp }) => {
    return `${level}: ${message}`;
  })
);

// Create a Winston logger
const logger = createLogger({
  // level: "info",
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: consoleLogFormat,
    }),

    // General file logging (all levels, except errors)
    new transports.File({
      filename: "Logs/app.log",
      level: "info", // Logs info, warn, and error levels
      // format: consoleLogFormat,
    }),

    // Error logs only go into error.log
    new transports.File({
      filename: "Logs/error.log",
      level: "error", // Only logs error-level messages
      // format: consoleLogFormat
    }),
  ],
});

module.exports = logger;