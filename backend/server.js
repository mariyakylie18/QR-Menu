const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Food = require("./models/Food");
const foodRoutes = require("./routes/foodRoutes");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  }),
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/foods", foodRoutes);
app.use("/auth", authRoutes);
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDb connection error:", error);
  });
// Food post hiih
app.get("/", (req, res) => {
  res.send("QR menu server ajillaj baina");
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} port deer aslaa`);
});
