const mongoose = require('mongoose');
const validator = require('validator');

const otpSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    signupOTP: String,
    passwordOTP: String,
    createdAt: {
      type: Date,
      default: Date.now, //* Date.now() is immediately executed, resulting in all values to be same
    },
  },
  { timestamps: true }
);

// Create TTL index
otpSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: process.env.OTP_EXPIRATION_TIME } // give time from process.env
);

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
