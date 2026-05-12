const { db } = require('../database');

const timeOffService = {
  getAll(filters = {}) {
    let query = `
      SELECT t.*, s.first_name, s.last_name, s.role 
      FROM time_off t 
      JOIN staff s ON t.staff_id = s.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.staffId) {
      query += ' AND t.staff_id = ?';
      params.push(filters.staffId);
    }
    if (filters.month && filters.year) {
      query += " AND t.date LIKE ?";
      params.push(`${filters.year}-${String(filters.month).padStart(2, '0')}-%`);
    }
    if (filters.date) {
      query += ' AND t.date = ?';
      params.push(filters.date);
    }

    query += ' ORDER BY t.date DESC';
    return db.prepare(query).all(...params);
  },

  create({ staff_id, date, note }) {
    try {
      const result = db.prepare(
        'INSERT INTO time_off (staff_id, date, note) VALUES (?, ?, ?)'
      ).run(staff_id, date, note || null);
      return db.prepare(`
        SELECT t.*, s.first_name, s.last_name, s.role 
        FROM time_off t JOIN staff s ON t.staff_id = s.id 
        WHERE t.id = ?
      `).get(result.lastInsertRowid);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        throw new Error('Bu personel bu tarihte zaten izinli.');
      }
      throw err;
    }
  },

  delete(id) {
    db.prepare('DELETE FROM time_off WHERE id = ?').run(id);
    return { success: true };
  },

  getByDate(date) {
    return db.prepare(`
      SELECT t.*, s.first_name, s.last_name, s.role 
      FROM time_off t 
      JOIN staff s ON t.staff_id = s.id 
      WHERE t.date = ?
    `).all(date);
  }
};

module.exports = timeOffService;
