// routes/trends.js
const express = require("express");
const router = express.Router();

router.get("/near-me", (req, res) => {
  const mockNearMeTrends = [
    {
      id: "1",
      name: "Old Fashioned",
      type: "Cocktail",
      imageUrl: "https://images.unsplash.com/photo-1589182337354.png",
      description: "Classic bourbon-based cocktail with bitters and sugar.",
      recipe: [
        "2 oz Bourbon",
        "2 dashes Angostura bitters",
        "1 sugar cube",
        "Orange twist"
      ],
      topBrands: ["Woodford Reserve", "Buffalo Trace", "Four Roses"],
      sponsoredBrands: ["Bulleit Bourbon"],
      location: "Tampa, FL",
      distance: 1.2
    },
    {
      id: "2",
      name: "Hazy IPA",
      type: "Beer",
      imageUrl: "https://images.unsplash.com/photo-1541557435984.png",
      description: "Juicy, hop-forward IPA with tropical fruit notes.",
      recipe: [],
      topBrands: ["Cigar City Brewing", "New Belgium Voodoo Ranger"],
      sponsoredBrands: ["Sierra Nevada"],
      location: "St. Petersburg, FL",
      distance: 4.5
    },
    {
      id: "3",
      name: "Espresso Martini",
      type: "Cocktail",
      imageUrl: "https://images.unsplash.com/photo-162154287.png",
      description: "Bold coffee cocktail with vodka and coffee liqueur.",
      recipe: [
        "2 oz Vodka",
        "1 oz Coffee Liqueur",
        "1 oz Fresh espresso"
      ],
      topBrands: ["Kahlúa", "Tito's Handmade Vodka"],
      sponsoredBrands: [],
      location: "Clearwater, FL",
      distance: 3.1
    }
  ];

  res.json(mockNearMeTrends);
});

module.exports = router;
