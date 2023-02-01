const mongoose = require("mongoose");

const connectDatabase = ()=>{
    mongoose.connect("mongodb+srv://sixPackProgrammer:sixPackProgrammer@cluster0.0jijw.mongodb.net/Ecommerce?retryWrites=true&w=majority",{useNewUrlParser:true,useUnifiedTopology:true})
    .then((data)=>{
        console.log(`Mongodb connected with server: `)
    })
    // .catch((err)=>{
    //     console.log(err)
    // })
    // because we handle the error in server.js
}

module.exports = connectDatabase
