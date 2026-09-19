const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
    },
    items: [
      {
        foodId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        type: {
          type: String,
          enum: ["food", "drink"],
          // required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed"],
      default: "pending",
    },
    trackingToken: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);
orderSchema.index({ expiresAt: 1 }, { expiresAfterSeconds: 0 });
module.exports = mongoose.model("Order", orderSchema);
