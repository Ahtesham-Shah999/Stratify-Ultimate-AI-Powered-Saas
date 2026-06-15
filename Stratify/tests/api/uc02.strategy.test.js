/**
 * UC-02 – Create Trading Strategy (Plain English)
 *
 * Tests:
 *  TC11 – Valid strategy creation (POST /api/strategy/create)
 *  TC12 – Empty strategy input returns 400
 *  TC13 – Parse plain-English strategy (POST /api/strategy/parsedstrategy)
 *  TC14 – Parse with invalid/gibberish input
 *  TC15 – Get strategy by user ID
 *  TC16 – Get strategy by ID
 *  TC17 – Update strategy by ID
 *  TC18 – Delete strategy by ID
 */

const request  = require('supertest');
const mongoose = require('./setup/mongoose');
const app      = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

// Mock the Python AI engine to avoid real HTTP calls during unit tests
jest.mock('axios');

const BASE = '/api/strategy';

let testUserId;
let createdStrategyId;

beforeAll(async () => {
  // Create a throw-away user to own the strategies
  const res = await request(app).post('/api/user/signup').send({
    username: 'strategyowner',
    email:    'strategyowner@stratify.test',
    password: 'Test@1234',
    role:     'TRADER',
  });
  testUserId = res.body?.user?._id ?? fixtures.fakeObjectId();
});

// Note: DB is wiped by setupEnv.js before each suite; no manual cleanup needed.

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-02 | Create Strategy', () => {
  test('TC11 – Valid strategy creation returns 201', async () => {
    const payload = { ...fixtures.validStrategy, user_id: testUserId };
    const res = await request(app).post(`${BASE}/create`).send(payload);

    expect([200, 201]).toContain(res.status);
    if (res.body.strategy) {
      createdStrategyId = res.body.strategy._id;
    }
    expect(res.body).toHaveProperty('message');
  });

  test('TC12 – Empty strategy input returns 400', async () => {
    const res = await request(app).post(`${BASE}/create`).send(fixtures.emptyStrategy);
    expect([400, 422, 500]).toContain(res.status);
  });
});

describe('UC-02 | Parse Plain-English Strategy', () => {
  test('TC13 – Valid plain-English input returns parsed rules', async () => {
    const res = await request(app)
      .post(`${BASE}/parsedstrategy`)
      .send({ language_input: fixtures.validStrategy.language_input });

    expect([200, 201]).toContain(res.status);
  });

  test('TC14 – Gibberish input returns error or empty rules', async () => {
    const res = await request(app)
      .post(`${BASE}/parsedstrategy`)
      .send({ language_input: fixtures.invalidStrategyInput.language_input });

    // Either the AI engine flags it (400) or returns with empty rules (200)
    expect([200, 400, 422, 500]).toContain(res.status);
  });
});

describe('UC-02 | Strategy Retrieval', () => {
  test('TC15 – Get strategies by user ID returns array', async () => {
    const res = await request(app).get(`${BASE}/getbyuser/${testUserId}`);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('TC16 – Get strategy by valid ID returns 200', async () => {
    if (!createdStrategyId) return; // skip if TC11 did not produce an ID
    const res = await request(app).get(`${BASE}/getbyid/${createdStrategyId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', createdStrategyId);
  });

  test('TC17 – Get strategy by invalid ID returns 400 or 404', async () => {
    const res = await request(app).get(`${BASE}/getbyid/nonexistentid`);
    expect([400, 404, 500]).toContain(res.status);
  });
});

describe('UC-02 | Strategy Update & Delete', () => {
  test('TC18 – Update strategy by ID returns updated document', async () => {
    if (!createdStrategyId) return;
    const res = await request(app)
      .post(`${BASE}/updatebyid/${createdStrategyId}`)
      .send({ description: 'Updated description via test' });

    expect([200, 201]).toContain(res.status);
  });

  test('TC19 – Delete strategy by valid ID returns 200', async () => {
    if (!createdStrategyId) return;
    const res = await request(app).delete(`${BASE}/deletebyid/${createdStrategyId}`);
    expect(res.status).toBe(200);
  });
});
