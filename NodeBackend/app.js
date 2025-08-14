const express=require('express')
const mongoose=require('mongoose')
const cors=require('cors')
const fs=require('fs')

const app=express() 

app.use(cors("*"))
app.use(express.json())
app.use('/uploads',express.statis('uploads'))


if(!fs.existsSync('uploads')){
    fs.mkdirSync('uploads')
}


async function connectDB(){
     await mongoose.connect("mongodb://localhost:27017/learning-community")
}

connectDB().then(()=>{
    console.log('connected to DB')
}).catch(()=>{
    console.log('server is listening on port 3000')
})


app.get('/',(req,res)=>{
    res.send("welcome to home root route")
})

app.listen(3000,()=>{
    console.log('server is listening on port 3000')
})