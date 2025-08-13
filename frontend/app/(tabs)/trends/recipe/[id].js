// app/tabs/trends/recipe/[id].js
import { apiGet } from "@lib/api"; // if no alias: ../../../../lib/api
import { isDrinkSaved, upsertSavedDrink } from "@lib/storage"; // or ../../../../lib/storage
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable, SafeAreaView,
  StyleSheet, Text, View
} from "react-native";

export default function IBARecipeDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [item, setItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      // generous timeout on detail too, minimal retries
      const data = await apiGet(`/api/iba/cocktails/${id}`, { timeout: 30000, retries: 1 });
      setItem(data);
      setSaved(await isDrinkSaved(data.id));
    } catch (e) {
      setError(e?.message || "Failed to load recipe.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onSave = useCallback(async () => {
    if (!item) return;
    setSaving(true);
    try {
      await upsertSavedDrink({
        id: item.id,
        name: item.name,
        category: item.baseSpirit || "Cocktail",
        source: "IBA",
        imageUrl: item.imageUrl,
        ingredients: item.ingredients,
        steps: item.steps?.join("\n"),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [item]);

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.err}>{error}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <Pressable onPress={load} style={styles.btn}><Text style={styles.btnTxt}>Retry</Text></Pressable>
          <Pressable onPress={() => router.back()} style={[styles.btn, { backgroundColor: "#444" }]}><Text style={styles.btnTxt}>Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#666" }}>Loading recipe…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
        <Text style={{ fontWeight: "800" }}>‹ Back</Text>
      </Pressable>

      {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.hero} />}

      <View style={{ padding: 16 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.baseSpirit || "—"} {item.tags?.length ? `• ${item.tags.join(", ")}` : ""}
        </Text>

        <Text style={styles.section}>Ingredients</Text>
        <FlatList
          data={item.ingredients}
          keyExtractor={(s, i) => String(i)}
          renderItem={({ item }) => <Text style={styles.li}>• {item}</Text>}
        />

        {item.steps?.length ? (
          <>
            <Text style={styles.section}>Preparation</Text>
            {item.steps.map((s, i) => (
              <Text key={i} style={{ marginBottom: 6 }}>{s}</Text>
            ))}
          </>
        ) : null}

        <Pressable
          onPress={onSave}
          disabled={saving || saved}
          style={[styles.saveBtn, saved && { backgroundColor: "#3cba54" }]}
        >
          <Text style={styles.saveTxt}>{saved ? "Saved ✓" : saving ? "Saving…" : "Save Drink"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center:{ flex:1, alignItems:"center", justifyContent:"center", padding:16 },
  hero:{ width:"100%", height:260, backgroundColor:"#eee" },
  title:{ fontSize:22, fontWeight:"900", marginTop:8 },
  meta:{ color:"#666", marginBottom:10 },
  section:{ fontSize:16, fontWeight:"900", marginTop:12, marginBottom:6 },
  li:{ marginBottom:4 },
  saveBtn:{ marginTop:16, backgroundColor:"#111", borderRadius:10, paddingVertical:12, alignItems:"center", paddingHorizontal:16 },
  saveTxt:{ color:"#fff", fontWeight:"800" },
  btn:{ backgroundColor:"#111", borderRadius:10, paddingVertical:10, paddingHorizontal:14 },
  btnTxt:{ color:"#fff", fontWeight:"800" },
  err:{ color:"#b3261e", textAlign:"center", paddingHorizontal:16 },
});
