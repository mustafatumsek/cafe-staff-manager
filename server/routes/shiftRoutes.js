const express = require('express');
const router = express.Router();
const shiftService = require('../services/shiftService');

// POST /api/shifts/generate — Generate 3 shift options for a date
router.post('/generate', (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Tarih zorunludur.' });
    const options = shiftService.generate(date);
    res.json(options);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/shifts/options?date= — Get options for a date
router.get('/options', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Tarih parametresi gerekli.' });
    const options = shiftService.getOptionsForDate(date);
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/select/:optionId — Select an option
router.post('/select/:optionId', (req, res) => {
  try {
    const result = shiftService.selectOption(req.params.optionId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/shifts/calendar?year=&month= — Monthly calendar data
router.get('/calendar', (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ error: 'Yıl ve ay parametreleri gerekli.' });
    const calendar = shiftService.getCalendarData(year, month);
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shifts/consecutive/:staffId — Get consecutive day info
router.get('/consecutive/:staffId', (req, res) => {
  try {
    const { date } = req.query;
    const count = shiftService.getConsecutiveInfo(req.params.staffId, date);
    res.json({ staffId: req.params.staffId, consecutiveDays: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shifts/config — Get staffing config
router.get('/config', (req, res) => {
  try {
    res.json(shiftService.getConfig());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shifts/config — Update staffing config
router.put('/config', (req, res) => {
  try {
    const { day_type, role, min_count, target_count } = req.body;
    const config = shiftService.updateConfig(day_type, role, min_count, target_count);
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
