// bevtrends-backend/controllers/trendsController.js
const getTrendingDrinks = (req, res) => {
  const data = [
    { name: 'Old Fashioned', mentions: 42, location: 'Tampa' },
    { name: 'Espresso Martini', mentions: 33, location: 'Miami' },
    { name: 'Negroni', mentions: 18, location: 'St. Pete' },
  ];

  res.json(data);
};

module.exports = { getTrendingDrinks };
