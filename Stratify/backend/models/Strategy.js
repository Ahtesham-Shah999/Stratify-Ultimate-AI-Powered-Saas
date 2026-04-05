const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true    // a user must own this strategy
  },
  portfolio_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "portfolio",
    required: false   // strategy can exist without being in a portfolio
  },
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  language_input: {
    type: String,
    required: true
  },

  generated_rules: {
    type: Object,  // JSON rules
    default: {}
  },

  initial_capital: {
    type: Number,
    default: 0
  },

  engine_type: {
    type: String,
    default: "BACKTEST"
  },

  visibility: {
    type: String,
    enum: ["PRIVATE", "PUBLIC"],
    default: "PRIVATE"
  },

  conditions: {
    type: Array,
    default: []
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

const Strategy = mongoose.model("Strategy", strategySchema);
module.exports = Strategy;