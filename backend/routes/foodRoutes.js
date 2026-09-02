const express = require("express");
const upload = require("../middleware/upload");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getFoods,
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");

const router = express.Router();

router.get("/", getFoods);
router.post("/", protect, adminOnly, upload.single("image"), createFood);
router.patch("/:id", protect, adminOnly, upload.single("image"), updateFood);
router.delete("/:id", protect, adminOnly, deleteFood);

module.exports = router;
