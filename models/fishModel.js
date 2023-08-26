const mongoose = require("mongoose");

const fishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Fish must have a name"],
    },
    age: {
      type: Number,
      required: [true, "Fish must have an age"],
    },
    fishType: {
      type: String,
      required: [true, "Fish must have a type"],
    },
    origin: {
      type: String,
      default: "none",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Fish must have a price"],
    },
    quantity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      max: [5, "Rating max is 5"],
    },
    photo: {
      type: String,
      required: [true, "Fish must have a photo"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

fishSchema.virtual("currency").get(function () {
  return [
    `${this.price} $`,
    `${this.price * 22000} VND`,
    `${this.price * 1300} KWR`,
  ];
});

const Fish = mongoose.model("Fish", fishSchema);

module.exports = Fish;
