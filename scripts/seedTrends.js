const db = require('../utils/firestore');

async function seed() {
  // Near Me
  await db.collection('trending_near_me').doc('old-fashioned').set({
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
  });

  // Journal
  await db.collection('trending_journal').doc('mezcal-rising').set({
    title: "Mezcal Is the Spirit of the Summer",
    source: "PunchDrink",
    url: "https://punchdrink.com/article/mezcal-trend-2025/",
    summary: "Mezcal is popping up on menus nationwide...",
    imageUrl: "https://cdn.bevtrends.com/journal/mezcal.jpg",
    relatedDrinks: ["mezcal-negroni", "mezcal-margarita"],
    publishedDate: "2025-08-01"
  });

  // Tastemakers
  await db.collection('trending_tastemakers').doc('death-and-co-old-fashioned').set({
    barName: "Death & Co NYC",
    drinkName: "Signature Old Fashioned",
    location: "New York, NY",
    imageUrl: "https://cdn.bevtrends.com/tastemakers/deathandco-oldfashioned.jpg",
    ingredients: ["Bourbon", "Bitters", "Sugar", "Orange Peel"],
    recipes: [{ name: "House Old Fashioned", instructions: "Stir over ice, strain into glass, garnish with orange twist." }],
    popularBrands: [],
    sponsoredBrands: []
  });

  // Sponsored
  await db.collection('sponsored_brands').doc('angels-envy').set({
    name: "Angel's Envy",
    imageUrl: "https://cdn.bevtrends.com/brands/angelsenvy.jpg",
    dealUrl: "https://www.angelsenvy.com/",
    priority: 1
  });

  console.log("✅ Firestore seeded with initial trend data");
  process.exit();
}

seed();
