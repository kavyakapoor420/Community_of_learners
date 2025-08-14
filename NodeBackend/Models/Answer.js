const mongoose=require('mongoose')


const commentSchema=new mongoose.Schema({

    comment:String,
    commentedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
})

const answerSchema=new mongoose.Schema({

    videoId:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"Video"
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Video'
    },
    fileUrl:{
        type:String,
        required:true
    },
    comments:commentSchema
})

module.exports=mongoose.model("Answer",answerSchema)

