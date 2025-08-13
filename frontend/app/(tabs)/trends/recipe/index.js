// app/tabs/trends/recipe/index.js
import { apiGet, wakeBackend } from "@lib/api"; // or: ../../../../lib/api
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator, FlatList, Image,
    Linking,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet, Text, TextInput, View
} from "react-native";

export default function IBARecipeList() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const didInit = useRef(false);

  const fetchAll = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await apiGet("/api/iba/cocktails", { timeout: 20000, retries: 2, retryDelay: 1500 });
      setRaw(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load IBA cocktails.");
      setRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didInit.current) return; // StrictMode guard
    didInit.current = true;
    (async () => {
      await wakeBackend({ timeout: 8000 });  // nudge cold server
      await fetchAll();
    })();
  }, []);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const deb = useRef(null);
  useEffect(() => {
    clearTimeout(deb.current);
    deb.current = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(deb.current);
  }, [query]);

  const data = useMemo(() => {
    if (!debouncedQuery) return raw;
    return raw.filter((it) => {
      const hay = [it.name, it.baseSpirit, ...(it.tags || []), ...(it.ingredients || [])]
        .join(" ").toLowerCase();
      return hay.includes(debouncedQuery);
    });
  }, [raw, debouncedQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/tabs/trends/recipe/${item.id}`)} style={styles.row}>
      <Image source={{ uri: item.imageUrl || "https://picsum.photos/seed/iba/120/90" }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.baseSpirit || "—"}{item.tags?.length ? ` • ${item.tags.slice(0, 3).join(", ")}` : ""}
        </Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#666" }}>Waking server & loading recipes…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    const base = (process.env.EXPO_PUBLIC_API_URL || "").trim();
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        {!!base && (
          <Pressable
            onPress={() => Linking.openURL(`${base}/api/iba/cocktails`)}
            style={[styles.btn, { marginTop: 10, backgroundColor: "#444" }]}
          >
            <Text style={styles.btnTxt}>Open in Browser (Warm Up)</Text>
          </Pressable>
        )}
        <Pressable onPress={fetchAll} style={[styles.btn, { marginTop: 10 }]}>
          <Text style={styles.btnTxt}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>IBA Cocktails</Text>
      <TextInput
        placeholder="Search by name, spirit, tag, ingredient…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        style={styles.input}
      />
      <FlatList
        data={data}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<View style={{ padding: 20, alignItems: "center" }}><Text style={{ color: "#666" }}>No matches.</Text></View>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 20, fontWeight: "900", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  input: { marginHorizontal: 12, marginBottom: 8, height: 44, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", padding: 12 },
  thumb: { width: 96, height: 72, borderRadius: 10, marginRight: 12, backgroundColor: "#eee" },
  name: { fontWeight: "900" },
  meta: { color: "#666", marginTop: 2, fontSize: 12 },
  chev: { fontSize: 26, color: "#aaa", marginLeft: 8 },
  sep: { height: 1, backgroundColor: "#eee", marginLeft: 12 },
  btn: { backgroundColor: "#111", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  btnTxt: { color: "#fff", fontWeight: "800" },
  error: { color: "#b3261e", textAlign: "center", paddingHorizontal: 16 },
});
