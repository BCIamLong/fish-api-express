const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");

const filterObject = (ob, ...fields) => {
  const filteredOb = {};
  Object.keys(ob).forEach(field => {
    if (fields.includes(field)) filteredOb[field] = ob[field];
  });
  return filteredOb;
};
const updateMe = asyncCatch(async (req, res, next) => {
  const filteredBody = filterObject(req.body, "name", "email");

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true,
  });

  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

const deleteMe = asyncCatch(async (req, res, next) => {
  const { reason, password } = req.body;
  if (!reason)
    return next(
      new AppError("Please choose your reason to delete this accout", 400),
    );
  if (!password)
    return next(new AppError("Please re-enter your password to confirm", 400));
  const user = await User.findById(req.user.id).select("+password");
  const checkPwd = await user.checkPassword(password, user.password);
  if (!checkPwd) return next(new AppError("Your password is not correct", 401));

  user.active = false;
  user.reasonDeleteAccount = reason;
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getAllUser = asyncCatch(async (req, res, next) => {
  const users = await User.find();

  res.json({
    status: "success",
    data: {
      users,
    },
  });
});

module.exports = { updateMe, deleteMe, getAllUser };
