const jwt=require('jsonwebtoken');
const Register = require('../../models/admin');
const Instructor = require('../../models/instructor');
const ApiErrors=require('../ApiResponse/ApiErrors');

const generateAccessToken=async(id,req,res)=>{
    try {

           const user=await Register.findById(id) || await Instructor.findById(id);

           if (!user) {
             console.log("User not found");
             return null;
           }

            const accessToken = jwt.sign(
              {
                id: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email,
              },
              "xQJslU3ieVjhYt0xCUu8hhUGayx265KgfP4W0abHhvfJJA8xFO8cYVChPGhjz0JT4w1GP3vURXdXBk8jC2Hu4W49jz",
              {
                expiresIn: "1d",
              }
            );

            console.log(accessToken);
            

            return accessToken

    } catch (error) {
        // next(ApiErrors(500,`Something went wrong while generating access token . Error: ${error}`));
        console.log(error);
        
        
    }
}
module.exports=generateAccessToken 