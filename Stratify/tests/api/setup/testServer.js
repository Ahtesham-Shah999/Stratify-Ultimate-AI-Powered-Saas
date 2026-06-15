/**
 * testServer.js
 * Bootstraps the Express application without calling app.listen()
 * so that Supertest can bind its own ephemeral port.
 * All requires are resolved through backend/node_modules.
 */

const path    = require('path');
const BACKEND = path.resolve(__dirname, '../../../backend');

// Resolve all backend deps from backend/node_modules
function req(mod) { return require(require.resolve(mod, { paths: [BACKEND] })); }

req('dotenv').config({ path: path.resolve(BACKEND, '.env') });

const express  = req('express');
const cors     = req('cors');

// Route modules
const userRoutes      = require('../../../backend/routes/user');
const authRoutes      = require('../../../backend/routes/auth');
const strategyRoutes  = require('../../../backend/routes/Strategy');
const portfolioRoutes = require('../../../backend/routes/portfolio');
const backtestRoutes  = require('../../../backend/routes/backtest');
const postRoutes      = require('../../../backend/routes/post');
const adminRoutes     = require('../../../backend/routes/Admin');
const sentimentRoutes = require('../../../backend/routes/Sentiment');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../../backend/public')));

app.use('/api/auth',      authRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/strategy',  strategyRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/backtest',  backtestRoutes);
app.use('/api/post',      postRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/sentiment', sentimentRoutes);

app.get('/', (req, res) => res.send('Test server running'));

module.exports = app;
