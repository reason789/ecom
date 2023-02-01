const ErrorHandler = require("../utils/errorhandler")

module.exports = (err,req,res,next) =>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Wrong Mongodb id error / Cast error

    // {
    //     "success": false,
    //     "message": "Cast to ObjectId failed for value \"6192334bbea307992e433ba09\" (type string) at path \"_id\" for model \"Product\""
    // } ////////////////////////////   it will solve this problem

    if(err.name === "CastError"){
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose duplicate key error
    if(err.code == 11000){
        const message = `Duplicate ${object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400)
    }

    // Wrong JWT error
    if(err.code == "JsonWeTokenError"){
        const message = `Json Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400)
    }

    // JWT Expire error
    if(err.code == "TokenExpiredError"){
        const message = `Json Web Token is Expired, try again`;
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        // error: err.stack  //show the error elaborately
        // error: err 
        message: err.message 
    });
};
