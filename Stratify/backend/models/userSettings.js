const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    settings_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(), // PK
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one-to-one
    },
    timezone: {
      type: String,
      default: "UTC",
    },

    notification_pref: {
      type: String,
      enum: ["EMAIL", "PUSH"],
      default: "EMAIL",
    }
  },
);

module.exports = mongoose.model("UserSettings", userSettingsSchema);
