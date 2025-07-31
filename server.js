const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MOCK TRENDING DRINKS DATA
const mockDrinks = [
  {
    id: '1',
    name: 'Spicy Margarita',
    tags: ['Spicy', 'Tequila', 'Citrus'],
    location: { barName: 'Velvet Lounge', city: 'Tampa', distance: 2.1 },
    imageUrl: 'https://picsum.photos/seed/spicy-marg/800/600',
    topBrands: ['Casamigos', 'Don Julio', 'Espolòn'],
    sponsoredBrands: ['El Jimador'],
    recipes: [
      '2 oz Tequila',
      '1 oz Lime Juice',
      '0.75 oz Triple Sec',
      '2 slices Jalapeño',
      'Salt Rim & Lime Garnish',
    ],
  },
  {
    id: '2',
    name: 'Hazy IPA',
    tags: ['Hazy', 'Citra Hops', 'Local'],
    location: { barName: 'Hop City', city: 'Tampa', distance: 5.3 },
    imageUrl: 'https://picsum.photos/seed/hazy-ipa/800/600',
    topBrands: ['Cigar City Jai Alai', 'Trillium', 'Tree House'],
    sponsoredBrands: ['Goose Island Hazy'],
    recipes: ['N/A - Beer'],
  },
  {
    id: '3',
    name: 'Old Fashioned',
    tags: ['Bourbon', 'Classic', 'Orange Peel'],
    location: { barName: 'Barrel & Rye', city: 'Tampa', distance: 3.4 },
    imageUrl: 'https://picsum.photos/seed/old-fashioned/800/600',
    topBrands: ['Buffalo Trace', 'Woodford Reserve', 'Bulleit'],
    sponsoredBrands: ['Maker’s Mark'],
    recipes: [
      '2 oz Bourbon',
      '1 sugar cube',
      '2 dashes Angostura bitters',
      'Orange twist garnish',
    ],
  },
];

// ROUTES
const trendsRoutes = require('./routes/trends');
const postRoutes = require('./routes/posts');

app.use('/trending', trendsRoutes);
app.use('/posts', postRoutes);

// BASIC GET ROUTE FOR ROOT
app.get('/', (req, res) => {
  res.send('BevTrends Backend is Running 🚀');
});

// GET ALL TRENDING DRINKS
app.get('/trending/near-me', (req, res) => {
  res.json(mockDrinks);
});

// GET DRINK BY ID
app.get('/trending/:id', (req, res) => {
  const drink = mockDrinks.find((d) => d.id === req.params.id);ds
  if (drink) {
    res.json(drink);
  } else {
    res.status(404).json({ error: 'Drink not found' });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
