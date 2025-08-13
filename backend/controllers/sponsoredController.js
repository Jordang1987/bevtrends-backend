const db = require('../utils/firestore');

const mockSponsored = [
  {
    id: "angels-envy",
    name: "Angel's Envy",
    imageUrl: "https://cdn.bevtrends.com/brands/angelsenvy.jpg",
    dealUrl: "https://www.angelsenvy.com/",
    priority: 1
  }
];

async function fetchOrSeed(collectionName, mockData) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`⚠️ No data in ${collectionName} — seeding mock data...`);
    for (const item of mockData) {
      await db.collection(collectionName).doc(item.id).set(item);
    }
    return mockData;
  }

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

exports.getSponsoredBrands = async (req, res) => {
  try {
    const data = await fetchOrSeed('sponsored_brands', mockSponsored);
    res.json(data);
  } catch (err) {
    console.error('Error fetching sponsored brands:', err);
    res.status(500).json({ error: 'Failed to fetch sponsored brands' });
  }
};
