const Food = require("../models/Food");

const getFoods = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;

    const filter = {};
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }
    if (category) {
      filter.category = category;
    }
    const skip = (page - 1) * limit;
    const totalFoods = await Food.countDocuments(filter);
    const totalPages = Math.ceil(totalFoods / limit);
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    }
    if (sort === "price-desc") {
      sortOption = { price: -1 };
    }
    const foods = await Food.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    const categories = await Food.distinct("category");
    const totalCategories = categories.length;

    return res.status(200).json({
      foods,
      totalFoods,
      totalCategories,
      totalPages,
      page,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get foods",
      error: error.message,
    });
  }
};

const createFood = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required",
      });
    }

    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: " Food name must be at least 2 characters" });
    }
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Food image is required",
      });
    }
    // buh validation taarssn bol food data uusgene

    const foodData = {
      ...req.body,
      image: `/uploads/${req.file.filename}`,
    };
    const food = await Food.create(foodData);

    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateFood = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required",
      });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({
        message: "Food name must be at least 2 characters",
      });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0 ",
      });
    }
    const updateData = {
      name,
      price: numericPrice,
      category,
      description,
    };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    // Mongo db update
    const food = await Food.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!food) {
      return res.status(404).json({
        message: "Food not found",
      });
    }
    return res.status(200).json(food);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update food",
      error: error.message,
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({
        message: "Food not found",
      });
    }
    return res.status(200).json({
      message: "Food deleted successfully",
      food,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete food",
      error: error.message,
    });
  }
};

module.exports = {
  getFoods,
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
};
