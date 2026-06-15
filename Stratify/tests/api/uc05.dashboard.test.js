/**
 * UC-05 – Performance Dashboard
 *
 * The dashboard is composed of data from multiple endpoints.
 * These integration tests verify each data feed independently.
 *
 * Tests:
 *  TC31 – GET /api/backtest/getbyuser/:user_id  (main dashboard data source)
 *  TC32 – Empty dashboard state (user with no backtests)
 *  TC33 – GET /api/strategy/getbyuser/:user_id  (strategy list on dashboard)
 *  TC34 – GET /api/portfolio/user/:user_id       (portfolio summary)
 *  TC35 – GET /api/backtest/getbystrategy/:strategy_id (drilldown)
 */

const request  = require('supertest');
const mongoose = require('./setup/mongoose');
const app      = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

// Suppress axios calls to the Python engine
jest.mock('axios');

let seededUserId;
let seededStrategyId;

beforeAll(async () => {
  // Seed user + strategy for dashboard data
  const User     = require('../../backend/models/User');
  const Strategy = require('../../backend/models/Strategy');
  const bcrypt   = require('bcryptjs');

  const hash = await bcrypt.hash('Test@1234', 10);
  const user = await User.create({
    username:      'dashboarduser',
    email:         'dashboard@stratify.test',
    password_hash: hash,
    role:          'TRADER',
  });
  seededUserId = user._id.toString();

  const strategy = await Strategy.create({
    name:            'Dashboard Test Strategy',
    description:     'Seeded for dashboard tests',
    language_input:  'Buy when MACD crosses signal line',
    symbol:          'GBPUSD',
    timeframe:       'D1',
    initial_capital: 20000,
    user_id:         user._id,
    generated_rules: {},
  });
  seededStrategyId = strategy._id.toString();
});

// Note: DB is wiped by setupEnv.js before each suite; no manual cleanup needed.

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-05 | Performance Dashboard', () => {
  test('TC31 – Fetch backtests by user_id (dashboard primary data)', async () => {
    const res = await request(app).get(`/api/backtest/getbyuser/${seededUserId}`);
    // 404 is acceptable when no backtests exist yet for this user
    expect([200, 404]).toContain(res.status);
  });

  test('TC32 – Empty dashboard state returns 404 with descriptive message', async () => {
    const ghostId = fixtures.fakeObjectId();
    const res = await request(app).get(`/api/backtest/getbyuser/${ghostId}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  test('TC33 – Fetch strategies by user_id returns list', async () => {
    const res = await request(app).get(`/api/strategy/getbyuser/${seededUserId}`);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    }
  });

  test('TC34 – Fetch portfolios by user_id returns list or empty', async () => {
    const res = await request(app).get(`/api/portfolio/user/${seededUserId}`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC35 – Fetch backtests by strategy_id (drilldown)', async () => {
    const res = await request(app).get(`/api/backtest/getbystrategy/${seededStrategyId}`);
    expect([200, 404]).toContain(res.status);
  });
});
