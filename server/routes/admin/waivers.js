const express = require('express');
const router  = express.Router();
const store   = require('../../store');

// GET / — list all waivers
router.get('/', (req, res) => {
  let waivers = store.waivers.list();
  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    waivers = waivers.filter(w =>
      (w.first_name && w.first_name.toLowerCase().includes(q)) ||
      (w.last_name  && w.last_name.toLowerCase().includes(q))  ||
      (w.email      && w.email.toLowerCase().includes(q))
    );
  }
  // Return without signature data in list view (it's large)
  res.json(waivers.map(({ signature, ...rest }) => rest));
});

// DELETE / — purge all waivers
router.delete('/', (req, res) => {
  const count = store.waivers.list().length;
  store.waivers.purge();
  res.json({ purged: count });
});

// GET /:id — full waiver including signature
router.get('/:id', (req, res) => {
  const waiver = store.waivers.findById(Number(req.params.id));
  if (!waiver) return res.status(404).json({ error: 'Not found' });
  res.json(waiver);
});

module.exports = router;
