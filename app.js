const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Landing Page
app.get('/', (req, res) => {
  res.render('landing'); // renders views/landing.ejs
});

// Optional: Redirect /dashboard to /tasks
app.get('/dashboard', (req, res) => {
  res.redirect('/tasks');
});

// Routes
app.use('/auth', require('./routes/authRoute'));
app.use('/tasks', require('./routes/taskRoute'));

// Sequelize DB connection
const sequelize = require('./config/database');
sequelize.sync()  // ⚠️ Remove force: true in production, it drops tables!
  .then(() => console.log("✅ Database synced"))
  .catch(err => console.error("❌ DB Sync Error:", err));

// Basic error handler middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).render('error', { error: err }); // Create views/error.ejs
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
