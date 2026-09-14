const express = require("express");
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
} = require("../controllers/orderController");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
router.post("/", createOrder);
router.get("/", protect, adminOnly, getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);
module.exports = router;
