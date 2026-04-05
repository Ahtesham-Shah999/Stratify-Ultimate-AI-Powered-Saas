const BacktestResult = require('../models/backtest');
const Strategy = require('../models/Strategy');
const axios = require('axios');

exports.runBacktest = async (req, res) => {
  try {
    const {
      strategy_id,
      timeframe,
      initial_capital,
      timeout,
      generated_rules,
      start_date,
      end_date
    } = req.body;

    if (!strategy_id || !timeframe || !initial_capital) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 1️⃣ FETCH STRATEGY FROM DB (Optional if passed directly)
    let strategyRules = generated_rules;
    if (!strategyRules) {
      const strategy = await Strategy.findById(strategy_id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      strategyRules = strategy.generated_rules;
    }

    // 2️⃣ SEND TO PYTHON BACKTEST API
    const backtestPayload = {
      strategy_id,
      generated_rules: strategyRules,
      timeframe,
      initial_capital,
      start_date,
      end_date,
      timeout: timeout || 400
    };

    console.log("Sending to backtest API:", backtestPayload);

    const backtestResponse = await axios.post(
      "http://127.0.0.1:8001/run-backtest",
      backtestPayload
    );

    const result = backtestResponse.data;
    console.log("Backtest API Response:", result);

    // Support both flat and nested result formats from Python engine
    const resultData = result.result ?? result;
    const trades = result.trades ?? [];

    // 3️⃣ UPSERT RESULT TO DB (update if same strategy exists)
    const backtestResult = await BacktestResult.findOneAndUpdate(
      { strategy_id },          // match key (only one backtest per strategy)
      {
        $set: {
          timeframe,
          initial_capital,
          final_capital:  resultData.final_capital ?? null,
          profit_loss:    resultData.profit_loss,
          win_rate:       resultData.win_rate,
          max_drawdown:   resultData.max_drawdown,
          sharpe_ratio:   resultData.sharpe_ratio,
          trades_count:   resultData.trades_count,
          created_at:     new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Return the saved doc PLUS the trades array from the Python engine
    const backtestObj = backtestResult.toObject();
    backtestObj.trades = trades;

    res.status(201).json({
      message: "Backtest completed successfully",
      backtest: backtestObj
    });

  } catch (error) {
    console.error("Error running backtest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllBacktests = async (req, res) => {
  try {
    const backtests = await BacktestResult.find();

    if (!backtests.length) {
      return res.status(404).json({ message: "No backtest results found" });
    }

    res.status(200).json(backtests);

  } catch (error) {
    console.error("Error fetching backtests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBacktestById = async (req, res) => {
  try {
    const { backtest_id } = req.params;

    const backtest = await BacktestResult.findById(backtest_id);

    if (!backtest) {
      return res.status(404).json({ message: "Backtest result not found" });
    }

    res.status(200).json(backtest);

  } catch (error) {
    console.error("Error fetching backtest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBacktestsByStrategy = async (req, res) => {
  try {
    const { strategy_id } = req.params;

    const backtests = await BacktestResult.find({ strategy_id: strategy_id });

    if (!backtests.length) {
      return res.status(404).json({ message: "No backtest results found for this strategy" });
    }

    res.status(200).json(backtests);

  } catch (error) {
    console.error("Error fetching strategy backtests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBacktestsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // 1️⃣ FETCH ALL STRATEGIES BY USER
    const strategies = await Strategy.find({ user_id: user_id });

    if (!strategies.length) {
      return res.status(404).json({ message: "No strategies found for this user" });
    }

    const strategyIds = strategies.map(s => s._id);

    // 2️⃣ FETCH ALL BACKTESTS FOR THOSE STRATEGIES
    const backtests = await BacktestResult.find({ strategy_id: { $in: strategyIds } });

    if (!backtests.length) {
      return res.status(404).json({ message: "No backtest results found for this user" });
    }

    res.status(200).json(backtests);

  } catch (error) {
    console.error("Error fetching user backtests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteBacktest = async (req, res) => {
  try {
    const { backtest_id } = req.params;

    const backtest = await BacktestResult.findByIdAndDelete(backtest_id);

    if (!backtest) {
      return res.status(404).json({ message: "Backtest result not found" });
    }

    res.status(200).json({ message: "Backtest result deleted successfully" });

  } catch (error) {
    console.error("Error deleting backtest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};