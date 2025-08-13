// routes/iba.js
const express = require('express');
const router = express.Router();

// TEMP sample data – replace with your source later
const COCKTAILS = [
  {
    id: 'negroni',
    name: 'Negroni',
    baseSpirit: 'Gin',
    tags: ['bitter','classic','aperitivo'],
    imageUrl: null,
    ingredients: ['1 oz Gin','1 oz Campari','1 oz Sweet Vermouth'],
    steps: ['Stir with ice','Strain into rocks w/ large cube','Orange twist']
  },
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    baseSpirit: 'Whisky',
    tags: ['boozy','classic'],
    imageUrl: null,
    ingredients: ['2 oz Bourbon','1 sugar cube','2 dashes Angostura'],
    steps: ['Muddle sugar + bitters','Add whiskey + ice','Stir, orange peel']
  },
];

function matches(item, q) {
  const hay = [
    item.name, item.baseSpirit,
    ...(item.tags || []), ...(item.ingredients || [])
  ].join(' ').toLowerCase();
  return hay.includes(q);
}

// GET /api/iba/cocktails?search=...
router.get('/cocktails', (req, res) => {
  const q = (req.query.search || '').toString().trim().toLowerCase();
  if (!q) return res.json(COCKTAILS);
  return res.json(COCKTAILS.filter(c => matches(c, q)));
});

// GET /api/iba/cocktails/:id
router.get('/cocktails/:id', (req, res) => {
  const c = COCKTAILS.find(x => String(x.id) === String(req.params.id));
  if (!c) return res.status(404).json({ error: 'Not found' });
  return res.json(c);
});

module.exports = router;
