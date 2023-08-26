const AppError = require("../utils/AppError");

const sendErrorsDevHandler = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fails";

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorsProdHandler = (err, res) => {
  if (err.isOperational)
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

const castErrorHandler = err =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const duplicateErrorHandler = err =>
  new AppError(`${Object.keys(err.keyValue)[0]} was exists`, 409);

const validationErrorHandler = err =>
  new AppError(
    `${Object.values(err.errors)
      .map(val => val.message)
      .join(". ")}`,
    400,
  );

const jwtErrorHandler = () => new AppError("Your login token is invalid", 401);
const jwtExpiredErrorHandler = () =>
  new AppError("Your login token is expired, please login again", 401);

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") sendErrorsDevHandler(err, res);
  if (process.env.NODE_ENV === "production") {
    let errProd = { ...err };
    if (err.name === "CastError") errProd = castErrorHandler(errProd);
    if (errProd.code === 11000) errProd = duplicateErrorHandler(errProd);
    if (err.name === "ValidationError")
      errProd = validationErrorHandler(errProd);
    if (err.name === "JsonWebTokenError") errProd = jwtErrorHandler();
    if (err.name === "TokenExpiredError") errProd = jwtExpiredErrorHandler();
    sendErrorsProdHandler(errProd, res);
  }
};
