const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSantize = require("express-mongo-sanitize");
const morgan = require("morgan");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const fishsRouter = require("./routes/fishsRouter");
const usersRouter = require("./routes/usersRouter");
const AppError = require("./utils/AppError");
const errorsHandler = require("./middlewares/errorsHandler");

const app = express();

app.use(helmet());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too much request, please wait and try again",
});

app.use(limiter);

app.use(cookieParser());

app.use(bodyParser.json({ limit: "90kb" }));

app.use(xss());

app.use(mongoSantize());

app.use(
  hpp({
    whitelist: ["price", "rating", "quantity", "popularity"],
  }),
);

app.use("/api/v1/fishs", fishsRouter);
app.use("/api/v1/users", usersRouter);

app.all("*", (req, res, next) => {
  next(new AppError("Invalid link, can't find file", 404));
});

app.use(errorsHandler);

module.exports = app;
