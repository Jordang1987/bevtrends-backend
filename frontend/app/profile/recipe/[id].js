// app/profile/recipe/[id].js
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { KEYS, getJSON, setJSON } from "../../../lib/storage";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await getJSON(KEYS.savedDrinks);
      const found = saved.find((r) => String(r.id) === String(id));
      setRecipe(found || null);
    })();
  }, [id]);

  const addToMenus = async () => {
    const menus = await getJSON(KEYS.menus);
    const next = [{ id: Date.now().toString(), title: `Menu ${menus.length + 1}`, items:[recipe], createdAt: Date.now() }, ...menus];
    await setJSON(KEYS.menus, next);
    Alert.alert("Added", "This recipe was added to My Menus.");
  };

  if (!recipe) return <View style={styles.center}><Text>Recipe not found.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding:16 }}>
      {!!recipe.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={styles.hero} />}
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.meta}>{recipe.category || "Cocktail"} • {recipe.source || "User"}</Text>

      <Text style={styles.section}>Ingredients</Text>
      {recipe.ingredients?.length ? recipe.ingredients.map((i, idx) => (
        <Text key={idx} style={styles.li}>• {i}</Text>
      )) : <Text style={styles.dim}>No ingredients saved.</Text>}

      <Text style={styles.section}>Steps</Text>
      <Text style={{ lineHeight:20 }}>{recipe.steps || "—"}</Text>

      <Pressable style={styles.cta} onPress={addToMenus}>
        <Text style={styles.ctaText}>Add to My Menus</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  center:{ flex:1, alignItems:"center", justifyContent:"center" },
  hero:{ width:"100%", height:200, borderRadius:12, marginBottom:12, backgroundColor:"#eee" },
  title:{ fontSize:22, fontWeight:"900" },
  meta:{ color:"#666", marginBottom:12 },
  section:{ marginTop:10, fontWeight:"900" },
  li:{ marginTop:6 },
  dim:{ color:"#666", marginTop:6 },
  cta:{ marginTop:18, backgroundColor:"#111", paddingVertical:12, borderRadius:10, alignItems:"center" },
  ctaText:{ color:"#fff", fontWeight:"800" }
});
