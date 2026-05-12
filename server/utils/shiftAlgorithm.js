const { db } = require('../database');

// Shift time slot definitions
const SHIFT_SLOTS = {
  Sabah: [
    { start: '09:00', end: '16:00' },
    { start: '09:00', end: '17:00' }
  ],
  Araci: [
    { start: '13:00', end: '21:00' },
    { start: '14:00', end: '22:00' }
  ],
  Aksam: [
    { start: '16:00', end: '00:00' },
    { start: '17:00', end: '00:00' },
    { start: '18:00', end: '00:00' }
  ]
};

/**
 * Calculate consecutive working days for a staff member up to (not including) targetDate.
 * Returns the count including the new day being assigned.
 */
function calculateConsecutiveDays(staffId, targetDate) {
  const rows = db.prepare(`
    SELECT DISTINCT so.date 
    FROM shift_assignments sa 
    JOIN shift_options so ON sa.option_id = so.id 
    WHERE sa.staff_id = ? AND so.is_selected = 1 AND so.date < ?
    ORDER BY so.date DESC
  `).all(staffId, targetDate);

  let count = 1; // including today
  const check = new Date(targetDate + 'T00:00:00');
  check.setDate(check.getDate() - 1);

  for (const row of rows) {
    const y = check.getFullYear();
    const m = String(check.getMonth() + 1).padStart(2, '0');
    const d = String(check.getDate()).padStart(2, '0');
    const checkStr = `${y}-${m}-${d}`;
    if (row.date === checkStr) {
      count++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

/**
 * Get staffing config from database
 */
function getStaffingConfig() {
  const rows = db.prepare('SELECT * FROM staffing_config').all();
  const config = { weekday: {}, weekend: {} };
  for (const row of rows) {
    config[row.day_type][row.role] = {
      min: row.min_count,
      target: row.target_count
    };
  }
  return config;
}

/**
 * Check if a given hour is covered by a shift assignment
 */
function isActiveAtHour(assignment, hour) {
  const start = parseInt(assignment.start_time.split(':')[0]);
  const end = parseInt(assignment.end_time.split(':')[0]) || 24;
  return start <= hour && hour < end;
}

/**
 * Validate that all hours 09-23 are covered by at least 1 Barista, 1 Garson, 1 cash-auth
 */
function validateCoverage(assignments, staffMap) {
  const errors = [];
  for (let hour = 9; hour < 24; hour++) {
    const active = assignments.filter(a => isActiveAtHour(a, hour));
    const hasBarista = active.some(a => staffMap[a.staff_id].role === 'Barista');
    const hasGarson = active.some(a => staffMap[a.staff_id].role === 'Garson');
    const hasCash = active.some(a => staffMap[a.staff_id].cash_register_auth === 1);

    if (!hasBarista) errors.push({ hour, missing: 'Barista' });
    if (!hasGarson) errors.push({ hour, missing: 'Garson' });
    if (!hasCash) errors.push({ hour, missing: 'KasaYetkisi' });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Categorize staff into pools based on their availability
 */
function categorizeStaff(availableStaff) {
  const pools = { Sabah: [], Araci: [], Aksam: [], Esnek: [] };
  for (const s of availableStaff) {
    pools[s.standard_availability].push(s);
  }
  return pools;
}

/**
 * Shuffle array (Fisher-Yates) - returns new array
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` items from pool, avoiding already-used IDs. Returns picked items.
 */
function pickFromPool(pool, count, usedIds) {
  const available = pool.filter(s => !usedIds.has(s.id));
  return available.slice(0, count);
}

/**
 * Determine how many of each role are needed per shift type for a strategy.
 * Returns { Sabah: { Barista: n, Garson: n }, Araci: {...}, Aksam: {...} }
 */
function computeDistribution(targetBarista, targetGarson, strategy) {
  const dist = {
    Sabah: { Barista: 0, Garson: 0 },
    Araci: { Barista: 0, Garson: 0 },
    Aksam: { Barista: 0, Garson: 0 }
  };

  if (strategy === 'morning_heavy') {
    // Morning gets more, araci minimal, aksam rest
    dist.Sabah.Barista = Math.max(1, Math.ceil(targetBarista * 0.5));
    dist.Aksam.Barista = Math.max(1, Math.ceil(targetBarista * 0.3));
    dist.Araci.Barista = Math.max(0, targetBarista - dist.Sabah.Barista - dist.Aksam.Barista);

    dist.Sabah.Garson = Math.max(1, Math.ceil(targetGarson * 0.45));
    dist.Aksam.Garson = Math.max(1, Math.ceil(targetGarson * 0.3));
    dist.Araci.Garson = Math.max(0, targetGarson - dist.Sabah.Garson - dist.Aksam.Garson);

  } else if (strategy === 'balanced') {
    // Even distribution across 3 shifts
    const bPer = Math.floor(targetBarista / 3);
    const bRem = targetBarista % 3;
    dist.Sabah.Barista = Math.max(1, bPer + (bRem > 0 ? 1 : 0));
    dist.Araci.Barista = Math.max(0, bPer + (bRem > 1 ? 1 : 0));
    dist.Aksam.Barista = Math.max(1, bPer);

    const gPer = Math.floor(targetGarson / 3);
    const gRem = targetGarson % 3;
    dist.Sabah.Garson = Math.max(1, gPer + (gRem > 0 ? 1 : 0));
    dist.Araci.Garson = Math.max(0, gPer + (gRem > 1 ? 1 : 0));
    dist.Aksam.Garson = Math.max(1, gPer);

  } else if (strategy === 'evening_heavy') {
    // Evening gets more staff
    dist.Aksam.Barista = Math.max(1, Math.ceil(targetBarista * 0.5));
    dist.Sabah.Barista = Math.max(1, Math.ceil(targetBarista * 0.3));
    dist.Araci.Barista = Math.max(0, targetBarista - dist.Sabah.Barista - dist.Aksam.Barista);

    dist.Aksam.Garson = Math.max(1, Math.ceil(targetGarson * 0.45));
    dist.Sabah.Garson = Math.max(1, Math.ceil(targetGarson * 0.3));
    dist.Araci.Garson = Math.max(0, targetGarson - dist.Sabah.Garson - dist.Aksam.Garson);
  }

  // Ensure at least 1 barista and 1 garson in sabah and aksam for coverage
  dist.Sabah.Barista = Math.max(1, dist.Sabah.Barista);
  dist.Sabah.Garson = Math.max(1, dist.Sabah.Garson);
  dist.Aksam.Barista = Math.max(1, dist.Aksam.Barista);
  dist.Aksam.Garson = Math.max(1, dist.Aksam.Garson);

  return dist;
}

/**
 * Choose shift times ensuring no coverage gap.
 * If araci is used, gaps can be flexible. Otherwise, sabah+aksam must be seamless.
 */
function chooseShiftTimes(shiftType, hasAraci, variant) {
  const slots = SHIFT_SLOTS[shiftType];
  if (shiftType === 'Sabah') {
    if (hasAraci) return slots[variant % slots.length];
    // Without araci, prefer sabah ending at 17 with aksam starting at 17 or sabah at 16 with aksam at 16
    return variant === 0 ? slots[0] : slots[1];
  }
  if (shiftType === 'Araci') {
    return slots[variant % slots.length];
  }
  if (shiftType === 'Aksam') {
    if (hasAraci) return slots[variant % slots.length];
    return variant === 0 ? slots[0] : slots[1]; // 16:00 or 17:00 start
  }
  return slots[0];
}

/**
 * Build assignments for a single strategy.
 * @param {Array} availableStaff - staff not on time-off
 * @param {Object} consecutiveDays - { staffId: count }
 * @param {string} strategy - 'morning_heavy' | 'balanced' | 'evening_heavy'
 * @param {Object} targets - { Barista: { target }, Garson: { target } }
 * @param {number} variant - 0,1,2 for time slot variation
 */
function buildAssignments(availableStaff, consecutiveDays, strategy, targets, variant) {
  const targetBarista = targets.Barista?.target || 2;
  const targetGarson = targets.Garson?.target || 4;
  const dist = computeDistribution(targetBarista, targetGarson, strategy);

  const pools = categorizeStaff(availableStaff);
  const usedIds = new Set();
  const assignments = [];

  // Sort staff for consecutive day minimization strategy
  let sortFn = () => 0;
  if (strategy === 'evening_heavy') {
    // For the 3rd strategy, prefer staff with fewer consecutive days
    sortFn = (a, b) => (consecutiveDays[a.id] || 0) - (consecutiveDays[b.id] || 0);
  }

  const hasAraci = dist.Araci.Barista > 0 || dist.Araci.Garson > 0;

  // Assign for each shift type
  for (const shiftType of ['Sabah', 'Araci', 'Aksam']) {
    const needed = dist[shiftType];
    if (needed.Barista === 0 && needed.Garson === 0) continue;

    const times = chooseShiftTimes(shiftType, hasAraci, variant);

    for (const role of ['Barista', 'Garson']) {
      const count = needed[role];
      if (count === 0) continue;

      // Build candidate pool: dedicated pool + Esnek pool, filtered by role
      const dedicated = (pools[shiftType] || []).filter(s => s.role === role && !usedIds.has(s.id));
      const esnek = (pools.Esnek || []).filter(s => s.role === role && !usedIds.has(s.id));
      let candidates = [...dedicated, ...esnek];
      candidates.sort(sortFn);

      // If still not enough, try other pools (flexibility fallback)
      if (candidates.length < count) {
        const otherPools = ['Sabah', 'Araci', 'Aksam'].filter(t => t !== shiftType);
        for (const ot of otherPools) {
          const extra = (pools[ot] || []).filter(s => s.role === role && !usedIds.has(s.id) && !candidates.includes(s));
          candidates = [...candidates, ...extra];
        }
        candidates.sort(sortFn);
      }

      const picked = candidates.slice(0, count);
      for (const staff of picked) {
        usedIds.add(staff.id);
        assignments.push({
          staff_id: staff.id,
          shift_type: shiftType,
          start_time: times.start,
          end_time: times.end,
          consecutive_day: consecutiveDays[staff.id] || 1
        });
      }
    }
  }

  // Cash register auth check - ensure at least one per shift coverage
  return assignments;
}

/**
 * Fix coverage gaps by adjusting shift times
 */
function fixCoverageGaps(assignments, staffMap) {
  // Find gap hours
  for (let hour = 9; hour < 24; hour++) {
    const active = assignments.filter(a => isActiveAtHour(a, hour));
    const hasBarista = active.some(a => staffMap[a.staff_id].role === 'Barista');
    const hasGarson = active.some(a => staffMap[a.staff_id].role === 'Garson');

    if (!hasBarista || !hasGarson) {
      // Try extending adjacent shifts to cover the gap
      for (const a of assignments) {
        const start = parseInt(a.start_time.split(':')[0]);
        const end = parseInt(a.end_time.split(':')[0]) || 24;
        const role = staffMap[a.staff_id].role;
        const missingRole = !hasBarista ? 'Barista' : 'Garson';

        if (role !== missingRole) continue;

        // If shift ends right before the gap, extend it
        if (end === hour && a.shift_type === 'Sabah') {
          a.end_time = String(Math.min(hour + 1, 17)).padStart(2, '0') + ':00';
        }
        // If shift starts right after the gap, move start earlier
        if (start === hour + 1 && a.shift_type === 'Aksam') {
          a.start_time = String(Math.max(hour, 16)).padStart(2, '0') + ':00';
        }
      }
    }
  }
  return assignments;
}

/**
 * Main entry: generate 3 shift options for a given date.
 */
function generateShiftOptions(date) {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const config = getStaffingConfig();
  const targets = isWeekend ? config.weekend : config.weekday;

  // Get available staff (active, not on time-off)
  const availableStaff = db.prepare(`
    SELECT s.* FROM staff s
    WHERE s.is_active = 1
      AND s.id NOT IN (SELECT staff_id FROM time_off WHERE date = ?)
    ORDER BY s.first_name
  `).all(date);

  if (availableStaff.length === 0) {
    throw new Error('Bu tarih için müsait personel bulunmuyor.');
  }

  const baristaCount = availableStaff.filter(s => s.role === 'Barista').length;
  const garsonCount = availableStaff.filter(s => s.role === 'Garson').length;

  if (baristaCount < 1) throw new Error('En az 1 Barista gerekli. Müsait Barista yok.');
  if (garsonCount < 1) throw new Error('En az 1 Garson gerekli. Müsait Garson yok.');

  const hasCashAuth = availableStaff.some(s => s.cash_register_auth === 1);
  if (!hasCashAuth) throw new Error('Kasa yetkili personel bulunmuyor.');

  // Build staff map
  const staffMap = {};
  for (const s of availableStaff) {
    staffMap[s.id] = s;
  }

  // Calculate consecutive days for each staff member
  const consecutiveDays = {};
  for (const s of availableStaff) {
    consecutiveDays[s.id] = calculateConsecutiveDays(s.id, date);
  }

  // Generate 3 strategies
  const strategies = [
    { name: 'morning_heavy', desc: 'Sabah Ağırlıklı — Sabah vardiyasına daha fazla personel atanır' },
    { name: 'balanced', desc: 'Dengeli Dağılım — Personel tüm vardiyalara eşit dağıtılır' },
    { name: 'evening_heavy', desc: 'Ardışık Gün Optimizasyonu — Az çalışan personele öncelik verilir' }
  ];

  const options = [];

  for (let i = 0; i < strategies.length; i++) {
    const strat = strategies[i];
    // Shuffle to get variation between runs
    const shuffled = shuffle(availableStaff);

    let assignments = buildAssignments(shuffled, consecutiveDays, strat.name, targets, i);
    assignments = fixCoverageGaps(assignments, staffMap);

    const validation = validateCoverage(assignments, staffMap);

    // If validation fails, try to add more staff
    if (!validation.valid) {
      assignments = repairAssignments(assignments, availableStaff, staffMap, consecutiveDays);
    }

    options.push({
      option_number: i + 1,
      description: strat.desc,
      assignments,
      validation: validateCoverage(assignments, staffMap),
      isWeekend,
      staffMap
    });
  }

  return options;
}

/**
 * Attempt to repair invalid assignments by adding missing coverage
 */
function repairAssignments(assignments, availableStaff, staffMap, consecutiveDays) {
  const usedIds = new Set(assignments.map(a => a.staff_id));

  for (let hour = 9; hour < 24; hour++) {
    const active = assignments.filter(a => isActiveAtHour(a, hour));
    const hasBarista = active.some(a => staffMap[a.staff_id].role === 'Barista');
    const hasGarson = active.some(a => staffMap[a.staff_id].role === 'Garson');
    const hasCash = active.some(a => staffMap[a.staff_id].cash_register_auth === 1);

    // Determine shift type based on hour
    let shiftType, startTime, endTime;
    if (hour < 13) {
      shiftType = 'Sabah'; startTime = '09:00'; endTime = '17:00';
    } else if (hour < 17) {
      shiftType = 'Araci'; startTime = '13:00'; endTime = '21:00';
    } else {
      shiftType = 'Aksam'; startTime = '16:00'; endTime = '00:00';
    }

    const addStaff = (role, needCash) => {
      let candidates = availableStaff.filter(s => {
        if (usedIds.has(s.id)) return false;
        if (role && s.role !== role) return false;
        if (needCash && !s.cash_register_auth) return false;
        return true;
      });
      // If no unused staff, allow re-using but with a different shift
      if (candidates.length === 0 && role) {
        candidates = availableStaff.filter(s => s.role === role && !assignments.some(a => a.staff_id === s.id && a.shift_type === shiftType));
      }
      if (candidates.length > 0) {
        const pick = candidates[0];
        usedIds.add(pick.id);
        assignments.push({
          staff_id: pick.id,
          shift_type: shiftType,
          start_time: startTime,
          end_time: endTime,
          consecutive_day: consecutiveDays[pick.id] || 1
        });
      }
    };

    if (!hasBarista) addStaff('Barista', false);
    if (!hasGarson) addStaff('Garson', false);
    if (!hasCash) addStaff(null, true);
  }

  return assignments;
}

module.exports = {
  generateShiftOptions,
  calculateConsecutiveDays,
  getStaffingConfig,
  validateCoverage
};
