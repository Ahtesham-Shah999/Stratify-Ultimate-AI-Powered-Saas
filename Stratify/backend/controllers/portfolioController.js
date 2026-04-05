const Portfolio = require('../models/portfolio');
const Strategy = require('../models/Strategy');

exports.createPortfolio = async (req, res) => {
  try {
    const { user_id, name, description } = req.body;

    if (!user_id || !name) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const portfolio = new Portfolio({ user_id, name, description });
    await portfolio.save();

    res.status(201).json({ message: "Portfolio created successfully", portfolio });

  } catch (error) {
    console.error("Error creating portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find();

    if (!portfolios.length) {
      return res.status(404).json({ message: "No portfolios found" });
    }

    res.status(200).json(portfolios);

  } catch (error) {
    console.error("Error fetching portfolios:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPortfolioById = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    const portfolio = await Portfolio.findById(portfolio_id);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.status(200).json(portfolio);

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPortfoliosByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const portfolios = await Portfolio.find({ user_id });

    res.status(200).json(portfolios);

  } catch (error) {
    console.error("Error fetching user portfolios:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const { portfolio_id } = req.params;
    const updates = req.body;

    const portfolio = await Portfolio.findByIdAndUpdate(portfolio_id, updates, {
      new: true,
      runValidators: true
    });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.status(200).json({ message: "Portfolio updated", portfolio });

  } catch (error) {
    console.error("Error updating portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deletePortfolio = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    const portfolio = await Portfolio.findByIdAndDelete(portfolio_id);

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.status(200).json({ message: "Portfolio deleted successfully" });

  } catch (error) {
    console.error("Error deleting portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTotalCapitalByPortfolio = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    const strategies = await Strategy.find({ portfolio_id: portfolio_id });

    if (!strategies.length) {
      return res.status(404).json({ message: "No strategies found for this portfolio" });
    }

    const total_capital = strategies.reduce((sum, strategy) => {
      return sum + (strategy.initial_capital || 0);
    }, 0);

    console.log(`Total capital for portfolio_id ${portfolio_id}: ${total_capital}`);

    res.status(200).json({
      portfolio_id,
      strategy_count: strategies.length,
      total_capital
    });

  } catch (error) {
    console.error("Error calculating total capital:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};