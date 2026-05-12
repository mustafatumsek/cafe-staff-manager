const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'cafe.db');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Barista', 'Garson')),
      cash_register_auth INTEGER NOT NULL DEFAULT 0,
      standard_availability TEXT NOT NULL CHECK(standard_availability IN ('Sabah', 'Araci', 'Aksam', 'Esnek')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_off (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE(staff_id, date)
    );

    CREATE TABLE IF NOT EXISTS shift_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      option_number INTEGER NOT NULL,
      is_selected INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shift_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      shift_type TEXT NOT NULL CHECK(shift_type IN ('Sabah', 'Araci', 'Aksam')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      consecutive_day INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (option_id) REFERENCES shift_options(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS staffing_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_type TEXT NOT NULL CHECK(day_type IN ('weekday', 'weekend')),
      role TEXT NOT NULL CHECK(role IN ('Barista', 'Garson')),
      min_count INTEGER NOT NULL,
      target_count INTEGER NOT NULL,
      UNIQUE(day_type, role)
    );
  `);

  // Seed staffing config defaults if empty
  const configCount = db.prepare('SELECT COUNT(*) as cnt FROM staffing_config').get();
  if (configCount.cnt === 0) {
    const insertConfig = db.prepare('INSERT INTO staffing_config (day_type, role, min_count, target_count) VALUES (?, ?, ?, ?)');
    insertConfig.run('weekday', 'Barista', 1, 2);
    insertConfig.run('weekday', 'Garson', 1, 4);
    insertConfig.run('weekend', 'Barista', 2, 3);
    insertConfig.run('weekend', 'Garson', 2, 6);
  }

  console.log('✅ Veritabanı başarıyla başlatıldı:', DB_PATH);
}

module.exports = { db, initializeDatabase, DB_PATH };
