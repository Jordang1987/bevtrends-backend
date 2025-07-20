const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Sample mock data
const mockDrinks = [
  {
    id: '1',
    name: 'Spicy Margarita',
    tags: ['Spicy', 'Tequila', 'Citrus'],
    location: { barName: 'Velvet Lounge', city: 'Tampa', distance: 2.1 },
    imageUrl: 'https://picsum.photos/seed/spicy-marg/800/600',
  },
  {
    id: '2',
    name: 'Hazy IPA',
    tags: ['Hazy', 'Citra Hops', 'Local'],
    location: { barName: 'Hop City', city: 'Tampa', distance: 5.3 },
    imageUrl: 'https://picsum.photos/seed/hazy-ipa/800/600',
  },
  {
    id: '3',
    name: 'Old Fashioned',
    tags: ['Bourbon', 'Classic', 'Orange Peel'],
    location: { barName: 'Barrel & Rye', city: 'Tampa', distance: 3.4 },
    imageUrl: 'https://picsum.photos/seed/old-fashioned/800/600',
  },
];

// ✅ Route for Near Me trending drinks
app.get('/trending/near-me', (req, res) => {
  res.json(mockDrinks);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
