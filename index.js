const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const customerRoutes = require("./routes/customer.routes");

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/customers", customerRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("ShopKart API is running!");
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });