const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler");


exports.isAuthenticatedUser = catchAsyncErrors( async(req, res, next) => {
    
    const {token} = req.cookies; // cookies setuped wwhen we logged in

    if(!token){
        return next(new ErrorHandler("Please login to access this resource", 401))
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);


    req.user = await User.findById(decodedData.id)

    next();

});

exports.authorizeRoles = (...roles) =>{  // ...roles(any name) ...for this spread operatior we will get some pre-made functions

    return (req, res, next) => {

        if(!roles.includes(req.user.role)){  // we r getting all of the value from database via req.user and req.user.role = we r getting role

            return next(
                new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resources`, 403)
            )
        }

        next();
    }
}