// server.js
// BevTrends API — Near Me (mock) + IBA recipes (safe by default)
// Run: node server.js
// NOTE: backend/package.json should NOT have "type":"module"

require("dotenv").config();

// ---------- Node18 polyfill (Undici expects global File) ----------
if (typeof globalThis.File === "undefined") {
  const { Blob } = require("buffer");
  class File extends Blob {
    constructor(chunks, name, opts = {}) {
      super(chunks, opts);
      this.name = String(name);
      this.lastModified = opts.lastModified ?? Date.now();
    }
    get [Symbol.toStringTag]() { return "File"; }
  }
  globalThis.File = File;
}
// ------------------------------------------------------------------

const express = require("express");
const cheerio = require("cheerio");
const fs = require("fs/promises");
const path = require("path");

// ---- Optional deps (won't crash if not installed) ----
let cors, helmet, compression, morgan;
try { cors = require("cors"); } catch {}
try { helmet = require("helmet"); } catch {}
try { compression = require("compression"); } catch {}
try { morgan = require("morgan"); } catch {}

const app = express();
app.set("trust proxy", 1);

// ---------- Env flags ----------
const PORT = Number(process.env.PORT) || 10000; // Render injects PORT
const IBA_SAFE = (process.env.IBA_SAFE ?? "1") === "1";
const IBA_REINDEX_KEY = process.env.IBA_REINDEX_KEY || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ---------- Minimal fallbacks if packages are missing ----------
function fallbackSecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  next();
}
function fallbackCors(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

// ---------- Core middleware (use optional when present) ----------
if (cors) app.use(cors({ origin: CORS_ORIGIN })); else app.use(fallbackCors);
app.use(express.json({ limit: "1mb" }));
if (helmet) app.use(helmet({ crossOriginResourcePolicy: false })); else app.use(fallbackSecurityHeaders);
if (compression) app.use(compression());
if (morgan) app.use(morgan("dev"));

// ---------- Data / Cache ----------
const DATA_DIR = path.join(__dirname, "data");
const CACHE_FILE = path.join(DATA_DIR, "iba.json");

// ---------- Near Me (mock) ----------
const mockNearMeTrends = [
  { id:"1", name:"Old Fashioned", type:"Cocktail",
    imageUrl:"https://images.unsplash.com/photo-1542156822-6924d1a71ace?q=80&w=1200&auto=format&fit=crop",
    description:"Classic bourbon, bitters, sugar, orange oils.",
    recipe:["2 oz Bourbon","2 dashes Angostura","1 sugar cube","Orange peel"],
    topBrands:["Woodford Reserve","Buffalo Trace","Four Roses"], sponsoredBrands:["Bulleit Bourbon"],
    tags:["whiskey","stirred","classic"], location:{ city:"Tampa", state:"FL" },
    distanceMiles:1.2, popularityScore:92, priceRange:"$$", venues:["Velvet Lounge","Harbor House"]
  },
  { id:"2", name:"Hazy IPA", type:"Beer",
    imageUrl:"https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=1200&auto=format&fit=crop",
    description:"Juicy, tropical hop notes with soft bitterness.",
    recipe:[], topBrands:["Cigar City","Voodoo Ranger","Trillium"], sponsoredBrands:["Sierra Nevada"],
    tags:["beer","hoppy","juicy"], location:{ city:"St. Petersburg", state:"FL" },
    distanceMiles:4.5, popularityScore:88, priceRange:"$", venues:["Sunset Taproom","Pier Brewhouse"]
  },
  { id:"3", name:"Espresso Martini", type:"Cocktail",
    imageUrl:"https://images.unsplash.com/photo-1617195737496-7e8b5f7a6b66?q=80&w=1200&auto=format&fit=crop",
    description:"Vodka, coffee liqueur, fresh espresso—silky and bold.",
    recipe:["2 oz Vodka","1 oz Coffee Liqueur","1 oz Espresso"],
    topBrands:["Kahlúa","Absolut","Tito's"], sponsoredBrands:[], tags:["coffee","sweet","shaken"],
    location:{ city:"Clearwater", state:"FL" }, distanceMiles:3.1, popularityScore:95, priceRange:"$$", venues:["Roast & Rye","Boardwalk Bar"]
  },
];
function filterNearMe(q) {
  const { maxDistance, type, tag, sort } = q;
  let r = [...mockNearMeTrends];
  if (maxDistance) { const md = +maxDistance; if (!Number.isNaN(md)) r = r.filter(d => d.distanceMiles <= md); }
  if (type) r = r.filter(d => d.type.toLowerCase() === String(type).toLowerCase());
  if (tag) r = r.filter(d => d.tags?.map(t=>t.toLowerCase()).includes(String(tag).toLowerCase()));
  if (sort === "distance") r.sort((a,b)=>a.distanceMiles-b.distanceMiles);
  else if (sort === "popularity") r.sort((a,b)=>b.popularityScore-a.popularityScore);
  return r;
}

// ---------- IBA Scraper (safe by default) ----------
const IBA_INDEX = "https://iba-world.com/cocktails/all-cocktails/";
const BAD_SLUGS = new Set(["the-new-era","the-unforgettables","contemporary-classics","about-us","constitution","board","academy","iba-wcc","news","events","contact"]);
function withTimeout(ms, controller) { return setTimeout(() => controller.abort(), ms); }
async function fetchHTML(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = withTimeout(timeoutMs, controller);
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; BevTrendsBot/1.0)" },
    signal: controller.signal
  });
  clearTimeout(t);
  if (!res.ok) throw new Error(`Fetch ${url} ${res.status}`);
  return await res.text();
}
function linksFromIndex(html) {
  const $ = cheerio.load(html); const urls = new Set();
  $(".elementor-post, .e-loop-item, article").each((_, card) => {
    const a = $(card).find('a[href*="/cocktails/"]').first();
    const href = (a.attr("href") || "").split("?")[0];
    if (!href) return;
    if (!/\/cocktails\/[^/]+\/?$/.test(href)) return;
    const slug = href.replace(/\/$/,"").split("/").pop();
    if (BAD_SLUGS.has(slug)) return;
    urls.add(href);
  });
  if (urls.size < 10) {
    $("main a[href*='/cocktails/']").each((_, a) => {
      const href = ($(a).attr("href")||"").split("?")[0];
      if (/\/cocktails\/[^/]+\/?$/.test(href)) {
        const slug = href.replace(/\/$/,"").split("/").pop();
        if (!BAD_SLUGS.has(slug)) urls.add(href);
      }
    });
  }
  return [...urls];
}
function clean(s=""){ return s.replace(/\s+/g," ").trim(); }
function pickAttr($el, keys){ for (const k of keys){ const v=$el.attr(k); if (v) return v; } return ""; }
async function scrapeDetail(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);
  const name = clean($("h1, .entry-title").first().text());
  if (!name || /^the\s+/i.test(name)) return null;
  const ogImg = $('meta[property="og:image"]').attr("content");
  const postImg = pickAttr($('.wp-block-image img, .entry-content img, figure img').first(),["data-src","data-lazy-src","srcset","src"]);
  let imageUrl = (ogImg || postImg || "").split(" ")[0];

  // Ingredients
  let ingredients = [];
  const hdr = $('h1,h2,h3').filter((_, el)=>/ingredients/i.test($(el).text())).first();
  if (hdr.length) {
    hdr.nextAll("ul,ol").first().find("li").each((_, li)=> { const t = clean($(li).text()); if (t) ingredients.push(t); });
  }
  if (ingredients.length < 2) {
    const main = $("main, article, .entry-content, .elementor-widget-container").first();
    const list = main.find("ul,ol").filter((_, el) => {
      const items = $(el).find("li").map((_, li)=>clean($(li).text())).get();
      const hasMeasures = items.some(x=>/\b(\d+|\d+\/\d+)\s?(oz|cl|ml|dash|barspoon)/i.test(x));
      return items.length >= 2 && hasMeasures;
    }).first();
    if (list.length) ingredients = list.find("li").map((_, li)=>clean($(li).text())).get();
  }
  if (ingredients.length < 2) return null;

  // Steps
  let steps = [];
  const ph = $('h1,h2,h3').filter((_, el)=>/(preparation|method|instructions|how to)/i.test($(el).text())).first();
  if (ph.length) {
    const blk = ph.nextAll("ol,ul,p").first();
    if (blk.is("ol") || blk.is("ul")) steps = blk.find("li").map((_, li)=>clean($(li).text())).get();
    else { const t = clean(blk.text()); if (t) steps = [t]; }
  }
  if (steps.length === 0) {
    const p = $("p").filter((_, el)=>/(shake|stir|build|strain|muddle)/i.test($(el).text())).first();
    if (p.length) steps = [clean(p.text())];
  }

  const detectBase = (s="")=>{
    const t=s.toLowerCase();
    if (t.includes("gin")) return "Gin";
    if (t.includes("vodka")) return "Vodka";
    if (t.includes("tequila")||t.includes("mezcal")) return "Tequila/Mezcal";
    if (t.includes("rum")) return "Rum";
    if (t.includes("whisk")) return "Whisky";
    if (t.includes("brandy")||t.includes("cognac")) return "Brandy";
    return null;
  };
  const baseSpirit = ingredients.map(detectBase).find(Boolean) || null;

  const tags = (()=> {
    const s = ingredients.join(" ").toLowerCase(); const arr=[];
    if (/(lemon|lime|orange|grapefruit|pineapple|strawberry|passion|juice)/.test(s)) arr.push("fruity");
    if (/(vermouth|amaro|campari|angostura|bitters)/.test(s)) arr.push("bitter");
    if (/(syrup|honey|agave|grenadine|liqueur|sugar)/.test(s)) arr.push("sweet");
    if (/(mezcal|islay|smok)/.test(s)) arr.push("smoky");
    if (/(mint|basil|rosemary)/.test(s)) arr.push("herbal");
    const spiritCount = (s.match(/gin|vodka|rum|tequila|whisk|brandy|mezcal/g)||[]).length;
    const juiceCount  = (s.match(/lemon|lime|orange|grapefruit|juice|pineapple/g)||[]).length;
    if (spiritCount && juiceCount===0) arr.push("boozy");
    return arr;
  })();

  const id = url.replace(/\/$/,"").split("/").pop();
  return { id, name, url, imageUrl, ingredients, steps, baseSpirit, tags, source:"IBA" };
}

async function loadCache() { try { return JSON.parse(await fs.readFile(CACHE_FILE, "utf8")); } catch { return null; } }
async function saveCache(items) { await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(CACHE_FILE, JSON.stringify(items, null, 2)); }
async function refreshIBA() {
  if (IBA_SAFE) return MOCK_IBA;
  const indexHTML = await fetchHTML(IBA_INDEX);
  const urls = linksFromIndex(indexHTML);
  const out = [];
  const CHUNK = 5;
  for (let i=0;i<urls.length;i+=CHUNK) {
    const results = await Promise.all(urls.slice(i,i+CHUNK).map(async u => { try { return await scrapeDetail(u); } catch { return null; } }));
    for (const r of results) if (r) out.push(r);
  }
  const seen = new Set(); const dedup=[];
  for (const r of out) { if (!seen.has(r.id)) { seen.add(r.id); dedup.push(r); } }
  await saveCache(dedup);
  return dedup;
}

// ---------- IBA: safe mock ----------
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

// ---------- Helpers ----------
function filterSearch(items, { q, spirit, tags, limit, offset }) {
  let list = items || [];
  const spirits = spirit ? String(spirit).split(",").map(s=>s.toLowerCase()) : [];
  const wanted  = tags ? String(tags).split(",").map(t=>t.toLowerCase()) : [];
  if (q) list = list.filter(c => [c.name, ...(c.ingredients||[])].join(" ").toLowerCase().includes(String(q).toLowerCase()));
  if (spirits.length) list = list.filter(c => c.baseSpirit && spirits.includes(c.baseSpirit.toLowerCase()));
  if (wanted.length)  list = list.filter(c => wanted.every(t => (c.tags||[]).map(x=>x.toLowerCase()).includes(t)));
  const off = Math.max(0, parseInt(offset||0));
  const lim = Math.min(100, parseInt(limit||50));
  return list.slice(off, off+lim);
}
function setNoStore(res) { res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate"); }

// ---------- Routes ----------
app.get("/", (_req, res) => res.json({ ok:true, service:"BevTrends API", safeIBA: IBA_SAFE }));
app.get("/health", (_req,res)=>res.send("ok"));
app.get("/healthz", (_req,res)=>res.send("ok"));

// Near Me (mock)
function handleNearMe(req, res) {
  try { const out = filterNearMe(req.query); setNoStore(res); res.json(out); }
  catch (e) { console.error("Near Me error:", e); res.status(500).json({ error: "Failed to fetch near-me trends" }); }
}
app.get("/trending/near-me", handleNearMe);
app.get("/api/trending/near-me", handleNearMe);

// IBA (primary under /api)
app.get("/api/iba/mock", (_req,res) => res.json(MOCK_IBA));
app.get("/api/iba/stats", async (_req,res) => { const data = await loadCache(); res.json({ cached: !!data, count: data?.length || 0, safe: IBA_SAFE }); });
app.get("/api/iba/reindex", async (req,res) => {
  try {
    if (IBA_REINDEX_KEY) {
      const key = req.query.key || req.header("x-iba-key") || "";
      if (key !== IBA_REINDEX_KEY) return res.status(401).json({ error: "Unauthorized" });
    }
    const data = await refreshIBA(); setNoStore(res); res.json({ count:data.length, safe: IBA_SAFE });
  } catch (e) { console.error("Reindex failed:", e); res.status(500).json({ error:"Reindex failed" }); }
});
app.get("/api/iba/cocktails", async (req,res) => {
  try {
    let data = await loadCache(); if (!data) data = await refreshIBA();
    if (IBA_SAFE && (!data || data.length === 0)) data = MOCK_IBA;
    const out = filterSearch(data, {
      q: req.query.q || req.query.search || "",
      spirit: req.query.spirit || "",
      tags: req.query.tags || "",
      limit: req.query.limit, offset: req.query.offset
    });
    setNoStore(res); res.json(out);
  } catch (e) { console.error("Search failed:", e); res.status(500).json({ error:"Search failed" }); }
});
app.get("/api/iba/cocktails/:id", async (req,res) => {
  try {
    let data = await loadCache(); if (!data) data = await refreshIBA();
    if (IBA_SAFE && (!data || data.length === 0)) data = MOCK_IBA;
    const item = data.find(x => String(x.id) === String(req.params.id));
    if (!item) return res.status(404).json({ error:"Not found" });
    setNoStore(res); res.json(item);
  } catch (e) { console.error("Lookup failed:", e); res.status(500).json({ error:"Lookup failed" }); }
});

// Aliases
app.get("/api/health", (_req,res)=>res.send("ok"));
app.get("/api/healthz", (_req,res)=>res.send("ok"));
app.get("/iba/mock", (_req,res) => res.json(MOCK_IBA));
app.get("/iba/stats", async (_req,res) => { const data = await loadCache(); res.json({ cached: !!data, count: data?.length || 0, safe: IBA_SAFE }); });
app.get("/iba/reindex", async (req,res) => {
  try {
    if (IBA_REINDEX_KEY) {
      const key = req.query.key || req.header("x-iba-key") || "";
      if (key !== IBA_REINDEX_KEY) return res.status(401).json({ error: "Unauthorized" });
    }
    const data = await refreshIBA(); setNoStore(res); res.json({ count:data.length, safe: IBA_SAFE });
  } catch (e) { console.error("Reindex failed:", e); res.status(500).json({ error:"Reindex failed" }); }
});
app.get("/iba/cocktails", async (req,res) => {
  try {
    let data = await loadCache(); if (!data) data = await refreshIBA();
    if (IBA_SAFE && (!data || data.length === 0)) data = MOCK_IBA;
    const out = filterSearch(data, {
      q: req.query.q || req.query.search || "",
      spirit: req.query.spirit || "",
      tags: req.query.tags || "",
      limit: req.query.limit, offset: req.query.offset
    });
    setNoStore(res); res.json(out);
  } catch (e) { console.error("Search failed:", e); res.status(500).json({ error:"Search failed" }); }
});
app.get("/iba/cocktails/:id", async (req,res) => {
  try {
    let data = await loadCache(); if (!data) data = await refreshIBA();
    if (IBA_SAFE && (!data || data.length === 0)) data = MOCK_IBA;
    const item = data.find(x => String(x.id) === String(req.params.id));
    if (!item) return res.status(404).json({ error:"Not found" });
    setNoStore(res); res.json(item);
  } catch (e) { console.error("Lookup failed:", e); res.status(500).json({ error:"Lookup failed" }); }
});

// 🔎 Route inspector (leave in until stable)
app.get("/routes", (_req, res) => {
  const out = [];
  (app._router?.stack || []).forEach((m) => {
    if (m.route?.path) out.push(`${Object.keys(m.route.methods)[0].toUpperCase()} ${m.route.path}`);
  });
  res.json(out);
});

// 404
app.use((req,res)=>res.status(404).json({ error:"Not found" }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- Server ----------
(async () => {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  app.listen(PORT, () => {
    console.log(`BevTrends API listening on :${PORT} (safeIBA=${IBA_SAFE})`);
  });
})();
