const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Food = require("./models/Food");
const foodRoutes = require("./routes/foodRoutes");
const authRoutes = require("./routes/authRoutes");

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
const PORT = 8000;

mongoose
  .connect("mongodb://127.0.0.1:27017/QR")
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
// app.post("/foods", async (req, res) => {
//   try {
//     const food = await Food.create(req.body);
//     res.status(201).json(food);
//   } catch (error) {
//     res.status(400).json({
//       message: error.message,
//     });
//   }
// });
//  Food find hiih
// app.get("/foods", async (req, res) => {
//   try {
//     const foods = await Food.find();

//     res.status(200).json(foods);
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });
// Food id gaar ni avah cmd
// app.get("/foods/:id", async (req, res) => {
//   try {
//     const food = await Food.findById(req.params.id);

//     res.status(200).json(food);
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });
// // Food update hiih cmd
// app.patch("/foods/:id", async (req, res) => {
//   try {
//     const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     res.status(200).json(food);
//   } catch (error) {
//     res.status(400).json({
//       message: error.message,
//     });
//   }
// });
// // food ustgah cmd
// app.delete("/Foods/:id", async (req, res) => {
//   try {
//     const food = await Food.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       message: "Food deleted",
//       food: food,
//     });
//   } catch (error) {
//     res.status(400).json({
//       message: error.message,
//     });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server ${PORT} port deer aslaa`);
});
