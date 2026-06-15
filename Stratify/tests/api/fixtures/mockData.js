/**
 * Stratify – API Test Mock Data & Fixtures
 * Used across all Jest + Supertest test suites.
 */

const mongoose = require('../setup/mongoose');

// ─── User Fixtures ─────────────────────────────────────────────────────────────
const validUser = {
  username: 'testtrader',
  email: 'testtrader@stratify.test',
  password: 'Test@1234',
  role: 'TRADER',
};

const adminUser = {
  username: 'adminuser',
  email: 'admin@stratify.test',
  password: 'Admin@5678',
  role: 'ADMIN',
};

const invalidUser = {
  email: 'notexist@stratify.test',
  password: 'WrongPassword!',
};

const missingCredentials = {
  email: '',
  password: '',
};

// ─── Strategy Fixtures ─────────────────────────────────────────────────────────
const validStrategy = {
  name: 'Golden Cross Strategy',
  description: 'Buy when 50-day MA crosses above 200-day MA',
  language_input: 'Buy when the 50-day moving average crosses above the 200-day moving average. Sell when it crosses back below.',
  symbol: 'EURUSD',
  timeframe: 'H1',
  initial_capital: 10000,
};

const emptyStrategy = {
  name: '',
  language_input: '',
};

const invalidStrategyInput = {
  name: 'Bad Strategy',
  language_input: '!!!@@@###$$$%%%',   // gibberish – parser should reject
};

// ─── Backtest Fixtures ─────────────────────────────────────────────────────────
const validBacktest = {
  strategy_id: null,          // populated at runtime after strategy creation
  timeframe: 'H1',
  initial_capital: 10000,
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  generated_rules: {
    entry_conditions: [{ indicator: 'MA_CROSS', params: { fast: 50, slow: 200 }, direction: 'above' }],
    exit_conditions:  [{ indicator: 'MA_CROSS', params: { fast: 50, slow: 200 }, direction: 'below' }],
  },
};

const missingBacktestFields = {
  timeframe: 'H1',
  // strategy_id and initial_capital intentionally omitted
};

// ─── Sentiment Fixtures ────────────────────────────────────────────────────────
const validSentimentPayload = { pair: 'AAPL' };
const emptySentimentPayload  = {};

// ─── Portfolio Fixtures ────────────────────────────────────────────────────────
const validPortfolio = {
  user_id: null,          // populated at runtime
  name: 'Growth Portfolio',
  description: 'Long-term growth strategies',
};

const invalidPortfolio = {
  // missing user_id and name
  description: 'No required fields',
};

// ─── Community Post Fixtures ───────────────────────────────────────────────────
const validPost = {
  user_id: null,          // populated at runtime
  strategy_id: null,      // populated at runtime
  title: 'My First Strategy Post',
  content: 'Sharing my golden cross strategy that yielded 18% ROI.',
};

// ─── OTP / Auth Fixtures ───────────────────────────────────────────────────────
const otpRequest = { email: validUser.email, Subject: 'Stratify – Email Verification' };
const missingOtpFields = { otp: '' };

// ─── Mongoose ID Helper ────────────────────────────────────────────────────────
const fakeObjectId = () => new mongoose.Types.ObjectId().toString();

module.exports = {
  validUser,
  adminUser,
  invalidUser,
  missingCredentials,
  validStrategy,
  emptyStrategy,
  invalidStrategyInput,
  validBacktest,
  missingBacktestFields,
  validSentimentPayload,
  emptySentimentPayload,
  validPortfolio,
  invalidPortfolio,
  validPost,
  otpRequest,
  missingOtpFields,
  fakeObjectId,
};
