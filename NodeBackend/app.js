const express=require('express')
const mongoose=require('mongoose')
const cors=require('cors')

const app=express() 

app.use(cors("*"))


app.get('/',(req,res)=>{
    res.send("welcome to home root route")
})

app.listen(3000,()=>{
    console.log('server is listening on port 3000')
})