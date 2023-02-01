const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")  // we did not intall it ... This is build-in
const catchAsyncErrors = require("../middleware/catchAsyncErrors")


const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please enter your name"],
        maxLength:[30,"Name cannot exceed 30 characters"],
        minLength:[4,"Name should have more than 4 characters"]
    },
    email:{
        type: String,
        required:[true,"please enter your email"],
        unique:true,
        validate:[validator.isEmail,"Please enter a valid email"]
    },
    password:{
        type:String,
        required:[true, "Please enter your password"],
        minLength:[8,"Password shound be greater than 8 characters"],
        select: false  // when admin show the users the password cannot see for this statement
    },
    avatar:
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required: true
            }
        },
    role:{
        type: String,
        default: "user",
    },
    createdAt:{
        type:Date,
        default:Date.now
    },

    resetPasswordToken:String,
    resetPasswordExpire:Date,
})

// for secure the password
userSchema.pre("save", async function(next){

    if(!this.isModified("password")){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10)

})

// JWT Token . We will store token in cokkie and it will allow to differentiate which should be acces or not .For example Admin, User
userSchema.methods.getJWTToken = function(){

    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE,
    })

    // if process.env.JWT_SECRET is known to anyone , they will do anything such as create fake user ,product,admin!
    // so keep it highly secret
}


// Compare Password
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);  // it will return true or false
}

//Generating Password reset token
userSchema.methods.getResetPasswordToken = function () {  // we will generate this and pass through nodemailer so that whoeven visit the link can update or chang the password

    // Generating 
    const  resetToken = crypto.randomBytes(20).toString("hex");

    // Hashing and adding resetPasswordToken to userSchema
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000  // 15 min into milisecond

    return resetToken
}



module.exports = mongoose.model("User",userSchema)