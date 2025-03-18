const multer= require('multer');
const path=require('path');
// require('../../')

// const storage = multer.memoryStorage();

// const storage= multer.diskStorage({
//     destination:function(req,file,cb){
//         // cb(null, path.join(__dirname, '../../upload/images'))
                
//         // const uploadPath = path.join(__dirname, '...', 'upload');   
//         cb(null, './upload');
        
//     },
//     filename: function(req,file,cb){
//         cb(null,Date.now() + '-' + file.originalname);
//     }
// })

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") || // Accept any image type (jpeg, png, gif, etc.)
    file.mimetype.startsWith("video/") // Accept any video type (mp4, avi, mov, etc.)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, AVI, MOV) are allowed"
      ),
      false
    );
  }
};

const upload=multer({
    storage,
    limits:{
        fileSize : 1024 * 1024 * 20
    }, 
    fileFilter: fileFilter
})

module.exports= upload

// const ApiErrors=require('../../utils/ApiResponse/ApiErrors')
// const storage= multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,"./upload/images")
//     },
//     filename: function(req,file,cb){
//         cb(null,Date.now() + '-' + file.originalname);
//     }
// })