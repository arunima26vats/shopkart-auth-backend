const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword
} = require("../controllers/customer.controller");

const authMiddleware = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logoutCustomer);
router.patch("/change-password", authMiddleware, changePassword);

module.exports = router;