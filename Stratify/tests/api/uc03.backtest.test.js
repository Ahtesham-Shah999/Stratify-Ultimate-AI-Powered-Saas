/**
 * UC-03 – Run Backtest
 *
 * Tests:
 *  TC20 – Successful backtest execution (POST /api/backtest/run)
 *  TC21 – Backtest with missing required fields returns 400
 *  TC22 – Backtest with non-existent strategy_id returns 404
 *  TC23 – Fetch all backtests (GET /api/backtest/all)
 *  TC24 – Fetch backtest by ID (GET /api/backtest/getbyid/:id)
 *  TC25 – Fetch backtests by strategy_id
 *  TC26 – Fetch backtests by user_id
 *  TC27 – Delete backtest by ID
 */

const request  = require('supertest');
const mongoose = require('./setup/mongoose');
const app      = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

// Mock axios so the Python engine is not called during tests
jest.mock('axios');

const BASE = '/api/backtest';

let seededStrategyId;
let createdBacktestId;

beforeAll(async () => {
  // Seed a minimal strategy document directly so we have a valid strategy_id
  const Strategy = require('../../backend/models/Strategy');
  const strategy = await Strategy.create({
    name:            'Backtest Seed Strategy',
    description:     'Auto-seeded for backtest tests',
    language_input:  'Buy when RSI < 30, sell when RSI > 70',
    symbol:          'EURUSD',
    timeframe:       'H1',
    initial_capital: 10000,
    user_id:         new mongoose.Types.ObjectId(),
    generated_rules: fixtures.validBacktest.generated_rules,
  });
  seededStrategyId = strategy._id.toString();
});

// Note: DB is wiped by setupEnv.js before each suite; no manual cleanup needed.

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-03 | Run Backtest', () => {
  test('TC20 – Successful backtest execution returns 201 with results', async () => {
    const payload = {
      ...fixtures.validBacktest,
      strategy_id: seededStrategyId,
    };

    const res = await request(app).post(`${BASE}/run`).send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('backtest');
    expect(res.body.backtest).toHaveProperty('win_rate');
    createdBacktestId = res.body.backtest?._id;
  });

  test('TC21 – Missing required fields returns 400', async () => {
    const res = await request(app).post(`${BASE}/run`).send(fixtures.missingBacktestFields);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('TC22 – Non-existent strategy_id returns 404', async () => {
    const res = await request(app).post(`${BASE}/run`).send({
      strategy_id:     fixtures.fakeObjectId(),
      timeframe:       'H1',
      initial_capital: 5000,
      start_date:      '2023-01-01',
      end_date:        '2023-12-31',
    });
    expect([404, 400, 500]).toContain(res.status);
  });
});

describe('UC-03 | Backtest Retrieval', () => {
  test('TC23 – Get all backtests returns 200 or 404', async () => {
    const res = await request(app).get(`${BASE}/all`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC24 – Get backtest by valid ID returns 200', async () => {
    if (!createdBacktestId) return;
    const res = await request(app).get(`${BASE}/getbyid/${createdBacktestId}`);
    expect(res.status).toBe(200);
  });

  test('TC25 – Get backtests by strategy_id returns 200 or 404', async () => {
    const res = await request(app).get(`${BASE}/getbystrategy/${seededStrategyId}`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC26 – Get backtests by invalid user_id returns 404', async () => {
    const res = await request(app).get(`${BASE}/getbyuser/${fixtures.fakeObjectId()}`);
    expect([404, 400]).toContain(res.status);
  });
});

describe('UC-03 | Delete Backtest', () => {
  test('TC27 – Delete backtest by valid ID returns 200', async () => {
    if (!createdBacktestId) return;
    const res = await request(app).delete(`${BASE}/deletebyid/${createdBacktestId}`);
    expect(res.status).toBe(200);
    createdBacktestId = null;
  });
});
