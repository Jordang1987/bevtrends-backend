// app/(tabs)/_layout.js
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: {
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Feed" }} />
      <Tabs.Screen name="trends" options={{ title: "Trends" }} />
      <Tabs.Screen name="post" options={{ title: "Post" }} />
      {/* Bridge file: app/(tabs)/profile/index.js -> export { default } from "../../profile"; */}
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
