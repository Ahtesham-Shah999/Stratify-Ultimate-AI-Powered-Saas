const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Strategy = require('../models/Strategy');
const BacktestResult = require('../models/backtest');
const UserSettings = require('../models/userSettings');

/* ----------------------------------------------------
   HELPER: LOG AUDIT
---------------------------------------------------- */
exports.logAudit = async (user_id, action, target, details) => {
  try {
    const log = new AuditLog({
      user_id, 
      action,
      target,
      details
    });
    await log.save();
  } catch (err) {
    console.error("Failed to inject AuditLog:", err);
  }
};

/* ----------------------------------------------------
   GET ALL USERS
---------------------------------------------------- */
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users except password hashes, sorted by latest
    const users = await User.find().select("-password_hash").sort({ created_at: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users for admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* ----------------------------------------------------
   DELETE USER (CASCADE DELETION)
---------------------------------------------------- */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user to log email/username
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found." });
    }

    // Cascade delete related entities
    const userStrategies = await Strategy.find({ user_id: id });
    const strategyIds = userStrategies.map(s => s._id);

    if (strategyIds.length > 0) {
      await BacktestResult.deleteMany({ strategy_id: { $in: strategyIds } });
    }
    
    await Strategy.deleteMany({ user_id: id });
    await UserSettings.deleteMany({ user_id: id });
    
    // Delete the actual user
    await User.findByIdAndDelete(id);

    // Optional: Log this action by the admin. 
    // If the admin user_id was passed via request (req.user), we could attach it.
    // We'll log it as a system-level admin event.
    await exports.logAudit(
      null, 
      "DELETE", 
      "User Account", 
      `Deleted user ${userToDelete.email} and all related configurations.`
    );

    res.status(200).json({ message: "User securely deleted." });
  } catch (error) {
    console.error("Error securely deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ----------------------------------------------------
   GET RECENT AUDIT LOGS
---------------------------------------------------- */
exports.getAuditLogs = async (req, res) => {
  try {
    // Limit to recent 100 logs
    const logs = await AuditLog.find()
      .populate('user_id', 'username email role')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* ----------------------------------------------------
   GET ALL STRATEGIES (GLOBAL — ADMIN VIEW)
---------------------------------------------------- */
exports.getAllStrategies = async (req, res) => {
  try {
    const strategies = await Strategy.find()
      .populate('user_id', 'username email')
      .sort({ created_at: -1 });

    return res.status(200).json(strategies);
  } catch (error) {
    console.error("Error fetching all strategies for admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
