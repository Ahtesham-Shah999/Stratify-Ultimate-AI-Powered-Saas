const mongoose = require('mongoose');

const post = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  strategy_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Strategy",
    required: false,
    default: null
  },
  strategy_name: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  published_at: {
    type: Date,
    default: Date.now
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  // ── Voting ────────────────────────────────────────────────────────────────
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  upvoted_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  downvoted_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // ── Backtest metrics snapshot ─────────────────────────────────────────────
  backtest_metrics: {
    total_profit:    { type: Number, default: null },
    initial_capital: { type: Number, default: null },
    final_capital:   { type: Number, default: null },
    win_rate:        { type: Number, default: null },
    sharpe_ratio:    { type: Number, default: null },
    max_drawdown:    { type: Number, default: null },
    trades_count:    { type: Number, default: null },
    timeframe:       { type: String, default: null }
  }
});

const Post = mongoose.model("post", post);
module.exports = Post;