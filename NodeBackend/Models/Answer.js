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
    comments:[
        {
            comment:{
                type:String,required:true
            },
            commentedBy:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            commentedAt:{
                type:Date,
                default:Date.now 
            }
        }
    ]
})

module.exports=mongoose.model("Answer",answerSchema)

