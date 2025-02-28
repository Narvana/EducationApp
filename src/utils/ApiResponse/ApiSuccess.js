
const ApiSuccess = (statusCode,data,message)=>{
        // const user=new UserCreate()
        return {
            status:1,
            statusCode,
            message,    
            data,
        }
        // return user
    }


module.exports = ApiSuccess