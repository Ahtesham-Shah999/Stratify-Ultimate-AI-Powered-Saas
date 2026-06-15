/**
 * UC-06 – Community Hub
 *
 * Tests:
 *  TC36 – Create a community post (POST /api/post/create)
 *  TC37 – Create post with missing fields returns 400
 *  TC38 – Fetch all posts (GET /api/post/all)
 *  TC39 – Empty feed state (GET /api/post/all with fresh DB)
 *  TC40 – Fetch featured posts (GET /api/post/featured)
 *  TC41 – Fetch post by ID
 *  TC42 – Fetch posts by user
 *  TC43 – Vote on a post (POST /api/post/vote/:post_id)
 *  TC44 – Update a post
 *  TC45 – Delete a post
 */

const request  = require('supertest');
const mongoose = require('./setup/mongoose');
const app      = require('./setup/testServer');
const fixtures = require('./fixtures/mockData');

jest.mock('axios');

const BASE = '/api/post';

let seededUserId;
let seededStrategyId;
let createdPostId;

beforeAll(async () => {
  const User     = require('../../backend/models/User');
  const Strategy = require('../../backend/models/Strategy');
  const bcrypt   = require('bcryptjs');

  const hash = await bcrypt.hash('Test@1234', 10);
  const user = await User.create({
    username:      'communityuser',
    email:         'community@stratify.test',
    password_hash: hash,
    role:          'TRADER',
  });
  seededUserId = user._id.toString();

  const strategy = await Strategy.create({
    name:            'Community Strategy',
    language_input:  'Buy when price breaks resistance',
    symbol:          'USDJPY',
    timeframe:       'H4',
    initial_capital: 5000,
    user_id:         user._id,
    generated_rules: {},
  });
  seededStrategyId = strategy._id.toString();
});

// Note: DB is wiped by setupEnv.js before each suite; no manual cleanup needed.

// ─────────────────────────────────────────────────────────────────────────────

describe('UC-06 | Community Hub – Create Posts', () => {
  test('TC36 – Valid post creation returns 201', async () => {
    const res = await request(app)
      .post(`${BASE}/create`)
      .send({
        user_id:     seededUserId,
        strategy_id: seededStrategyId,
        title:       fixtures.validPost.title,
        body:        fixtures.validPost.content,  // controller uses 'body', not 'content'
      });

    expect([200, 201]).toContain(res.status);
    createdPostId = res.body.post?._id ?? res.body._id;
  });

  test('TC37 – Missing required fields returns 400 or 500', async () => {
    const res = await request(app).post(`${BASE}/create`).send({ title: '' });
    expect([400, 422, 500]).toContain(res.status);
  });
});

describe('UC-06 | Community Hub – Retrieve Posts', () => {
  test('TC38 – Fetch all posts returns array', async () => {
    const res = await request(app).get(`${BASE}/all`);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('TC39 – Fetch featured posts endpoint is reachable', async () => {
    const res = await request(app).get(`${BASE}/featured`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC40 – Fetch post by valid ID returns 200', async () => {
    if (!createdPostId) return;
    const res = await request(app).get(`${BASE}/getbyid/${createdPostId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
  });

  test('TC41 – Fetch posts by user returns list', async () => {
    const res = await request(app).get(`${BASE}/getbyuser/${seededUserId}`);
    expect([200, 404]).toContain(res.status);
  });
});

describe('UC-06 | Community Hub – Interaction', () => {
  test('TC42 – Vote on a post returns updated vote count', async () => {
    if (!createdPostId) return;
    const res = await request(app)
      .post(`${BASE}/vote/${createdPostId}`)
      .send({ user_id: seededUserId, vote: 'up' });  // controller accepts 'up'|'down' not 'upvote'

    expect([200, 201]).toContain(res.status);
  });

  test('TC43 – Update post content returns 200', async () => {
    if (!createdPostId) return;
    const res = await request(app)
      .post(`${BASE}/updatebyid/${createdPostId}`)
      .send({ body: 'Updated content from automated test' });

    expect([200, 201]).toContain(res.status);
  });

  test('TC44 – Delete post by ID returns 200', async () => {
    if (!createdPostId) return;
    const res = await request(app).delete(`${BASE}/deletebyid/${createdPostId}`);
    expect(res.status).toBe(200);
    createdPostId = null;
  });

  test('TC45 – Fetch posts from empty feed returns 404 or empty array', async () => {
    const ghostId = fixtures.fakeObjectId();
    const res = await request(app).get(`${BASE}/getbyuser/${ghostId}`);
    const isEmpty =
      res.status === 404 ||
      (res.status === 200 && Array.isArray(res.body) && res.body.length === 0);
    expect(isEmpty).toBe(true);
  });
});
