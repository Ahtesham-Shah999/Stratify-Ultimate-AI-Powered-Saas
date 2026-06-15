const path = require('path');
const BACKEND = path.resolve(__dirname, '../../../backend');
module.exports = require(require.resolve('mongoose', { paths: [BACKEND] }));
