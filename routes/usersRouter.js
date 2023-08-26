const express = require("express");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require("../controllers/authController");
const {
  updateMe,
  deleteMe,
  getAllUser,
} = require("../controllers/usersController");

const router = express.Router();

router.patch("/update-me", protect, updateMe);
router.delete("/delete-me", protect, deleteMe);

router.patch("/update-current-password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.post("/signup", signup);
router.post("/login", login);

router.route("/").get(getAllUser).post();
router.route("/:id").get().patch().delete();

module.exports = router;
