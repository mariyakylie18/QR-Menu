const express = require("express");
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
} = require("../controllers/orderController");
const router = express.Router();
const { protect, kitchenOrAdmin } = require("../middleware/authMiddleware");
router.post("/", createOrder);
router.get("/", protect, kitchenOrAdmin, getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", protect, kitchenOrAdmin, updateOrderStatus);
module.exports = router;
