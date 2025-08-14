const mongoose=require('mongoose')

const otpSchema=new mongoose.Schema({
    code:String,
    expiresAt:Date,
})


const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    role:{
        type:String,
        enum:['admin','user'],
        default:"user"
    },
    otp:otpSchema,
   
})

const User=mongoose.model("User",userSchema)


module.exports=User 
