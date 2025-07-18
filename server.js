const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route for Render
app.get('/', (req, res) => {
  res.send('OK');
});

// Mock trending drinks data
const mockTrendingData = [
  { id: 1, name: 'Old Fashioned', type: 'Cocktail', popularity: 95 },
  { id: 2, name: 'Espresso Martini', type: 'Cocktail', popularity: 91 },
  { id: 3, name: 'Aperol Spritz', type: 'Aperitif', popularity: 88 },
  { id: 4, name: 'Negroni', type: 'Cocktail', popularity: 85 },
  { id: 5, name: 'Margarita', type: 'Cocktail', popularity: 83 }
];

// API route
app.get('/trending', (req, res) => {
  res.json(mockTrendingData);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
