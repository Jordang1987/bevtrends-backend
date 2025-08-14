// server.js — ultra-minimal, no optional deps, no cheerio
require("dotenv").config();

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
app.set("trust proxy", 1);

// Env
const PORT = Number(process.env.PORT) || 10000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Tiny CORS + security headers (no external libs)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));
const setNoStore = (res) =>
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

// Data dir (ok if unused)
const DATA_DIR = path.join(__dirname, "data");

// Mock data
const MOCK_IBA = [
  { id:"negroni", name:"Negroni", url:"https://iba-world.com/cocktails/negroni/",
    imageUrl:"https://images.unsplash.com/photo-1565895405227-31a46b101bb7?q=80&w=1200&auto=format&fit=crop",
    ingredients:["3 cl Gin","3 cl Campari","3 cl Sweet Vermouth","Orange peel"],
    steps:["Stir with ice and strain into an old fashioned glass over a large cube. Express orange peel."],
    baseSpirit:"Gin", tags:["bitter","boozy"], source:"IBA" },
  { id:"margarita", name:"Margarita", url:"https://iba-world.com/cocktails/margarita/",
    imageUrl:"https://images.unsplash.com/photo-1604908176997-43162b9451b5?q=80&w=1200&auto=format&fit=crop",
    ingredients:["5 cl Tequila","2 cl Triple Sec","2 cl Lime juice","Salt rim (optional)"],
    steps:["Shake all ingredients with ice and strain into a chilled glass."],
    baseSpirit:"Tequila/Mezcal", tags:["citrus","fruity"], source:"IBA" }
];
const mockNearMeTrends = [
  { id:"1", name:"Old Fashioned", type:"Cocktail",
    imageUrl:"https://images.unsplash.com/photo-1542156822-6924d1a71ace?q=80&w=1200&auto=format&fit=crop",
    description:"Classic bourbon, bitters, sugar, orange oils.",
    recipe:["2 oz Bourbon","2 dashes Angostura","1 sugar cube","Orange peel"],
    topBrands:["Woodford Reserve","Buffalo Trace","Four Roses"], sponsoredBrands:["Bulleit Bourbon"],
    tags:["whiskey","stirred","classic"], location:{ city:"Tampa", state:"FL" },
    distanceMiles:1.2, popularityScore:92, priceRange:"$$", venues:["Velvet Lounge","Harbor House"] },
  { id:"2", name:"Hazy IPA", type:"Beer",
    imageUrl:"https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=1200&auto=format&fit=crop",
    description:"Juicy, tropical hop notes with soft bitterness.",
    recipe:[], topBrands:["Cigar City","Voodoo Ranger","Trillium"], sponsoredBrands:["Sierra Nevada"],
    tags:["beer","hoppy","juicy"], location:{ city:"St. Petersburg", state:"FL" },
    distanceMiles:4.5, popularityScore:88, priceRange:"$", venues:["Sunset Taproom","Pier Brewhouse"] },
  { id:"3", name:"Espresso Martini", type:"Cocktail",
    imageUrl:"https://images.unsplash.com/photo-1617195737496-7e8b5f7a6b66?q=80&w=1200&auto=format&fit=crop",
    description:"Vodka, coffee liqueur, fresh espresso—silky and bold.",
    recipe:["2 oz Vodka","1 oz Coffee Liqueur","1 oz Espresso"],
    topBrands:["Kahlúa","Absolut","Tito's"], sponsoredBrands:[], tags:["coffee","sweet","shaken"],
    location:{ city:"Clearwater", state:"FL" }, distanceMiles:3.1, popularityScore:95, priceRange:"$$", venues:["Roast & Rye","Boardwalk Bar"] }
];
const filterNearMe = (q) => {
  const { maxDistance, type, tag, sort } = q;
  let r = [...mockNearMeTrends];
  if (maxDistance) { const md = +maxDistance; if (!Number.isNaN(md)) r = r.filter(d => d.distanceMiles <= md); }
  if (type) r = r.filter(d => d.type.toLowerCase() === String(type).toLowerCase());
  if (tag) r = r.filter(d => d.tags?.map(t=>t.toLowerCase()).includes(String(tag).toLowerCase()));
  if (sort === "distance") r.sort((a,b)=>a.distanceMiles-b.distanceMiles);
  else if (sort === "popularity") r.sort((a,b)=>b.popularityScore-a.popularityScore);
  return r;
};

// Routes
app.get("/", (_req, res) => res.json({ ok:true, service:"BevTrends API", mode:"mock-only" }));
app.get("/health", (_req,res)=>res.send("ok"));
app.get("/trending/near-me", (req, res) => { setNoStore(res); res.json(filterNearMe(req.query)); });
app.get("/api/iba/mock", (_req,res) => res.json(MOCK_IBA));
app.get("/api/iba/cocktails", (req, res) => {
  const q = String(req.query.q || req.query.search || "").toLowerCase();
  const spirit = String(req.query.spirit || "").toLowerCase();
  const tags = String(req.query.tags || "").toLowerCase().split(",").filter(Boolean);
  let list = [...MOCK_IBA];
  if (q) list = list.filter(c => [c.name, ...(c.ingredients||[])].join(" ").toLowerCase().includes(q));
  if (spirit) list = list.filter(c => c.baseSpirit && c.baseSpirit.toLowerCase().includes(spirit));
  if (tags.length) list = list.filter(c => tags.every(t => (c.tags||[]).map(x=>x.toLowerCase()).includes(t)));
  setNoStore(res); res.json(list);
});
app.get("/api/iba/cocktails/:id", (req, res) => {
  const item = MOCK_IBA.find(x => String(x.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: "Not found" });
  setNoStore(res); res.json(item);
});

// 404 + error handler
app.use((req,res)=>res.status(404).json({ error:"Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => { console.error("Unhandled error:", err); res.status(500).json({ error: "Internal server error" }); });

// Server
(async () => {
  try { await fs.mkdir(path.join(__dirname, "data"), { recursive: true }); } catch {}
  app.listen(PORT, () => console.log(`BevTrends API listening on :${PORT}`));
})();
