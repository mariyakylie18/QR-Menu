const Order = require("../models/Order");
const Food = require("../models/Food");

const createOrder = async (req, res) => {
  try {
    const { tableNumber, items } = req.body;
    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({
        message: "Table order and items aare required",
      });
    }
    const foodIds = items.map((item) => item.foodId);
    const foods = await Food.find({
      _id: { $in: foodIds },
    });

    if (foods.length !== foodIds.length) {
      return res.status(400).json({
        message: "One or more foods not found",
      });
    }

    let totalPrice = 0;
    foods.forEach((food) => {
      const orderItem = items.find(
        (item) => item.foodId === food._id.toString(),
      );
      totalPrice += food.price * orderItem.quantity;
    });

    const orderItems = foods.map((food) => {
      const orderItem = items.find(
        (item) => item.foodId === food._id.toString(),
      );

      return {
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity: orderItem.quantity,
      };
    });
    const order = new Order({
      tableNumber,
      items: orderItems,
      totalPrice,
    });

    await order.save();
    const io = req.app.get("io");
    io.emit("new-order");
    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.log("Create order error:", error);

    return res.status(500).json({
      message: "failed to create order",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.log("Get orders error:", error);

    return res.status(500).json({
      message: "Failed to get order",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.log("Get order error:", error);
    return res.status(500).json({
      message: "failed to get order",
    });
  }
};
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const allowedStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }
    order.status = status;
    await order.save();
    const io = req.app.get("io");
    io.emit("order-status-updated", {
      orderId: order._id.toString(),
      status: order.status,
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.log("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status",
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
