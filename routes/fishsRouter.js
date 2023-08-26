const express = require("express");
const {
  getAllFish,
  getFish,
  createFish,
  updateFish,
  deleteFish,
  getFishStats,
  aliasTop3Fish,
} = require("../controllers/fishsController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router.get("/fish-stats", protect, restrictTo("admin", "seller"), getFishStats);
router.get("/top-3-fish", protect, aliasTop3Fish);

router.route("/").get(getAllFish).post(createFish);
router
  .route("/:id")
  .get(getFish)
  .patch(protect, restrictTo("admin", "seller"), updateFish)
  .delete(protect, restrictTo("admin", "seller"), deleteFish);

module.exports = router;
