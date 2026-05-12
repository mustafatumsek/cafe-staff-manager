const express = require('express');
const router = express.Router();
const staffService = require('../services/staffService');

// GET /api/staff — List all active staff
router.get('/', (req, res) => {
  try {
    const staff = staffService.getAll();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/:id — Get single staff
router.get('/:id', (req, res) => {
  try {
    const staff = staffService.getById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Personel bulunamadı.' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff — Create staff
router.post('/', (req, res) => {
  try {
    const { first_name, last_name, role, cash_register_auth, standard_availability } = req.body;
    if (!first_name || !last_name || !role || !standard_availability) {
      return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    const staff = staffService.create({ first_name, last_name, role, cash_register_auth, standard_availability });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/staff/:id — Update staff
router.put('/:id', (req, res) => {
  try {
    const { first_name, last_name, role, cash_register_auth, standard_availability } = req.body;
    const staff = staffService.update(req.params.id, { first_name, last_name, role, cash_register_auth, standard_availability });
    if (!staff) return res.status(404).json({ error: 'Personel bulunamadı.' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id — Soft-delete staff
router.delete('/:id', (req, res) => {
  try {
    const result = staffService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
