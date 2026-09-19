const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    Enum: ["food", "drink"],
    required: false,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});
const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
