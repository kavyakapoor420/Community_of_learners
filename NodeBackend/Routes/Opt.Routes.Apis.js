const User = require("../Models/User")


const requestOtp=async(req,res)=>{
    const {email,name,role}=req.body 

    if(!email){
        return res.status(400).json({msg:'email is required'})
    }

    let user=await User.findOne({email})

    if(name && role){
        if(user){
            return res.status(400).json({msg:'user already exists'})
        }
        if(!['admin','user'].includes(role)){
            return res.status(400).json({msg:"invalid role"})
            
        }
        user=new User({email,name,role})
    }else{
        if(!user){
            return res.status(400).json({msg:"user not found"})
        }
    }
    

    const otp=Math.floor(100000+Math.random()*900000).toString() ;
    const expiresAt=new Date(Date.now()+5*60*1000)

    user.otp={code:otp,expiresAt}
    await user.save() 

    try{
        
    }catch(err){

    }
}


const verifyOtp=async(req,res)=>{

    const {email,otp}=req.body ;

    if(!email || !otp){
       return res.status(400).json({msg:"email and otp required"})
    }

    const user=await User.findOne({email})

    if(!user || !user.otp || user.otp.code!=otp || user.otp.expiresAt<new Date() ){
        return res.status(400).json({msg:"invalid or expired OTP"})
    }

    user.otp=undefined 
    await user.save() 

    const token=jwt.sign({id:user._id,role:user.role},JWT)
}