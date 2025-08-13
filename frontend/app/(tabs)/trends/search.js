import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable, SafeAreaView,
  StyleSheet, Text, TextInput, View
} from "react-native";

const API = (() => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  try { return new URL(raw).origin; } catch { return raw.replace(/\/+$/, ""); }
})();
const SPIRITS = ["Gin","Vodka","Rum","Tequila/Mezcal","Whisky","Brandy"];
const TAGS = ["boozy","fruity","bitter","sweet","smoky","herbal"];

async function fetchJSON(url, { timeout = 12000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    console.log("FETCH →", url);
    res = await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0,160)}`);
  const looksJson = /^\s*[\[{]/.test(raw);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (looksJson || ct.includes("application/json")) {
    try { return JSON.parse(raw); } catch (e) { throw new Error(`Bad JSON: ${e.message}. Body: ${raw.slice(0,160)}`); }
  }
  throw new Error(`Expected JSON. Got: ${raw.slice(0,160)}`);
}

export default function RecipeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [spirit, setSpirit] = useState(null);
  const [tagSet, setTagSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const fetchSearch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!API) throw new Error("EXPO_PUBLIC_API_URL not set");
      const u = new URL(`${API}/api/iba/cocktails`);
      if (q) u.searchParams.set("q", q);
      if (spirit) u.searchParams.set("spirit", spirit);
      if (tagSet.size) u.searchParams.set("tags", [...tagSet].join(","));
      const data = await fetchJSON(u.toString());
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(e.message.includes("AbortError") ? "Request timed out." : e.message);
    } finally { setLoading(false); }
  }, [q, spirit, tagSet]);

  useEffect(() => { fetchSearch(); }, []); // initial load

  const toggleTag = (t) => {
    const next = new Set(tagSet);
    next.has(t) ? next.delete(t) : next.add(t);
    setTagSet(next);
  };

  const wakeServer = async () => {
    if (!API) return;
    try { await fetchJSON(`${API}/api/iba/reindex`, { timeout: 15000 }); }
    catch {}
    fetchSearch();
  };

  const renderItem = ({ item }) => (
    <Pressable style={styles.card} onPress={() => router.push(`/trends/recipe/${item.id}`)}>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={{ flex:1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.baseSpirit || "—"} {item.tags?.length ? `• ${item.tags.join(", ")}` : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#fff" }}>
      <View style={styles.row}>
        <TextInput
          value={q} onChangeText={setQ} placeholder="Search cocktails, ingredients…"
          style={styles.input} returnKeyType="search" onSubmitEditing={fetchSearch}
        />
        <Pressable onPress={fetchSearch} style={styles.searchBtn}>
          <Text style={styles.searchTxt}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.pills}>
        {SPIRITS.map(s => (
          <Pressable key={s} onPress={() => setSpirit(spirit === s ? null : s)}
            style={[styles.pill, spirit === s && styles.pillActive]}>
            <Text style={[styles.pillTxt, spirit === s && styles.pillTxtActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.pills, { marginTop: 6 }]}>
        {TAGS.map(t => (
          <Pressable key={t} onPress={() => toggleTag(t)}
            style={[styles.pillSm, tagSet.has(t) && styles.pillActive]}>
            <Text style={[styles.pillTxtSm, tagSet.has(t) && styles.pillTxtActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ paddingHorizontal:12, color:"#888", fontSize:12 }}>
        API: {API || "not set"}
      </Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color:"#b3261e", textAlign:"center", paddingHorizontal:16 }}>{error}</Text>
          <Pressable onPress={fetchSearch} style={[styles.searchBtn, { marginTop:12 }]}>
            <Text style={styles.searchTxt}>Retry</Text>
          </Pressable>
          <Pressable onPress={wakeServer} style={[styles.outlineBtn, { marginTop:8 }]}>
            <Text style={styles.outlineTxt}>Wake API</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row:{ flexDirection:"row", gap:8, padding:12 },
  input:{ flex:1, height:44, borderRadius:10, borderWidth:1, borderColor:"#ddd", paddingHorizontal:12, backgroundColor:"#fff" },
  searchBtn:{ backgroundColor:"#111", borderRadius:10, paddingHorizontal:12, alignItems:"center", justifyContent:"center" },
  searchTxt:{ color:"#fff", fontWeight:"800" },
  outlineBtn:{ borderWidth:1, borderColor:"#111", borderRadius:10, paddingVertical:10, paddingHorizontal:12, alignItems:"center", justifyContent:"center" },
  outlineTxt:{ color:"#111", fontWeight:"800" },
  pills:{ flexDirection:"row", flexWrap:"wrap", gap:8, paddingHorizontal:12 },
  pill:{ backgroundColor:"#eee", borderRadius:999, paddingVertical:8, paddingHorizontal:12 },
  pillSm:{ backgroundColor:"#eee", borderRadius:999, paddingVertical:6, paddingHorizontal:10 },
  pillActive:{ backgroundColor:"#111" },
  pillTxt:{ fontWeight:"700", color:"#333" },
  pillTxtSm:{ fontWeight:"700", color:"#333", fontSize:12 },
  pillTxtActive:{ color:"#fff" },
  center:{ flex:1, alignItems:"center", justifyContent:"center" },
  card:{ flexDirection:"row", alignItems:"center", padding:12, gap:10 },
  thumb:{ width:64, height:64, borderRadius:8, backgroundColor:"#eee" },
  name:{ fontWeight:"900" },
  meta:{ fontSize:12, color:"#666" },
  sep:{ height:1, backgroundColor:"#eee", marginLeft:86 }
});
