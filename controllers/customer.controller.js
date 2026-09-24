const Customer = require("../models/customer.model");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// Register Customer
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check required fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // Handle duplicate email race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// Login Customer
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find customer and include password hash
    const customer = await Customer.findOne({ email })
      .select("+password");

    // Generic error for invalid credentials
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT
    const token = generateToken(customer._id);

    // Store JWT in HttpOnly cookie
   res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000
});

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// Get Logged-in Customer
const getMe = async (req, res) => {
  try {
    // Customer is attached by authentication middleware
    return res.status(200).json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone
    });

  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// Logout Customer
const logoutCustomer = (req, res) => {
  // Clear authentication cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};


// Change Password (Bonus)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both passwords are required"
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters"
      });
    }

    // Find authenticated customer
    const customer = await Customer.findById(req.user._id)
      .select("+password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      customer.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash and save new password
    customer.password = await bcrypt.hash(newPassword, 10);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// Export Controllers
module.exports = {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword
};