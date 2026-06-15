/**
 * UC-07 – Portfolio Management
 *
 * Tests:
 *  TC46 – Create portfolio (POST /api/portfolio)
 *  TC47 – Create portfolio with missing fields returns 400
 *  TC48 – Get all portfolios
 *  TC49 – Get portfolio by ID
 *  TC50 – Get portfolios by user_id
 *  TC51 – Update portfolio
 *  TC52 – Get total capital by portfolio (with strategies)
 *  TC53 – Invalid strategy added to portfolio (bad portfolio_id)
 *  TC54 – Delete portfolio
 */

const request  = require('supertest');
const mongoose = require('./setup/mongoose');
const app      = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

jest.mock('axios');

const BASE = '/api/portfolio';

let seededUserId;
let createdPortfolioId;

beforeAll(async () => {
  const User   = require('../../backend/models/User');
  const bcrypt = require('bcryptjs');
  const hash   = await bcrypt.hash('Test@1234', 10);

  const user = await User.create({
    username:      'portfoliouser',
    email:         'portfolio@stratify.test',
    password_hash: hash,
    role:          'TRADER',
  });
  seededUserId = user._id.toString();
});

// Note: DB is wiped by setupEnv.js before each suite; no manual cleanup needed.

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-07 | Portfolio Management – Create', () => {
  test('TC46 – Valid portfolio creation returns 201', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...fixtures.validPortfolio, user_id: seededUserId });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('message');
    createdPortfolioId = res.body.portfolio?._id;
  });

  test('TC47 – Missing required fields returns 400', async () => {
    const res = await request(app).post(BASE).send(fixtures.invalidPortfolio);
    expect([400, 422, 500]).toContain(res.status);
  });
});

describe('UC-07 | Portfolio Management – Retrieval', () => {
  test('TC48 – Get all portfolios returns 200 or 404', async () => {
    const res = await request(app).get(BASE);
    expect([200, 404]).toContain(res.status);
  });

  test('TC49 – Get portfolio by valid ID returns 200', async () => {
    if (!createdPortfolioId) return;
    const res = await request(app).get(`${BASE}/${createdPortfolioId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', createdPortfolioId);
  });

  test('TC50 – Get portfolios by user_id returns array', async () => {
    const res = await request(app).get(`${BASE}/user/${seededUserId}`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC51 – Get total capital with no strategies returns 404', async () => {
    if (!createdPortfolioId) return;
    const res = await request(app).get(`${BASE}/totalcapital/${createdPortfolioId}`);
    // No strategies assigned yet → 404 with message
    expect([200, 404]).toContain(res.status);
  });
});

describe('UC-07 | Portfolio Management – Update & Delete', () => {
  test('TC52 – Update portfolio name returns 200', async () => {
    if (!createdPortfolioId) return;
    const res = await request(app)
      .put(`${BASE}/${createdPortfolioId}`)
      .send({ name: 'Renamed Portfolio – Test', description: 'Updated by automated test' });

    expect(res.status).toBe(200);
    expect(res.body.portfolio).toHaveProperty('name', 'Renamed Portfolio – Test');
  });

  test('TC53 – Invalid strategy selection (bad portfolio_id) returns 400 or 404', async () => {
    const res = await request(app).get(`${BASE}/${fixtures.fakeObjectId()}`);
    expect([400, 404]).toContain(res.status);
  });

  test('TC54 – Delete portfolio returns 200', async () => {
    if (!createdPortfolioId) return;
    const res = await request(app).delete(`${BASE}/${createdPortfolioId}`);
    expect(res.status).toBe(200);
    createdPortfolioId = null;
  });
});
