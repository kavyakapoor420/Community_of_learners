
const multer=require('multer')

const storage=multer.diskStorage({
  
    destination:(req,file,cb)=>{
        cb(null,'uploads/')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-'+file.originalname) 
    }
})


const fileFilter=(req,res,cb)=>{
    const allowedTypes=/^(image\/(jpg|jpeg|png)|application\/pdf)$/;

    if(!file.mimetype.match(allowedTypes)){
        return cb(new Error('Invalid file type . Only JPG,PNG PDF format is allowed'))
    }
    cb(null,true)
}

const upload=multer({storage,fileFilter})

module.exports=upload 
