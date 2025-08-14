
const jwt=require('jsonwebtoken')

const JWT_SECRET='abcd'

const auth=(req,res,next)=>{

    const token=req.header("Authorization")?.replace("Bearer",'')

    if(!token){
        return res.status(401).json({msg:'no token provided'})
    }

    try{
        const decoded=jwt.verify(token,JWT_SECRET)
        req.user=decoded 
        next() 

    }catch(err){
        res.status(401).json({msg:'invalid token'})
    }
}

