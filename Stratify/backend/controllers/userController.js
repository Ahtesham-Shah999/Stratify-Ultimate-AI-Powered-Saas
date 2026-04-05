const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const userSetting = require("../models/userSettings");
const { logAudit } = require("./adminController");
/* ----------------------------------------------------
   REGISTER USER (CREATE)
---------------------------------------------------- */
exports.registerUser = async (req, res) => {
  try {
    console.log("registerUser called with body:", req.body);
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required.",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password_hash: hash,
      role: role || "TRADER",
    });

    await newUser.save();

    await logAudit(newUser._id, "REGISTER", "User Profile", `New user successfully signed up: ${email}`);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------------
   LOGIN USER
---------------------------------------------------- */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "yess not found." });
    }

    console.log("User found:", {
      email: user.email,
      hasPasswordHash: !!user.password_hash,
    });

    if (!user.password_hash) {
      console.error("User has no password_hash field.");
      return res.status(500).json({
        error: "User account needs to be re-created.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log("Invalid password attempt for user:", email);
      return res.status(401).json({ error: "Invalid password." });
    }

    user.last_login = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "yourSecretKey",
      { expiresIn: "24h" }
    );

    await logAudit(user._id, "LOGIN", "System", `User successfully logged in: ${email}`);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    console.log("User logged in successfully:", email);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkUserEmail = async (req, res) => {
  try {
    const email = req.params.email; // get from URL
    console.log("email", email);
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ exists: false });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      "yourSecretKey", // use env var in production
      { expiresIn: "24h" }
    );

    console.log("User exists:", email);
    return res.status(200).json({
      exists: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
/* ----------------------------------------------------
   GET ALL USERS
---------------------------------------------------- */

/* ----------------------------------------------------
   GET USER BY ID
---------------------------------------------------- */
exports.getUserById = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findById(email).select("-password_hash");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ----------------------------------------------------
   UPDATE USER
---------------------------------------------------- */
exports.updateUser = async (req, res) => {
  try {
    console.log("Updating user...");

    const { email } = req.params;
    const updates = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "At least one field must be provided for update",
      });
    }

    // If password is being updated
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(updates.password, salt);
      delete updates.password;
    }

    // FIX: Update by email, NOT by id
    const user = await User.findOneAndUpdate(
      { email },
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password_hash");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully.",
      user,
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ----------------------------------------------------
   DELETE USER
---------------------------------------------------- */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await logAudit(null, "DELETE", "User Account", `Deleted user manually by ID: ${id}`);

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "TRADER" }).select(
      "-passwordHash -password_hash"
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No traders found." });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// set setting of user
exports.setUserSettings = async (req, res) => {
  try {
    const { user_id, timezone, notification_pref } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    const settings = new userSetting({
      user_id,
      timezone,
      notification_pref,
    });
    await settings.save();
    return res
      .status(201)
      .json({ message: "Settings created successfully", settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateUserSettings = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Build dynamic update object
    const updateData = {};

    if (req.body.timezone) {
      updateData.timezone = req.body.timezone;
    }

    if (req.body.notification_pref) {
      updateData.notification_pref = req.body.notification_pref;
    }

    const updated = await userSetting.findOneAndUpdate(
      { user_id },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User settings not found" });
    }

    res.status(200).json({
      message: "User settings updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ----------------------------------------------------
   UPLOAD PROFILE PICTURE
---------------------------------------------------- */
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { user_id } = req.params;
    const imageUrl = `/images/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { profile_pic: imageUrl },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      // Clean up the uploaded file if user not found to save space
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../public/images', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profile_pic: updatedUser.profile_pic,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profile_pic: updatedUser.profile_pic,
      }
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
