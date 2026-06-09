const express = require('express');
const router = express.Router();
const store = require('../../store');

// GET / — list all enquiries, newest first
router.get('/', (req, res) => {
  let enquiries = store.enquiries.list();
  const { status } = req.query;
  if (status) {
    enquiries = enquiries.filter(e => e.status === status);
  }
  res.json(enquiries);
});

// DELETE /:id — remove an enquiry
router.delete('/:id', (req, res) => {
  const deleted = store.enquiries.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// PATCH /:id — update status, admin_note
router.patch('/:id', (req, res) => {
  const { status, admin_note } = req.body;
  const allowed = {};
  if (status !== undefined) allowed.status = status;
  if (admin_note !== undefined) allowed.admin_note = admin_note;

  const updated = store.enquiries.update(req.params.id, allowed);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

module.exports = router;
