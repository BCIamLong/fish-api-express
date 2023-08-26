const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter the correct email type"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "seller"],
      message: "Role either user, admin and seller",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password must have at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Password not in the same, please check again",
    },
  },
  photo: {
    type: String,
    default: "default-user-image.jpg",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenTimeout: Date,
  active: {
    type: Boolean,
    default: true,
  },
  reasonDeleteAccount: String,
});

userSchema.methods.checkPassword = async function (currentPwd, hashPwd) {
  return await bcrypt.compare(currentPwd, hashPwd);
};

userSchema.methods.checkChangePasswordAfter = function (JWTTimestamp) {
  return Math.floor(Date.parse(this.passwordChangedAt) / 1000) > JWTTimestamp;
};

userSchema.methods.createResetTokenPwd = function () {
  const resetToken = crypto.randomBytes(48).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenTimeout = Date.now() + 12 * 60 * 1000;

  return resetToken;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.passwordConfirm = undefined;
  this.password = await bcrypt.hash(this.password, 12);

  if (this.isNew) return next();
  if (this.passwordResetTokenTimeout < Date.now())
    return next(new AppError("Your reset passowrd token is expired", 401));
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  const fieldsOb = Object.keys(this._conditions);
  this.find({ active: { $ne: false } });
  if (fieldsOb.includes("email")) {
    if (!this._conditions.email)
      return next(new AppError("Please enter your email", 400));

    if (!validator.isEmail(this._conditions.email))
      return next(new AppError("Please enter correct your type email", 400));
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
