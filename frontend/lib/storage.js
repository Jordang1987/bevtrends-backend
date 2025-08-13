import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  savedDrinks: "saved_drinks_v2",
  bookmarks: "bookmarks_v1",
  recipes: "recipes_v1",
  menus: "menus_v1",
};

// --- core helpers ---
export async function getJSON(key, fallback = []) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export async function setJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
async function upsertById(key, item) {
  const arr = await getJSON(key, []);
  const idx = arr.findIndex((x) => String(x.id) === String(item.id));
  if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
  else arr.unshift(item);
  await setJSON(key, arr);
  return arr;
}

// --- Saved Drinks (IBA/Trends/User) ---
export async function upsertSavedDrink(drink) {
  const normalized = {
    id: String(drink.id),
    name: drink.name,
    category: drink.category || "Cocktail",
    source: drink.source || "User",
    imageUrl: drink.imageUrl || null,
    ingredients: drink.ingredients || [],
    steps: drink.steps || "",
    savedAt: Date.now(),
  };
  return upsertById(KEYS.savedDrinks, normalized);
}
export async function isDrinkSaved(id) {
  const arr = await getJSON(KEYS.savedDrinks, []);
  return arr.some((x) => String(x.id) === String(id));
}
export async function removeSavedDrink(id) {
  const arr = await getJSON(KEYS.savedDrinks, []);
  const next = arr.filter((x) => String(x.id) !== String(id));
  await setJSON(KEYS.savedDrinks, next);
  return next;
}

// --- Favorites / Bookmarks (feed posts) ---
export async function toggleBookmark(post) {
  const arr = await getJSON(KEYS.bookmarks, []);
  const idx = arr.findIndex((x) => String(x.id) === String(post.id));
  let next, now;
  if (idx >= 0) {
    next = arr.filter((_, i) => i !== idx);
    now = false;
  } else {
    next = [{ ...post, bookmarkedAt: Date.now() }, ...arr];
    now = true;
  }
  await setJSON(KEYS.bookmarks, next);
  return now;
}
export async function isBookmarked(id) {
  const arr = await getJSON(KEYS.bookmarks, []);
  return arr.some((x) => String(x.id) === String(id));
}
