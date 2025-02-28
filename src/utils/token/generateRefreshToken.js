const jwt=require('jsonwebtoken');
const Register= require('../../model/register.model');
const ApiErrors=require('../ApiResponse/ApiErrors');


const generateRefreshToken=async(id,req,res,next)=>{
    try {
        const user=await Register.findById(id)
        const refreshToken= jwt.sign(
            {
                id:user._id,
                role:user.role,
            },'B66YpiyHZY2Dr39mVRXKmHABfMULv6aVv1ZWECLGQTum3CjQm0k5Arjp4pl2cGFmBcCtEc0LP1aktYdX6EpPSvI4K0v0Oq1LzvH3',{
            expiresIn:"10d",
        });

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return refreshToken
    } catch (error) {
        // return next(ApiErrors(500,`Something went wrong while generating Refresh token. Error: ${error}`))
        next(ApiErrors(500,`Something went wrong while generating Refresh token . Error: ${error}`))
    }
}
module.exports=generateRefreshToken 