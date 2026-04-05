require('dotenv').config(); // load env variables
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user')
const authRoutes = require('./routes/auth')
const strategyRoutes = require('./routes/Strategy')// your User schema
const portfolioRoutes = require('./routes/portfolio')
const backtestRoutes = require('./routes/backtest')
const postRoutes = require('./routes/post')
const adminRoutes = require('./routes/Admin')
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// For URL-encoded payloads (optional, if sending form data)
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
// Connect to MongoDB
connectDB(MONGO_URI);
// Test route (no new user creation)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/post', postRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
  res.send('Backend is running and connected to MongoDB!');
});
console.log(`MongoDB URI: ${MONGO_URI}`);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
