const Fish = require("../models/fishModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");

const sendResJSON = (statusCode, res, fish) => {
  res.status(statusCode).json({
    status: "success",
    data: {
      fish,
    },
  });
};

const getAllFish = asyncCatch(async (req, res, next) => {
  const countFish = await Fish.countDocuments();
  const apiFeatures = new APIFeatures(Fish.find(), req.query)
    .filter()
    .sort()
    .select()
    .pagination(countFish);
  const fish = await apiFeatures.query;

  sendResJSON(200, res, fish);
});

const getFish = asyncCatch(async (req, res, next) => {
  const fish = await Fish.findById(req.params.id);
  if (!fish) return next(new AppError("Data not found", 404));
  sendResJSON(200, res, fish);
});

const createFish = asyncCatch(async (req, res, next) => {
  const fish = await Fish.create(req.body);

  sendResJSON(201, res, fish);
});

const updateFish = asyncCatch(async (req, res, next) => {
  const fish = await Fish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!fish) return next(new AppError("Data not found", 404));
  sendResJSON(200, res, fish);
});
const deleteFish = asyncCatch(async (req, res, next) => {
  const fish = await Fish.findByIdAndDelete(req.params.id);
  if (!fish) return next(new AppError("Data not found", 404));
  sendResJSON(204, res, null);
});

const aliasTop3Fish = asyncCatch(async (req, res, next) => {
  const fish = await Fish.aggregate([
    {
      $sort: { rating: -1 },
    },
    {
      $limit: 3,
    },
  ]);

  sendResJSON(200, res, fish);
});

const getFishStats = asyncCatch(async (req, res, next) => {
  const fish = await Fish.aggregate([
    {
      $group: {
        _id: "$fishType",
        totalPopularity: { $sum: "$popularity" },
        totalPrice: { $sum: "$price" },
        totalQuantity: { $sum: "$quantity" },
        avgRating: { $avg: "$rating" },
      },
    },
    {
      $sort: { avgRating: -1 },
    },
  ]);
  sendResJSON(200, res, fish);
});

module.exports = {
  getAllFish,
  getFish,
  createFish,
  updateFish,
  deleteFish,
  aliasTop3Fish,
  getFishStats,
};
