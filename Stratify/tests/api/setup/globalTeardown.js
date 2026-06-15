/**
 * globalTeardown.js  –  runs ONCE after ALL test suites
 * Drops the test database and closes the Mongoose connection.
 */

const path     = require('path');
const BACKEND  = path.resolve(__dirname, '../../../backend');
const mongoose = require(require.resolve('mongoose', { paths: [BACKEND] }));

module.exports = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('\n[Global Teardown] Test database dropped.');
  } catch (_) {
    // DB might already be gone – safe to ignore
  }
  await mongoose.disconnect();
  console.log('[Global Teardown] Mongoose disconnected.');
};
