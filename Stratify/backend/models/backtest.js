const mongoose = require('mongoose');

const backtestResultSchema = new mongoose.Schema({
  strategy_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Strategy",
    required: true
  },
  timeframe: {
    type: String,
    required: true
  },
  initial_capital: {
    type: Number,
    required: true
  },
  final_capital: {
    type: Number,
    default: 0
  },
  profit_loss: {
    type: Number,
    default: 0
  },
  win_rate: {
    type: Number,
    default: 0
  },
  max_drawdown: {
    type: Number,
    default: 0
  },
  sharpe_ratio: {
    type: Number,
    default: 0
  },
  trades_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const BacktestResult = mongoose.model("backtest", backtestResultSchema);
module.exports = BacktestResult;