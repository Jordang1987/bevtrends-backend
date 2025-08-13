// app/profile/builder.js
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View
} from "react-native";
// If you use alias:  import { getJSON, setJSON, KEYS } from '@lib/storage';
import { getJSON, KEYS, setJSON } from "../../lib/storage";

/* ---------- Local helpers that wrap your storage ---------- */
async function getRecipes() {
  return (await getJSON(KEYS.recipes, [])) || [];
}
async function saveRecipes(next) {
  await setJSON(KEYS.recipes, Array.isArray(next) ? next : []);
}
async function getMenus() {
  return (await getJSON(KEYS.menus, [])) || [];
}
async function saveMenus(next) {
  await setJSON(KEYS.menus, Array.isArray(next) ? next : []);
}
function calcRecipeCost(rec) {
  const ing = rec?.ingredients || [];
  return ing.reduce((sum, i) => {
    const qty = parseFloat(i.qty) || 0;
    const unitCost = parseFloat(i.cost) || 0;
    const line = unitCost * (qty || 1); // best-effort estimate
    return sum + (isFinite(line) ? line : 0);
  }, 0);
}
async function createMenu(title = "My Menu") {
  const menus = await getMenus();
  const m = {
    id: Date.now().toString(),
    title: String(title || "My Menu"),
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveMenus([m, ...menus]);
  return m;
}
async function addItemToMenu(menuId, recipe) {
  const menus = await getMenus();
  const idx = menus.findIndex(m => String(m.id) === String(menuId));
  if (idx < 0) throw new Error("Menu not found");
  const item = {
    id: `${menuId}:${recipe.id}`,
    recipeId: recipe.id,
    name: recipe.name,
    category: recipe.category,
    price: null,
    addedAt: Date.now(),
  };
  const updated = { ...menus[idx] };
  updated.items = [item, ...(updated.items || [])];
  updated.updatedAt = Date.now();
  const next = [...menus.slice(0, idx), updated, ...menus.slice(idx + 1)];
  await saveMenus(next);
  return updated;
}

/* ---------- UI ---------- */
const CATEGORIES = ["Cocktail", "Beer", "Wine", "Non-Alcoholic", "Coffee/Tea"];
const METHODS = ["Shake", "Stir", "Build", "Blend", "Pour Over Ice"];

export default function Builder() {
  const router = useRouter();

  // tabs: create | recipes | menus
  const [tab, setTab] = useState("create");

  // form state
  const [idEditing, setIdEditing] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cocktail");
  const [method, setMethod] = useState("Shake");
  const [garnish, setGarnish] = useState("");
  const [glassware, setGlassware] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // ingredients
  const [iQty, setIQty] = useState("");
  const [iUnit, setIUnit] = useState("oz");
  const [iItem, setIItem] = useState("");
  const [iCost, setICost] = useState("");
  const [ingredients, setIngredients] = useState([]);

  // steps
  const [stepInput, setStepInput] = useState("");
  const [steps, setSteps] = useState([]);

  // tags
  const [tagsInput, setTagsInput] = useState("");
  const tags = useMemo(
    () => tagsInput.split(",").map(t => t.trim()).filter(Boolean),
    [tagsInput]
  );

  // data
  const [recipes, setRecipes] = useState([]);
  const [menus, setMenus] = useState([]);

  // modal
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [r, m] = await Promise.all([getRecipes(), getMenus()]);
      if (!mounted) return;
      setRecipes(r);
      setMenus(m);
    })();
    return () => { mounted = false; };
  }, []);

  const resetForm = () => {
    setIdEditing(null);
    setName(""); setCategory("Cocktail"); setMethod("Shake");
    setGarnish(""); setGlassware(""); setImageUrl("");
    setIQty(""); setIUnit("oz"); setIItem(""); setICost("");
    setIngredients([]); setStepInput(""); setSteps([]); setTagsInput("");
  };

  const addIngredient = () => {
    const qty = iQty.trim(); const item = iItem.trim();
    if (!item) return;
    setIngredients(prev => [
      ...prev,
      { qty, unit: iUnit, item, notes: "", cost: parseFloat(iCost) || 0 }
    ]);
    setIQty(""); setIUnit("oz"); setIItem(""); setICost("");
  };
  const removeIngredient = (idx) =>
    setIngredients(prev => prev.filter((_, i) => i !== idx));

  const addStep = () => {
    const s = stepInput.trim();
    if (!s) return;
    setSteps(prev => [...prev, s]);
    setStepInput("");
  };
  const removeStep = (idx) =>
    setSteps(prev => prev.filter((_, i) => i !== idx));

  const saveRecipe = async () => {
    if (!name.trim()) return Alert.alert("Name required", "Please add a drink name.");
    const rec = {
      id: idEditing || Date.now().toString(),
      name: name.trim(),
      category,
      method,
      garnish: garnish.trim(),
      glassware: glassware.trim(),
      imageUrl: imageUrl.trim(),
      ingredients,
      steps,
      tags,
      createdAt: idEditing ? undefined : Date.now(),
      updatedAt: Date.now(),
    };

    let next;
    if (idEditing) next = recipes.map(r => r.id === idEditing ? rec : r);
    else next = [rec, ...recipes.filter(r => r.id !== rec.id)];

    setRecipes(next);
    await saveRecipes(next);
    setIdEditing(rec.id);
    Alert.alert("Saved", idEditing ? "Recipe updated." : "Recipe saved.");
    setTab("recipes");
  };

  const startEdit = (r) => {
    setIdEditing(r.id);
    setName(r.name || "");
    setCategory(r.category || "Cocktail");
    setMethod(r.method || "Shake");
    setGarnish(r.garnish || "");
    setGlassware(r.glassware || "");
    setImageUrl(r.imageUrl || "");
    setIngredients(r.ingredients || []);
    setSteps(r.steps || []);
    setTagsInput((r.tags || []).join(", "));
    setTab("create");
  };

  const duplicateRecipe = async (r) => {
    const copy = {
      ...r,
      id: Date.now().toString(),
      name: `${r.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const next = [copy, ...recipes];
    setRecipes(next);
    await saveRecipes(next);
    Alert.alert("Duplicated", "Recipe copied.");
  };

  const deleteRecipe = async (id) => {
    Alert.alert("Delete recipe?", "This removes it locally.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const next = recipes.filter(r => r.id !== id);
          setRecipes(next);
          await saveRecipes(next);
        }
      }
    ]);
  };

  const openAddToMenu = () => setPickerOpen(true);
  const addCurrentToMenu = async (menuId) => {
    // Ensure we have a saved recipe to add
    if (!idEditing) await saveRecipe();
    const latest = await getRecipes();
    const rec = latest.find(r => r.id === (idEditing || latest[0]?.id));
    if (!rec) return;
    await addItemToMenu(String(menuId), rec);
    setMenus(await getMenus());
    Alert.alert("Added", "Recipe added to menu.");
    setPickerOpen(false);
  };
  const createMenuAndAdd = async () => {
    const m = await createMenu("My Menu");
    await addCurrentToMenu(m.id);
  };

  const currentCost = useMemo(() => calcRecipeCost({ ingredients }), [ingredients]);

  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <Text style={styles.recipeMeta}>
          {item.category || "Uncategorized"} • {item.ingredients?.length || 0} ing • ${calcRecipeCost(item).toFixed(2)} est. cost
        </Text>
      </View>
      <Pressable onPress={() => startEdit(item)} style={styles.ghost}><Text style={styles.ghostTxt}>Edit</Text></Pressable>
      <Pressable onPress={() => duplicateRecipe(item)} style={styles.ghost}><Text style={styles.ghostTxt}>Duplicate</Text></Pressable>
      <Pressable onPress={() => deleteRecipe(item.id)} style={styles.danger}><Text style={styles.dangerTxt}>Delete</Text></Pressable>
    </View>
  );

  const renderMenuCard = ({ item }) => (
    <View style={styles.menuRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuMeta}>{item.items?.length || 0} item(s)</Text>
      </View>
      <Pressable onPress={() => router.push(`/profile/menus/${item.id}`)} style={styles.primary}>
        <Text style={styles.primaryTxt}>Open</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>×</Text>
        </Pressable>

        <Text style={styles.title}>Drink/Menu Builder</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {["create","recipes","menus"].map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabActive]}>
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t === "create" ? "Create" : t === "recipes" ? "Recipes" : "Menus"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* CREATE */}
        {tab === "create" && (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.card}>
              <Text style={styles.label}>Drink Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g., Spicy Margarita" style={styles.input} />

              <Text style={styles.label}>Category</Text>
              <View style={styles.pillsRow}>
                {CATEGORIES.map(c => (
                  <Pressable key={c} onPress={() => setCategory(c)} style={[styles.pill, category === c && styles.pillActive]}>
                    <Text style={[styles.pillTxt, category === c && styles.pillTxtActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Method</Text>
              <View style={styles.pillsRow}>
                {METHODS.map(m => (
                  <Pressable key={m} onPress={() => setMethod(m)} style={[styles.pillSm, method === m && styles.pillActive]}>
                    <Text style={[styles.pillTxtSm, method === m && styles.pillTxtActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Glassware</Text>
              <TextInput value={glassware} onChangeText={setGlassware} placeholder="Rocks / Coupe / Highball" style={styles.input} />

              <Text style={styles.label}>Garnish</Text>
              <TextInput value={garnish} onChangeText={setGarnish} placeholder="Lime wheel, Tajín rim" style={styles.input} />

              <Text style={styles.label}>Image URL (optional)</Text>
              <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="https://…" style={styles.input} autoCapitalize="none" />

              <Text style={styles.label}>Ingredients</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TextInput value={iQty} onChangeText={setIQty} placeholder="2" keyboardType="decimal-pad" style={[styles.input, { flex: .4 }]} />
                <TextInput value={iUnit} onChangeText={setIUnit} placeholder="oz" style={[styles.input, { flex: .6 }]} />
                <TextInput value={iItem} onChangeText={setIItem} placeholder="tequila" style={[styles.input, { flex: 1.2 }]} />
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <TextInput value={iCost} onChangeText={setICost} placeholder="unit cost (optional)" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
                <Pressable onPress={addIngredient} style={styles.smallBtn}><Text style={styles.smallBtnTxt}>Add</Text></Pressable>
              </View>

              {ingredients.length > 0 && (
                <View style={styles.ingWrap}>
                  {ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <Text style={styles.ingTxt}>
                        {ing.qty || ""} {ing.unit} {igSafe(ing.item)}
                        {ing.cost ? ` — $${(parseFloat(ing.cost) || 0).toFixed(2)}/unit` : ""}
                      </Text>
                      <Pressable onPress={() => removeIngredient(idx)} style={styles.ghost}>
                        <Text style={styles.ghostTxt}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Text style={styles.costNote}>Estimated cost: ${currentCost.toFixed(2)}</Text>
                </View>
              )}

              <Text style={styles.label}>Steps</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TextInput value={stepInput} onChangeText={setStepInput} placeholder="Shake with ice…" style={[styles.input, { flex: 1 }]} />
                <Pressable onPress={addStep} style={styles.smallBtn}><Text style={styles.smallBtnTxt}>Add</Text></Pressable>
              </View>
              {steps.length > 0 && (
                <View style={styles.stepsWrap}>
                  {steps.map((s, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{idx + 1}.</Text>
                      <Text style={{ flex: 1 }}>{s}</Text>
                      <Pressable onPress={() => removeStep(idx)} style={styles.ghost}>
                        <Text style={styles.ghostTxt}>Del</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput value={tagsInput} onChangeText={setTagsInput} placeholder="spicy, tequila, summer" style={styles.input} autoCapitalize="none" />

              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable onPress={saveRecipe} style={styles.primary}><Text style={styles.primaryTxt}>{idEditing ? "Update Recipe" : "Save Recipe"}</Text></Pressable>
                <Pressable onPress={() => setPickerOpen(true)} style={styles.outline}><Text style={styles.outlineTxt}>Add to Menu</Text></Pressable>
                {idEditing && <Pressable onPress={resetForm} style={styles.ghost}><Text style={styles.ghostTxt}>Cancel Edit</Text></Pressable>}
              </View>
            </View>
          </ScrollView>
        )}

        {/* RECIPES */}
        {tab === "recipes" && (
          <FlatList
            data={recipes}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderRecipeItem}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={<Text style={{ padding: 16, color: "#666" }}>No recipes yet.</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* MENUS */}
        {tab === "menus" && (
          <FlatList
            data={menus}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderMenuCard}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={<Text style={{ padding: 16, color: "#666" }}>No menus yet.</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              <Pressable
                onPress={async () => {
                  const m = await createMenu("My Menu");
                  setMenus(await getMenus());
                  router.push(`/profile/menus/${m.id}`);
                }}
                style={[styles.primary, { margin: 12, alignItems: "center" }]}
              >
                <Text style={styles.primaryTxt}>＋ New Menu</Text>
              </Pressable>
            }
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>

      {/* Add-to-menu modal */}
      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.pickerHead}>
            <Text style={styles.pickerTitle}>Add to Menu</Text>
            <Pressable onPress={() => setPickerOpen(false)} style={styles.ghost}><Text style={styles.ghostTxt}>Close</Text></Pressable>
          </View>
          <FlatList
            data={menus}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <View style={styles.menuRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuMeta}>{item.items?.length || 0} item(s)</Text>
                </View>
                <Pressable onPress={() => addCurrentToMenu(item.id)} style={styles.primary}>
                  <Text style={styles.primaryTxt}>Add</Text>
                </Pressable>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={<Text style={{ padding: 16, color: "#666" }}>No menus yet.</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              <Pressable onPress={createMenuAndAdd} style={[styles.outline, { margin: 12, alignItems: "center" }]}>
                <Text style={styles.outlineTxt}>＋ Create New Menu & Add</Text>
              </Pressable>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* small display safety */
function igSafe(v) { return (v ?? "").toString(); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 12 },
  closeBtn: { paddingTop: 12, paddingBottom: 6, paddingHorizontal: 4 },
  closeTxt: { fontSize: 28, fontWeight: "300", lineHeight: 28 },
  title: { fontSize: 20, fontWeight: "800", paddingVertical: 8 },

  tabs: { flexDirection: "row", gap: 8, backgroundColor: "#f1f1f1", borderRadius: 999, padding: 4, marginBottom: 8 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 999 },
  tabActive: { backgroundColor: "#fff", elevation: 1 },
  tabTxt: { fontWeight: "700", color: "#666" },
  tabTxtActive: { color: "#111" },

  card: { backgroundColor: "#fafafa", padding: 12, borderRadius: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: "#eee" },
  label: { fontWeight: "700", fontSize: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, height: 44, backgroundColor: "#fff" },

  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 2 },
  pill: { backgroundColor: "#eee", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  pillSm: { backgroundColor: "#eee", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  pillActive: { backgroundColor: "#111" },
  pillTxt: { color: "#333", fontWeight: "700" },
  pillTxtSm: { color: "#333", fontWeight: "700", fontSize: 12 },
  pillTxtActive: { color: "#fff" },

  smallBtn: { backgroundColor: "#111", borderRadius: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  smallBtnTxt: { color: "#fff", fontWeight: "700" },

  ingWrap: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 8, gap: 6, backgroundColor: "#fff" },
  ingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ingTxt: { fontSize: 13, fontWeight: "700" },
  costNote: { marginTop: 4, color: "#666", fontSize: 12 },

  stepsWrap: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 8, gap: 6, backgroundColor: "#fff", marginTop: 6 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepNum: { fontWeight: "900", width: 18, textAlign: "right" },

  primary: { backgroundColor: "#111", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  primaryTxt: { color: "#fff", fontWeight: "800" },
  outline: { borderWidth: 1, borderColor: "#111", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  outlineTxt: { color: "#111", fontWeight: "800" },
  ghost: { borderWidth: 1, borderColor: "#ddd", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  ghostTxt: { color: "#111", fontWeight: "800" },
  danger: { backgroundColor: "#fde7e7", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  dangerTxt: { color: "#b3261e", fontWeight: "800" },

  sep: { height: 1, backgroundColor: "#eee", marginLeft: 12 },
  recipeRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  recipeName: { fontWeight: "900" },
  recipeMeta: { fontSize: 12, color: "#666" },

  menuRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  menuTitle: { fontWeight: "900" },
  menuMeta: { fontSize: 12, color: "#666" },

  pickerHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee"
  },
  pickerTitle: { fontSize: 18, fontWeight: "900" },
});
