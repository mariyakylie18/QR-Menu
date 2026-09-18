const jwt = require("jsonwebtoken");
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

const kitchenOrAdmin =(req, res, next) => {
  if(
    req.user.role !== "admin" &&
req.user.role !== "kitchen"
  ) {
    return res.status(403).json({
      message: "Kitchen эсвэл Admin эрх шаардлагатай"ь
    });
  }
next ();
};

module.exports = { protect, adminOnly, kitchenOrAdmin };
