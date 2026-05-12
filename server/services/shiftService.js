const { db } = require('../database');
const { generateShiftOptions, calculateConsecutiveDays, getStaffingConfig } = require('../utils/shiftAlgorithm');

const shiftService = {
  /**
   * Generate 3 shift options for a given date
   */
  generate(date) {
    // Clear previous unselected options for this date
    const existingOptions = db.prepare('SELECT id FROM shift_options WHERE date = ?').all(date);
    for (const opt of existingOptions) {
      const isSelected = db.prepare('SELECT is_selected FROM shift_options WHERE id = ?').get(opt.id);
      if (!isSelected || !isSelected.is_selected) {
        db.prepare('DELETE FROM shift_assignments WHERE option_id = ?').run(opt.id);
        db.prepare('DELETE FROM shift_options WHERE id = ?').run(opt.id);
      }
    }

    const options = generateShiftOptions(date);

    const insertOption = db.prepare(
      'INSERT INTO shift_options (date, option_number, description) VALUES (?, ?, ?)'
    );
    const insertAssignment = db.prepare(
      'INSERT INTO shift_assignments (option_id, staff_id, shift_type, start_time, end_time, consecutive_day) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const savedOptions = [];

    const transaction = db.transaction(() => {
      for (const opt of options) {
        const result = insertOption.run(date, opt.option_number, opt.description);
        const optionId = result.lastInsertRowid;

        const savedAssignments = [];
        for (const a of opt.assignments) {
          insertAssignment.run(optionId, a.staff_id, a.shift_type, a.start_time, a.end_time, a.consecutive_day);
          const staff = opt.staffMap[a.staff_id];
          savedAssignments.push({
            ...a,
            staff_name: `${staff.first_name} ${staff.last_name}`,
            role: staff.role,
            cash_register_auth: staff.cash_register_auth
          });
        }

        savedOptions.push({
          id: optionId,
          date,
          option_number: opt.option_number,
          description: opt.description,
          is_selected: 0,
          assignments: savedAssignments,
          validation: opt.validation
        });
      }
    });

    transaction();
    return savedOptions;
  },

  /**
   * Get options for a given date with their assignments
   */
  getOptionsForDate(date) {
    const options = db.prepare('SELECT * FROM shift_options WHERE date = ? ORDER BY option_number').all(date);

    return options.map(opt => {
      const assignments = db.prepare(`
        SELECT sa.*, s.first_name, s.last_name, s.role, s.cash_register_auth
        FROM shift_assignments sa
        JOIN staff s ON sa.staff_id = s.id
        WHERE sa.option_id = ?
        ORDER BY sa.shift_type, s.role, s.first_name
      `).all(opt.id);

      return { ...opt, assignments };
    });
  },

  /**
   * Select (approve) an option
   */
  selectOption(optionId) {
    const option = db.prepare('SELECT * FROM shift_options WHERE id = ?').get(optionId);
    if (!option) throw new Error('Opsiyon bulunamadı.');

    // Deselect all other options for the same date
    db.prepare('UPDATE shift_options SET is_selected = 0 WHERE date = ?').run(option.date);
    // Select this one
    db.prepare('UPDATE shift_options SET is_selected = 1 WHERE id = ?').run(optionId);

    return this.getOptionsForDate(option.date);
  },

  /**
   * Get calendar data for a month (only selected options)
   */
  getCalendarData(year, month) {
    const monthStr = String(month).padStart(2, '0');
    const pattern = `${year}-${monthStr}-%`;

    const options = db.prepare(`
      SELECT so.*, sa.staff_id, sa.shift_type, sa.start_time, sa.end_time, sa.consecutive_day,
             s.first_name, s.last_name, s.role, s.cash_register_auth
      FROM shift_options so
      JOIN shift_assignments sa ON so.id = sa.option_id
      JOIN staff s ON sa.staff_id = s.id
      WHERE so.date LIKE ? AND so.is_selected = 1
      ORDER BY so.date, sa.shift_type, s.role, s.first_name
    `).all(pattern);

    // Group by date
    const calendar = {};
    for (const row of options) {
      if (!calendar[row.date]) calendar[row.date] = [];
      calendar[row.date].push({
        staff_id: row.staff_id,
        staff_name: `${row.first_name} ${row.last_name}`,
        role: row.role,
        cash_register_auth: row.cash_register_auth,
        shift_type: row.shift_type,
        start_time: row.start_time,
        end_time: row.end_time,
        consecutive_day: row.consecutive_day
      });
    }

    return calendar;
  },

  /**
   * Get consecutive day info for a staff member
   */
  getConsecutiveInfo(staffId, date) {
    return calculateConsecutiveDays(staffId, date || new Date().toISOString().slice(0, 10));
  },

  /**
   * Get/update staffing configuration
   */
  getConfig() {
    return getStaffingConfig();
  },

  updateConfig(dayType, role, minCount, targetCount) {
    db.prepare(
      'UPDATE staffing_config SET min_count = ?, target_count = ? WHERE day_type = ? AND role = ?'
    ).run(minCount, targetCount, dayType, role);
    return this.getConfig();
  }
};

module.exports = shiftService;
