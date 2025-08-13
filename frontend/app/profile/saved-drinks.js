// app/profile/saved-drinks.js
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { KEYS, getJSON } from "../../lib/storage";

export default function SavedDrinks() {
  const router = useRouter();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const saved = await getJSON(KEYS.savedDrinks);
      setItems(saved);
    })();
  }, []);

  const renderItem = ({ item }) => (
    <Pressable style={styles.row} onPress={() => router.push(`/profile/recipe/${item.id}`)}>
      {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.thumb} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.category || "Cocktail"} • {item.source || "User"}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#fff" }}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={{ padding:16, color:"#666" }}>No saved drinks yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { padding: 12 },
  backText: { fontSize: 16, fontWeight: "800" },
  row:{ flexDirection:"row", alignItems:"center", padding:12 },
  thumb:{ width:54, height:54, borderRadius:8, marginRight:10, backgroundColor:"#eee" },
  name:{ fontWeight:"800" },
  meta:{ color:"#666", fontSize:12 },
  sep:{ height:1, backgroundColor:"#eee", marginLeft:76 }
});
