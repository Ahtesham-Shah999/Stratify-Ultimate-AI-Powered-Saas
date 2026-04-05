const Strategy = require("../models/Strategy");
const axios = require("axios");
const crypto = require("crypto");

/* =========================================================
   PARSE STRATEGY (CALLS PYTHON API)
========================================================= */
const parsedStrategy = async (req, res) => {
  try {
    const { language_input, user_id } = req.body;

    if (!language_input) {
      return res.status(400).json({ error: "language_input is required" });
    }

    // 1️⃣ Parse strategy
    const parseResponse = await axios.post(
      "http://127.0.0.1:8001/parse-strategy",
      { language_input, user_id }
    );

    const parsed = parseResponse.data;
    console.log("--- PYTHON PARSE RESPONSE ---", JSON.stringify(parsed, null, 2));

    if (parsed.description === "Non-trading input rejected") {
      return res.status(400).json({
        message: "Invalid or malicious input detected",
        python_response: parsed,
      });
    }

    const { generated_rules, initial_capital, meta } = parsed;

    const validatePayload = {
      strategy_id: crypto.randomUUID(),
      generated_rules,
      symbol: meta?.symbols?.[0] || generated_rules?.pair,
      timeframe: meta?.timeframe || generated_rules?.timeframe || "1h",
      initial_capital: initial_capital || 100,
    };

    // 2️⃣ Validate strategy
    const validateResponse = await axios.post(
      "http://127.0.0.1:8001/validate-strategy",
      validatePayload
    );

    console.log("--- PYTHON VALIDATE RESPONSE ---", JSON.stringify(validateResponse.data, null, 2));

    return res.status(200).json({
      message: "Success",
      parsed_strategy: parsed,
      validated_strategy: validateResponse.data,
    });
  } catch (error) {
    // Extract the real error from the Python API response
    const pythonError = error.response?.data?.detail || error.message;
    const statusCode = error.response?.status || 500;

    console.error(`Python API Error (${statusCode}):`, pythonError);

    // If rate-limited (429), retry once after a short delay
    if (statusCode === 429) {
      console.log("Rate limited by AI service. Retrying in 5 seconds...");
      try {
        await new Promise((r) => setTimeout(r, 5000));
        const retryResponse = await axios.post(
          "http://127.0.0.1:8001/parse-strategy",
          { language_input: req.body.language_input, user_id: req.body.user_id }
        );
        const parsed = retryResponse.data;
        console.log("--- PYTHON PARSE RESPONSE (RETRY) ---", JSON.stringify(parsed, null, 2));

        if (parsed.description === "Non-trading input rejected") {
          return res.status(400).json({
            message: "Invalid or malicious input detected",
            python_response: parsed,
          });
        }

        const { generated_rules, initial_capital, meta } = parsed;
        const validatePayload = {
          strategy_id: crypto.randomUUID(),
          generated_rules,
          symbol: meta?.symbols?.[0] || generated_rules?.pair,
          timeframe: meta?.timeframe || generated_rules?.timeframe || "1h",
          initial_capital: initial_capital || 100,
        };

        const validateResponse = await axios.post(
          "http://127.0.0.1:8001/validate-strategy",
          validatePayload
        );

        return res.status(200).json({
          message: "Success",
          parsed_strategy: parsed,
          validated_strategy: validateResponse.data,
        });
      } catch (retryError) {
        const retryPythonError = retryError.response?.data?.detail || retryError.message;
        console.error("Retry also failed:", retryPythonError);
        return res.status(429).json({
          error: "AI service is busy. Please try again in 30-60 seconds.",
          details: retryPythonError,
        });
      }
    }

    return res.status(statusCode).json({
      error: "Failed to process strategy",
      details: pythonError,
    });
  }
};

/* =========================================================
   CREATE STRATEGY
========================================================= */
const createStrategy = async (req, res) => {
  try {
    const {
      user_id,
      name,
      description,
      language_input,
      generated_rules,
      initial_capital,
      engine_type,
      visibility,
      portfolio_id,
      conditions,
    } = req.body;

    if (!user_id || !name || !language_input) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const strategy = new Strategy({
      user_id,
      name,
      description,
      language_input,
      generated_rules,
      initial_capital,
      engine_type,
      visibility,
      portfolio_id,
      conditions,
    });

    await strategy.save();

    res.status(201).json({
      message: "Strategy created successfully",
      strategy,
    });
  } catch (error) {
    console.error("Create Strategy Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET ALL STRATEGIES
========================================================= */
const getAllStrategies = async (req, res) => {
  try {
    const strategies = await Strategy.find();
    res.status(200).json(strategies);
  } catch (error) {
    console.error("Get All Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET STRATEGIES BY USER
========================================================= */
const getStrategiesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const strategies = await Strategy.find({ user_id });

    res.status(200).json(strategies);
  } catch (error) {
    console.error("Get By User Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET STRATEGY BY ID
========================================================= */
const getStrategyById = async (req, res) => {
  try {
    const { strategy_id } = req.params;

    const strategy = await Strategy.findById(strategy_id);

    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.status(200).json(strategy);
  } catch (error) {
    console.error("Get By ID Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   UPDATE STRATEGY
========================================================= */
const updateStrategy = async (req, res) => {
  try {
    const { strategy_id } = req.params;

    const updated = await Strategy.findByIdAndUpdate(
      strategy_id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.status(200).json({
      message: "Strategy updated",
      strategy: updated,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   DELETE STRATEGY
========================================================= */
const deleteStrategy = async (req, res) => {
  try {
    const { strategy_id } = req.params;

    const deleted = await Strategy.findByIdAndDelete(strategy_id);

    if (!deleted) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.status(200).json({ message: "Strategy deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   GET STRATEGIES BY PORTFOLIO
========================================================= */
const getStrategiesByPortfolio = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    const strategies = await Strategy.find({ portfolio_id });

    res.status(200).json(strategies);
  } catch (error) {
    console.error("Portfolio Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================================================
   EXPORT EVERYTHING
========================================================= */
module.exports = {
  parsedStrategy,
  createStrategy,
  getAllStrategies,
  getStrategiesByUser,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
  getStrategiesByPortfolio,
};