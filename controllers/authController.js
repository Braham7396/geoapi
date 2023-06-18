/* eslint-disable no-console */
/* eslint-disable arrow-body-style */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined; // this works and is necessary
  user._id = null; // TODO, for some reason the _id changes insted of becoming undefined
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && user.verified) {
    return next(
      new AppError('User already exists, please use /login route instead', 400)
    );
  }
  if (user && !user.verified) {
    await User.findOneAndDelete({ email: req.body.email });
  }
  // saving the unverified user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const oldOTP = await OTP.findOne({
    userEmail: newUser.email,
  });
  if (oldOTP) await OTP.findOneAndDelete({ userEmail: newUser.email });

  const freshOTP = await OTP.create({
    userEmail: newUser.email,
    signupOTP: Math.floor(Math.random() * 900000) + 100000, // TODO
  });
  const message = `Your signup OTP is: ${freshOTP.signupOTP}, this OTP is only valid for 5 minutes.`;

  try {
    await sendEmail({
      email: newUser.email,
      subject: 'Signup OTP: (Valid for only 5 mins)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email!',
    });
  } catch (err) {
    return next(
      new AppError(
        'There was an error in sending the email. Try again later!',
        500
      )
    );
  }
});

exports.verifySignupOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return next(new AppError('Please send both email & OTP', 400));
  const OTPDocument = await OTP.findOne({ userEmail: email });
  if (!OTPDocument || !OTPDocument.signupOTP)
    return next(
      new AppError('Your OTP has expired! Please signup again.', 400)
    );
  if (otp !== OTPDocument.signupOTP)
    return next(
      new AppError('Your OTP is incorrect! Please signup again.', 400)
    );
  const newUser = await User.findOne({ email: email });
  newUser.verified = true;

  await User.findByIdAndUpdate(newUser._id, {
    verified: true,
  });
  await OTP.findOneAndDelete({ userEmail: email });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please provide email & password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user.verified)
    return next(
      new AppError(
        'Your account is not verified via OTP, please singup again',
        400
      )
    );
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 400));
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in!', 401));
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token no longer exists!', 401)
    );

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.', 401)
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(`You don't have permission to perform this action`, 403)
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email.', 400));

  const oldOTP = await OTP.findOne({
    userEmail: user.email,
  });
  if (oldOTP) await OTP.findOneAndDelete({ userEmail: user.email });

  const freshOTP = await OTP.create({
    userEmail: user.email,
    passwordOTP: Math.floor(Math.random() * 900000) + 100000, // TODO
  });
  const message = `Your Password reset OTP is ${freshOTP.passwordOTP}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset Password (Valid for 5 mins)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email',
    });
  } catch (err) {
    return next(
      new AppError(
        'There was an error in sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) return next(new AppError('No such user exists', 400));
  const OTPDocument = await OTP.findOne({
    userEmail: req.body.email,
  });
  if (!OTPDocument || !OTPDocument.passwordOTP)
    return next(
      new AppError('The OTP to reset password was never generated!', 400)
    );
  if (req.body.otp !== OTPDocument.passwordOTP)
    return next(
      new AppError(
        'The OTP provided is incorrect, Please generate the OTP again',
        400
      )
    );
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  await OTP.findOneAndDelete({ userEmail: req.body.email });
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Incorrect email or password', 401));
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send jwt
  createSendToken(user, 200, res);
});
