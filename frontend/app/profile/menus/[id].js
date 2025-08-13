// app/profile/menus/[id].js
import * as Print from "expo-print";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { getMenus, removeItemFromMenu } from "../../../lib/storage";

export default function MenuDetail() {
  const { id } = useLocalSearchParams();
  const [menu, setMenu] = useState(null);

  const load = useCallback(async () => {
    const menus = await getMenus();
    setMenu(menus.find(m => String(m.id) === String(id)) || null);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const exportPDF = async () => {
    if (!menu) return;
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", Arial; padding: 24px; }
            h1 { margin: 0 0 12px 0; }
            .item { margin-bottom: 12px; }
            .name { font-weight: 700; font-size: 16px; }
            .meta { color: #555; font-size: 12px; }
            .ing { margin: 4px 0 0 16px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${menu.title}</h1>
          ${(menu.items || []).map(it => `
            <div class="item">
              <div class="name">${it.name}</div>
              <div class="meta">${it.category || ""} ${it.glassware ? "• " + it.glassware : ""}</div>
              ${Array.isArray(it.ingredients) ? `<ul class="ing">
                ${it.ingredients.map(ing => `<li>${[ing.qty, ing.unit, ing.item].filter(Boolean).join(" ")}</li>`).join("")}
              </ul>` : ""}
            </div>
          `).join("")}
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: "com.adobe.pdf", mimeType: "application/pdf" });
  };

  if (!menu) return <SafeAreaView style={styles.center}><Text>Menu not found.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#fff" }}>
      <View style={styles.head}>
        <Text style={styles.title}>{menu.title}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={exportPDF} style={styles.primary}><Text style={styles.primaryTxt}>Export PDF</Text></Pressable>
        </View>
      </View>

      <FlatList
        data={menu.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex:1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category || "Cocktail"}</Text>
            </View>
            <Pressable onPress={() => removeItemFromMenu(String(id), item.id)} style={styles.ghost}>
              <Text style={styles.ghostTxt}>Remove</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={{ padding:16, color:"#666" }}>No items in this menu.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center:{ flex:1, alignItems:"center", justifyContent:"center" },
  head:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:12 },
  title:{ fontSize:18, fontWeight:"900" },
  primary:{ backgroundColor:"#111", paddingVertical:8, paddingHorizontal:12, borderRadius:8 },
  primaryTxt:{ color:"#fff", fontWeight:"800" },
  ghost:{ paddingVertical:8, paddingHorizontal:12, borderRadius:8, borderWidth:1, borderColor:"#ddd" },
  ghostTxt:{ color:"#111", fontWeight:"800" },
  itemRow:{ flexDirection:"row", alignItems:"center", padding:12 },
  itemName:{ fontWeight:"800" },
  itemMeta:{ fontSize:12, color:"#666" },
  sep:{ height:1, backgroundColor:"#eee", marginLeft:12 },
});
