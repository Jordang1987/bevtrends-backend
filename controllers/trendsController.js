const db = require('../utils/firestore');

// 🔹 Default mock data
const mockNearMe = [
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    type: "cocktail",
    imageUrl: "https://cdn.bevtrends.com/images/old-fashioned.jpg",
    popularityScore: 87,
    locationData: { city: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572, radiusMiles: 10 },
    ingredients: ["Bourbon", "Sugar", "Bitters", "Orange Peel"],
    recipes: [
      { name: "Classic Old Fashioned", instructions: "Muddle sugar and bitters, add whiskey, stir over ice, garnish with orange peel." }
    ],
    popularBrands: [
      { name: "Woodford Reserve", mentions: 128, imageUrl: "https://cdn.bevtrends.com/brands/woodford.jpg" }
    ],
    sponsoredBrands: [
      { name: "Angel's Envy", dealUrl: "https://www.angelsenvy.com/", imageUrl: "https://cdn.bevtrends.com/brands/angelsenvy.jpg" }
    ],
    lastUpdated: new Date().toISOString()
  }
];

const mockJournal = [
  {
    id: "mezcal-rising",
    title: "Mezcal Is the Spirit of the Summer",
    source: "PunchDrink",
    url: "https://punchdrink.com/article/mezcal-trend-2025/",
    summary: "Mezcal is popping up on menus nationwide...",
    imageUrl: "https://cdn.bevtrends.com/journal/mezcal.jpg",
    relatedDrinks: ["mezcal-negroni", "mezcal-margarita"],
    publishedDate: "2025-08-01"
  }
];

const mockTastemakers = [
  {
    id: "death-and-co-old-fashioned",
    barName: "Death & Co NYC",
    drinkName: "Signature Old Fashioned",
    location: "New York, NY",
    imageUrl: "https://cdn.bevtrends.com/tastemakers/deathandco-oldfashioned.jpg",
    ingredients: ["Bourbon", "Bitters", "Sugar", "Orange Peel"],
    recipes: [{ name: "House Old Fashioned", instructions: "Stir over ice, strain into glass, garnish with orange twist." }],
    popularBrands: [],
    sponsoredBrands: []
  }
];

// 🔹 Helper: fetch or seed
async function fetchOrSeed(collectionName, mockData) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`⚠️ No data in ${collectionName} — seeding mock data...`);
    for (const item of mockData) {
      await db.collection(collectionName).doc(item.id || item.title.toLowerCase().replace(/\s+/g, '-')).set(item);
    }
    return mockData;
  }

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Controllers
exports.getNearMeTrends = async (req, res) => {
  try {
    const data = await fetchOrSeed('trending_near_me', mockNearMe);
    res.json(data);
  } catch (err) {
    console.error('Error fetching Near Me trends:', err);
    res.status(500).json({ error: 'Failed to fetch Near Me trends' });
  }
};

exports.getJournalTrends = async (req, res) => {
  try {
    const data = await fetchOrSeed('trending_journal', mockJournal);
    res.json(data);
  } catch (err) {
    console.error('Error fetching Journal trends:', err);
    res.status(500).json({ error: 'Failed to fetch Journal trends' });
  }
};

exports.getTastemakerTrends = async (req, res) => {
  try {
    const data = await fetchOrSeed('trending_tastemakers', mockTastemakers);
    res.json(data);
  } catch (err) {
    console.error('Error fetching Tastemaker trends:', err);
    res.status(500).json({ error: 'Failed to fetch Tastemaker trends' });
  }
};
