const mongoose = require("mongoose");

const connectDatabase = ()=>{
    mongoose.connect(process.env.DB_URI,{useNewUrlParser:true,useUnifiedTopology:true})
    .then((data)=>{
        console.log(`Mongodb connected with server: `)
    })
    // .catch((err)=>{
    //     console.log(err)
    // })
    // because we handle the error in server.js
}

module.exports = connectDatabase