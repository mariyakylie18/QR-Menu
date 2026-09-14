require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Food = require("./models/Food");
const foodRoutes = require("./routes/foodRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "https://qr-menu-frontend-a4qc.onrender.com",
    ],
  }),
);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://127.0.0.1:5500",
      "https://qr-menu-frontend-a4qc.onrender.com",
    ],
  },
});
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
});
app.set("io", io);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/foods", foodRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
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



server.listen(PORT, () => {
  console.log(`Server ${PORT} port deer aslaa`);
});


