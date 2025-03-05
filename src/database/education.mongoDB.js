// require('dotenv').config({});

const mongoose = require("mongoose");
const uri =
  process.env.URI ||
  "mongodb+srv://akashshrestha03:Akash%400304@cluster0.bce8v.mongodb.net/educationApp?retryWrites=true&w=majority";

// console.log(uri);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB EducationAPP Database");
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit the process with failure code
  }
};

connectToDatabase();
