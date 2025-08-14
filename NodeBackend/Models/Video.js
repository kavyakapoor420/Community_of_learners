const mongoose=require('mongoose')

const videoSchema=new mongoose.Schema({

    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    videoUrl:{
        type:String,
        required:true,
    },
    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    postedAt:{
        type:Date,
        default:Date.now 
    }
})

module.exports=mongoose.model("Video",videoSchema)

