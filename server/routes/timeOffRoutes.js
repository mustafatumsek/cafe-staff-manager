const express = require('express');
const router = express.Router();
const timeOffService = require('../services/timeOffService');

// GET /api/time-off — List time-offs with optional filters
router.get('/', (req, res) => {
  try {
    const { staffId, month, year, date } = req.query;
    const timeOffs = timeOffService.getAll({ staffId, month, year, date });
    res.json(timeOffs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/time-off — Create time-off
router.post('/', (req, res) => {
  try {
    const { staff_id, date, note } = req.body;
    if (!staff_id || !date) {
      return res.status(400).json({ error: 'Personel ve tarih zorunludur.' });
    }
    const timeOff = timeOffService.create({ staff_id, date, note });
    res.status(201).json(timeOff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/time-off/:id — Delete time-off
router.delete('/:id', (req, res) => {
  try {
    const result = timeOffService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
