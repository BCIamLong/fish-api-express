const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", err => {
  console.log(err.name, err.message);
  console.log("Application shutting down");
  process.exit();
});

const app = require("./app");

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);
    console.log("DB connect success");
  } catch (err) {
    console.log(err);
  }
})();

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Server is listening with port: ${port}`);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.log("Application shutting down");
  server.close(() => {
    process.exit();
  });
});
