const { db } = require('../database');

const staffService = {
  getAll() {
    return db.prepare('SELECT * FROM staff WHERE is_active = 1 ORDER BY first_name, last_name').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM staff WHERE id = ? AND is_active = 1').get(id);
  },

  create({ first_name, last_name, role, cash_register_auth, standard_availability }) {
    const result = db.prepare(
      'INSERT INTO staff (first_name, last_name, role, cash_register_auth, standard_availability) VALUES (?, ?, ?, ?, ?)'
    ).run(first_name, last_name, role, cash_register_auth ? 1 : 0, standard_availability);
    return this.getById(result.lastInsertRowid);
  },

  update(id, { first_name, last_name, role, cash_register_auth, standard_availability }) {
    db.prepare(
      'UPDATE staff SET first_name = ?, last_name = ?, role = ?, cash_register_auth = ?, standard_availability = ? WHERE id = ? AND is_active = 1'
    ).run(first_name, last_name, role, cash_register_auth ? 1 : 0, standard_availability, id);
    return this.getById(id);
  },

  delete(id) {
    // Soft delete
    db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?').run(id);
    return { success: true };
  },

  getAvailableForDate(date) {
    return db.prepare(`
      SELECT s.* FROM staff s
      WHERE s.is_active = 1
        AND s.id NOT IN (
          SELECT staff_id FROM time_off WHERE date = ?
        )
      ORDER BY s.first_name, s.last_name
    `).all(date);
  }
};

module.exports = staffService;
