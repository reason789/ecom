const mongoose = require("mongoose");
// new keyword confusion
const productSchema =  mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter product name"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Please Enter product description"]
    },
    price:{
        type:Number,
        required:[true,"Please Enter product price"],
        maxLength:[8,"Price cannot exceed 8 characters"]
    },
    ratings:{
        type:Number,
        default: 0
    },
    images:[
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required: true
            }
        }
    ],
    category:{
        type:String,
        required: [true,"Please enter product category"]
        //enum -- we will fixed the options
    },
    stock:{
        type:Number,
        required:[true,"Please Enter product stock"],
        maxLength:[4,"Stock cannot excee 4 characters"],
        default: 1
    },
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.ObjectId,
                ref:"User",
                required: true
            },
            name:{
                type:String,
                required:true
            },
            rating:{
                type:Number,
                required: true
            },
            comment:{
                type:String,
                required:true
            }
        }
    ],

    // user will track who create product 
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required: true
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

    
})

module.exports = mongoose.model("Product",productSchema);