const limitter=require('express-rate-limit')

const Limitter=limitter({
    windowMs: 1 * 60 * 1000,
    max: 5,
    keyGenerator: (req,res) => {
      console.log(req.headers['x-forwarded-for']);
      console.log(req.connection.remoteAddress);
      
       return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      },
    message:{
        code:429,
        message:"Too many Request. Try after sometime"
    }
 }
)

module.exports=Limitter 