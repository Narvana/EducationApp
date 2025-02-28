// require('dotenv').config({});

const mongoose=require("mongoose");
const uri=process.env.URI || "mongodb+srv://education:px6qDsUxJ1LmAkgN@cluster0.jop0e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// console.log(uri);
 
const connectToDatabase = async () => {
    try {
        await mongoose.connect(uri);
      console.log('Successfully connected to MongoDB EducationAPP Database');
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1); // Exit the process with failure code
    }
  };
  
connectToDatabase();