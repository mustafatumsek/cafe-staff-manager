const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize database
initializeDatabase();

// API Routes
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/time-off', require('./routes/timeOffRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n☕ Kafe Personel Yönetim Sistemi`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📂 Veritabanı: data/cafe.db\n`);
});
