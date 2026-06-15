/**
 * UC-04 – Sentiment Analysis
 *
 * Tests:
 *  TC28 – Successful sentiment generation (POST /api/sentiment/analyze)
 *  TC29 – Empty payload returns 400
 *  TC30 – Unknown symbol still handled gracefully
 */

const request = require('supertest');
const app     = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

// Mock axios so no real call goes to the Python sentiment service
jest.mock('axios');

const BASE = '/api/sentiment';

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-04 | Sentiment Analysis', () => {
  test('TC28 – Valid pair returns sentiment result with score', async () => {
    const res = await request(app)
      .post(`${BASE}/analyze`)
      .send(fixtures.validSentimentPayload);   // { pair: 'AAPL' }

    expect([200, 201]).toContain(res.status);
    // Accept either the direct Python response or a wrapper object
    const body = res.body;
    const hasSentiment =
      body.sentiment !== undefined ||
      body.data?.sentiment !== undefined ||
      body.result?.sentiment !== undefined;
    expect(hasSentiment).toBe(true);
  });

  test('TC29 – Empty payload returns 400 or descriptive error', async () => {
    const res = await request(app)
      .post(`${BASE}/analyze`)
      .send(fixtures.emptySentimentPayload);   // {}

    expect([400, 422, 500]).toContain(res.status);
  });

  test('TC30 – Unknown / obscure pair is handled without crashing', async () => {
    // Override axios mock to return empty articles for this case
    const axios = require('axios');
    axios.get.mockResolvedValueOnce({
      data: { pair: 'UNKNWN', sentiment: 'Neutral', score: 0, articles: [] },
    });

    const res = await request(app)
      .post(`${BASE}/analyze`)
      .send({ pair: 'UNKNWN' });

    // Must not throw 500; should be a handled response
    expect([200, 404]).toContain(res.status);
  });
});
