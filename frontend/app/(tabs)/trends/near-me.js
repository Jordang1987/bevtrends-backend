import Slider from "@react-native-community/slider";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable, SafeAreaView,
  StyleSheet, Text, View
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

const API_BASE = "https://bevtrends-backend.onrender.com/trending/near-me";
const TYPES = ["All", "Cocktail", "Beer", "Wine", "Non-Alcoholic"];
const SORTS = ["popularity", "distance"];

export default function NearMeScreen() {
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState([]);

  // filters
  const [type, setType] = useState("All");
  const [maxDistance, setMaxDistance] = useState(10);
  const [sort, setSort] = useState("popularity");

  const region = useMemo(() => ({
    latitude: 27.95, longitude: -82.46, latitudeDelta: 0.25, longitudeDelta: 0.25
  }), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (maxDistance) params.set("maxDistance", String(maxDistance));
      if (type !== "All") params.set("type", type);
      if (sort) params.set("sort", sort);
      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json = await res.json();
      setData(json);
      setErr(null);
    } catch (e) {
      setErr("Failed to load Near Me trends.");
    } finally {
      setLoading(false);
    }
  }, [type, maxDistance, sort]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.sub}>{item.type} • {item.priceRange ?? "$$"}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.meta}>
          📍 {item.location?.city}, {item.location?.state} • {item.distanceMiles} mi
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trending Near Me</Text>
        <View style={styles.toggle}>
          <Pressable onPress={() => setViewMode("list")}
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleActive]}>
            <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
              List
            </Text>
          </Pressable>
          <Pressable onPress={() => setViewMode("map")}
            style={[styles.toggleBtn, viewMode === "map" && styles.toggleActive]}>
            <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.pillsRow}>
          {TYPES.map((t) => (
            <Pressable key={t}
              onPress={() => setType(t)}
              style={[styles.pill, type === t && styles.pillActive]}>
              <Text style={[styles.pillText, type === t && styles.pillTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.controlsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.controlLabel}>Max Distance: {maxDistance} mi</Text>
            <Slider
              value={maxDistance}
              onValueChange={setMaxDistance}
              onSlidingComplete={fetchData}
              minimumValue={1}
              maximumValue={25}
              step={1}
            />
          </View>

          <View style={styles.sortWrap}>
            {SORTS.map((s) => (
              <Pressable key={s}
                onPress={() => setSort(s)}
                style={[styles.sortBtn, sort === s && styles.sortBtnActive]}>
                <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : err ? (
        <View style={styles.center}><Text>{err}</Text></View>
      ) : viewMode === "list" ? (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={region}>
            {data.map((d) => (
              <Marker
                key={d.id}
                coordinate={{
                  latitude: region.latitude + (Math.random() - 0.5) * 0.08,
                  longitude: region.longitude + (Math.random() - 0.5) * 0.08,
                }}
                title={d.name}
                description={`${d.location?.city}, ${d.location?.state}`}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{d.name}</Text>
                    <Text style={styles.calloutMeta}>
                      {d.type} • {d.distanceMiles} mi
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e5e5",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  toggle: { flexDirection: "row", backgroundColor: "#eee", borderRadius: 999, padding: 4, gap: 4 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 },
  toggleActive: { backgroundColor: "#fff", elevation: 2 },
  toggleText: { fontWeight: "600", color: "#666" },
  toggleTextActive: { color: "#111" },

  filters: { backgroundColor: "#fff", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e5e5" },
  pillsRow: { flexDirection: "row", paddingHorizontal: 12, gap: 8, flexWrap: "wrap" },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#eee" },
  pillActive: { backgroundColor: "#111" },
  pillText: { fontSize: 13, color: "#333", fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  controlsRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 12, marginTop: 8 },
  controlLabel: { fontSize: 12, color: "#444", marginBottom: 4 },

  sortWrap: { flexDirection: "row", gap: 6, alignItems: "center" },
  sortBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#eee" },
  sortBtnActive: { backgroundColor: "#111" },
  sortText: { fontSize: 12, color: "#333", fontWeight: "700", textTransform: "capitalize" },
  sortTextActive: { color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#fff", borderRadius: 12, overflow: "hidden",
    marginBottom: 12, padding: 10, gap: 8, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  image: { width: "100%", height: 160, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 12, color: "#666" },
  desc: { fontSize: 13, color: "#333" },
  meta: { fontSize: 12, color: "#666" },

  mapWrap: { flex: 1 },
  map: { flex: 1 },
  callout: { backgroundColor: "#fff", padding: 8, borderRadius: 8, minWidth: 160 },
  calloutTitle: { fontWeight: "700", marginBottom: 2 },
  calloutMeta: { fontSize: 12, color: "#555" },
});
