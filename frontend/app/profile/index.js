// app/profile/index.js
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getFavoritePosts } from "../../lib/storage";

const API_POSTS = "https://bevtrends-backend.onrender.com/posts";
const AVATAR =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop";
const GRID = Math.floor(Dimensions.get("window").width / 3) - 2;

export default function ProfileScreen() {
  const router = useRouter();

  const [tab, setTab] = useState("posts"); // posts | favorites
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]); // bookmarked posts

  const username = "Jordan G.";
  const bio = "Beverage trends nerd. Building BevTrends 🍸📈";
  const [stats, setStats] = useState({ posts: 0, followers: 482, following: 311 });

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, favLocal] = await Promise.all([
        fetch(API_POSTS).then((r) => r.json()).catch(() => []),
        getFavoritePosts(),
      ]);
      const postsArr = Array.isArray(pRes) ? pRes : [];
      setPosts(postsArr);
      setFavorites(favLocal);
      setStats((s) => ({ ...s, posts: postsArr.length }));
      setErr(null);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const renderPostTile = ({ item }) => (
    <Pressable style={styles.tile} onPress={() => { /* TODO: open post */ }}>
      <Image source={{ uri: item.imageUrl }} style={styles.tileImg} />
    </Pressable>
  );

  const renderFavoriteTile = ({ item }) => (
    <Pressable style={styles.tile} onPress={() => { /* TODO: open favorited post */ }}>
      <Image source={{ uri: item.imageUrl }} style={styles.tileImg} />
    </Pressable>
  );

  const gridData = tab === "posts" ? posts : favorites;
  const gridRenderer = tab === "posts" ? renderPostTile : renderFavoriteTile;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: AVATAR }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.statsRow}>
            <Stat label="Posts" value={stats.posts} />
            <Stat label="Followers" value={stats.followers} />
            <Stat label="Following" value={stats.following} />
          </View>
          <Text style={styles.bio} numberOfLines={2}>{bio}</Text>
        </View>
      </View>

      {/* Single action: open Builder (menus & saved drinks live there) */}
      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, { flex: 1 }]} onPress={() => router.push("/profile/builder")}>
          <Text style={styles.actionText}>Drink/Menu Builder</Text>
        </Pressable>
      </View>

      {/* Tabs: Posts | Favorites */}
      <View style={styles.tabs}>
        {["posts", "favorites"].map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
          >
            <View style={styles.tabInner}>
              {t === "favorites" && <Feather name="bookmark" size={14} style={styles.tabIcon} />}
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "posts" ? "Posts" : "Favorites"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : err ? (
        <View style={styles.center}><Text>{err}</Text></View>
      ) : gridData.length === 0 ? (
        <View style={styles.center}><Text>No {tab === "posts" ? "posts" : "favorites"} yet.</Text></View>
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(i, idx) => i.id ?? String(idx)}
          numColumns={3}
          renderItem={gridRenderer}
          contentContainerStyle={{ padding: 1, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 3 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ddd" },
  username: { fontSize: 18, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 8, marginBottom: 6 },
  stat: { alignItems: "center" },
  statVal: { fontWeight: "800" },
  statLbl: { fontSize: 12, color: "#666" },
  bio: { fontSize: 13, color: "#333" },

  actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  actionBtn: { backgroundColor: "#111", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700" },

  tabs: {
    flexDirection: "row", gap: 6, padding: 6, marginHorizontal: 12, borderRadius: 999,
    backgroundColor: "#f1f1f1", marginBottom: 6,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 999 },
  tabActive: { backgroundColor: "#fff", elevation: 1 },
  tabInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabIcon: { marginTop: 1 },
  tabText: { fontWeight: "700", color: "#666" },
  tabTextActive: { color: "#111" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tile: { width: GRID, height: GRID, backgroundColor: "#eee", marginBottom: 3 },
  tileImg: { width: "100%", height: "100%" },
});
