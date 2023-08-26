const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncCatch = require("../utils/asyncCatch");
const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");

const signJWT = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const optionsCookie = {
  httpOnly: true,
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
};
const sendJWT = (res, statusCode, user) => {
  const token = signJWT(user);
  res.cookie("jwt", token, optionsCookie);
  res.status(statusCode).json({
    status: "success",
    token,
  });
};
const signup = asyncCatch(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({ name, email, password, passwordConfirm });

  sendJWT(res, 201, newUser);
});

const login = asyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(new AppError("Please enter your email", 400));
  if (!password) return next(new AppError("Please enter your password", 400));
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("Your email is not correct", 401));
  const checkPwd = await user.checkPassword(password, user.password);
  if (!checkPwd) return next(new AppError("Your password is not correct", 401));

  sendJWT(res, 200, user);
});

const protect = asyncCatch(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer"))
    return next(new AppError("Please login to get this access", 401));
  const token = authorization.split(" ")[1];
  if (!token) return next(new AppError("Please login to get this access", 401));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "This user has beed deleted, please contact us to know detail",
        404,
      ),
    );
  if (currentUser.checkChangePasswordAfter(decoded.iat))
    return next(
      new AppError(
        "This user recently has changed password, please login again to get access",
        401,
      ),
    );

  req.user = currentUser;
  next();
});

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have permission to perform this action", 403),
      );
    next();
  };

const forgotPassword = asyncCatch(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Your email is not correct", 401));

  const resetToken = user.createResetTokenPwd();
  await user.save({ validateBeforeSave: false });

  const subject = "Your reset password mail";
  const message = ` You forgot password, please click this link ${req.protocol}://${req.hostname}:3000/api/v1/users/reset-password/${resetToken} to reset your password`;
  try {
    await sendEmail({ email, subject, message });
    res.json({
      status: "success",
      message: "Sent mail to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenTimeout = undefined;
    await user.save({ validateBeforeSave: false });
  }
});

const resetPassword = asyncCatch(async (req, res, next) => {
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenTimeout: { $gt: Date.now() },
  });
  if (!user)
    return next(
      new AppError("Your reset token password is not correct or expired", 401),
    );
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenTimeout = undefined;
  await user.save();

  sendJWT(res, 201, user);
});

const updatePassword = asyncCatch(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!currentPassword)
    return next(
      new AppError("Please enter your current password to confirm", 400),
    );
  const user = await User.findById(req.user.id).select("+password");
  const checkPwd = await user.checkPassword(currentPassword, user.password);
  if (!checkPwd) return next(new AppError("Your password is not correct", 401));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  sendJWT(res, 201, user);
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
