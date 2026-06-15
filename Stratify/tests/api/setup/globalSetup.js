/**
 * globalSetup.js  –  runs ONCE before ALL test suites
 * Connects to a dedicated test MongoDB database.
 */

const path     = require('path');
const BACKEND  = path.resolve(__dirname, '../../../backend');
const mongoose = require(require.resolve('mongoose', { paths: [BACKEND] }));
require(require.resolve('dotenv', { paths: [BACKEND] })).config({ path: path.resolve(BACKEND, '.env') });

module.exports = async () => {
  // Use a separate test database so production data is never touched
  const testUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stratify')
    .replace(/\/([^/?]+)(\?|$)/, '/stratify_test$2');

  await mongoose.connect(testUri);
  console.log(`\n[Global Setup] Connected to test DB: ${testUri}`);

  // Store URI so teardown can reuse the same connection string
  process.env.MONGO_URI_TEST = testUri;
};
