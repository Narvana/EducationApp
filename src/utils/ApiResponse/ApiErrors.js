
const ApiErrors = (statusCode,message)=>{
    return {
        status:0,
        statusCode,
        // data,
        message,
    }
}

module.exports=ApiErrors
