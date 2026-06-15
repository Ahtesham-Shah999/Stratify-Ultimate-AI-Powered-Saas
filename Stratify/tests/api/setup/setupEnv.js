const path = require('path');
const BACKEND = path.resolve(__dirname, '../../../backend');

// Resolve mongoose from backend
function req(mod) { return require(require.resolve(mod, { paths: [BACKEND] })); }

const mongoose = req('mongoose');
const nock = require('nock');
req('dotenv').config({ path: path.resolve(BACKEND, '.env') });

beforeAll(async () => {
  const workerId = process.env.JEST_WORKER_ID || '1';
  const testUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stratify')
    .replace(/\/([^/?]+)(\?|$)/, `/stratify_test_${workerId}$2`);
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }
  
  // Clear all collections for this suite
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }

  nock('http://127.0.0.1:8001')
    .persist()
    .get(uri => uri.includes('/sentiment'))
    .reply(200, {
      pair: 'AAPL',
      sentiment: 'Bullish',
      score: 0.78,
      articles: [{ title: 'Apple hits record high', source: 'Reuters', url: 'https://reuters.com/apple' }]
    })
    .post('/parse-strategy')
    .reply((uri, body) => {
      let reqBody = typeof body === 'string' ? JSON.parse(body) : body;
      if (reqBody?.language_input?.includes('invalid') || reqBody?.language_input?.includes('Gibberish')) {
        return [200, { description: 'Non-trading input rejected', warnings: ['Invalid input'] }];
      }
      return [200, {
        generated_rules: {
          entry_conditions: [{ indicator: 'MA_CROSS', params: { fast: 50, slow: 200 }, direction: 'above' }],
          exit_conditions: [{ indicator: 'MA_CROSS', params: { fast: 50, slow: 200 }, direction: 'below' }]
        },
        meta: { timeframe: '1h', symbols: ['AAPL'] }
      }];
    })
    .post('/validate-strategy')
    .reply(200, { is_valid: true, valid_syntax: true })
    .post(uri => uri.includes('backtest'))
    .reply(200, {
      profit_loss: 1500.50,
      win_rate: 65.5,
      total_trades: 42,
      max_drawdown: 5.2
    });
});

afterAll(() => {
  nock.cleanAll();
});




