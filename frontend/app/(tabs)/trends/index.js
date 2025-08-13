// app/(tabs)/trends/index.js
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function TrendsScreen() {
  const router = useRouter();

  const [tab, setTab] = useState("near"); // near | national | journal
  const [view, setView] = useState("list"); // list | map (near-me only)
  const [loading, setLoading] = useState(false);
  const [near, setNear] = useState([]);
  const [error, setError] = useState(null);

  const loadNearMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/trending/near-me?sort=popularity`);
      const data = await res.json();
      setNear(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load near-me data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearMe();
  }, [loadNearMe]);

  const renderNearItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.type} • {item.location?.city}, {item.location?.state} • {item.distanceMiles} mi
        </Text>
        {!!item.tags?.length && (
          <Text style={styles.tags}>{item.tags.join(" • ")}</Text>
        )}
      </View>
    </View>
  );

  const NearMe = () => (
    <View style={{ flex: 1 }}>
      {/* list/map toggle */}
      <View style={styles.toggleRow}>
        {["list", "map"].map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[styles.togBtn, view === v && styles.togBtnActive]}
          >
            <Text style={[styles.togTxt, view === v && styles.togTxtActive]}>
              {v === "list" ? "List" : "Map"}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "list" ? (
        loading ? (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        ) : error ? (
          <View style={styles.center}><Text>{error}</Text></View>
        ) : (
          <FlatList
            data={near}
            keyExtractor={(i) => i.id}
            renderItem={renderNearItem}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )
      ) : (
        // Keep your old map component here if you had one.
        // Placeholder so the screen doesn't go blank if maps lib isn't installed.
        <View style={[styles.center, { padding: 24 }]}>
          <Feather name="map" size={20} />
          <Text style={{ marginTop: 8 }}>Map view coming back here.</Text>
        </View>
      )}
    </View>
  );

  const National = () => (
    <View style={[styles.center, { padding: 24 }]}>
      <Text style={{ fontWeight: "800" }}>National Trends</Text>
      <Text style={{ color: "#666", marginTop: 6 }}>Hook this to your national feed.</Text>
    </View>
  );

  const Journal = () => (
    <View style={[styles.center, { padding: 24 }]}>
      <Text style={{ fontWeight: "800" }}>Journal</Text>
      <Text style={{ color: "#666", marginTop: 6 }}>Notes & saved insights will appear here.</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* top tabs */}
      <View style={styles.tabs}>
        {[
          { key: "near", label: "Near Me" },
          { key: "national", label: "National" },
          { key: "journal", label: "Journal" },
        ].map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tabBtn, tab === key && styles.tabActive]}
          >
            <Text style={[styles.tabTxt, tab === key && styles.tabTxtActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* content */}
      {tab === "near" && <NearMe />}
      {tab === "national" && <National />}
      {tab === "journal" && <Journal />}

      {/* Floating Recipe Search button */}
      <Pressable
        onPress={() => router.push("/trends/search")}
        style={styles.fab}
        accessibilityLabel="Open Recipe Search"
      >
        <Feather name="search" size={16} color="#fff" />
        <Text style={styles.fabTxt}>Recipes</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 6,
    padding: 6,
    margin: 12,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 999 },
  tabActive: { backgroundColor: "#fff", elevation: 1 },
  tabTxt: { fontWeight: "700", color: "#666" },
  tabTxtActive: { color: "#111" },

  toggleRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  togBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 999, backgroundColor: "#f1f1f1" },
  togBtnActive: { backgroundColor: "#111" },
  togTxt: { fontWeight: "700", color: "#666" },
  togTxtActive: { color: "#fff" },

  card: { flexDirection: "row", alignItems: "center", padding: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#eee", marginRight: 10 },
  name: { fontWeight: "900" },
  meta: { fontSize: 12, color: "#666" },
  tags: { marginTop: 4, fontSize: 12, color: "#333" },
  sep: { height: 1, backgroundColor: "#eee", marginLeft: 86 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  fab: {
    position: "absolute", right: 16, bottom: 24,
    backgroundColor: "#111", borderRadius: 999,
    paddingVertical: 10, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 8, elevation: 3,
  },
  fabTxt: { color: "#fff", fontWeight: "800" },
});
