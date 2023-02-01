const ErrorHandler = require("../utils/errorhandler.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto"); // we did not intall it ... This is build-in
const cloudinary = require("cloudinary");

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  // const token = user.getJWTToken();

  // res.status(200).json({
  //     success: true,
  //     token
  // })

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  // const user = await User.findOne({email : email}).select("+password");
  const user = await User.findOne({ email }).select("+password"); // we wrote only {email} here because body email name and database email name same
  // select here,, because initially the value of select was false

  // console.log(user)
  // we were getting the below error because we did not await before User.findOne({email}).select("+password");
  // {
  // "success": false,
  // "message": "user.comparePassword is not a function"
  // }

  if (!user) {
    return next(new ErrorHandler("Email or password is incorrect!", 401));
  }

  // const isPasswordMatched = user.comparePassword(password);
  //  Initially i did not use await bafore user.comparePassword(password);
  // so it got paermission to login without cheking credentials.

  const isPasswordMatched = await user.comparePassword(password); // from form input

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Email or password is incorrect!", 401));
  }

  sendToken(user, 200, res);
});

// Logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// Forget password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Creating link
  //const  resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`
  // const  resetPasswordUrl = `http://localhost:4000/api/v1/password/reset/${resetToken}` 9:43:50

  // const  resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;
  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;

  // we will make resetPasswordUrl like before because when we deploy this application it will work in same port
  // if its not running on http://localhost:3000 then add some string(letter) like `Your password reset token is TEMPPPPPPPPPPP :-

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Creating token Hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    // resetPasswordToken : resetPasswordToken  same as down
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password did not match", 401));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id); // we r taking information from auth.js

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is not correct", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password did not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// Update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  // We will add cloudinary later time 9-11-17

  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // sendToken(user, 200, res) no need this and token
  res.status(200).json({
    success: true,
  });
});

// Get all users ( ADMIN )  //by this function ADMIN can see how many users are there
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user ( ADMIN )  //by this function ADMIN can see particular user information
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id : ${req.params.id}`, 400)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Role --ADMIN
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  // let user = await User.findById(req.params.id);
  // update should be preform when at least user has existence
  // if(!user){
  //     return next(new ErrorHandler(`User does not exist with Id : ${req.params.id}`, 400))
  // }

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // sendToken(user, 200, res) no need this and token
  res.status(200).json({
    success: true,
  });
});

// Delete User --ADMIN
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id : ${req.params.id}`, 400)
    );
  }

  // Adding cloudinary 14:34:03
  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  // sendToken(user, 200, res) no need this and token
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
