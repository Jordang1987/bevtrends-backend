export default {
  expo: {
    name: "BevTrendsV3",
    slug: "bevtrendsv3",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "bevtrends", // ✅ Needed for deep linking with Google Auth
    userInterfaceStyle: "light",
    // icon: "./assets/icon.png",
    // splash: {
    //   image: "./assets/splash.png",
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jordangoldenberg.bevtrends", // ✅ Required for Google OAuth iOS
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: "./assets/adaptive-icon.png",
      //   backgroundColor: "#ffffff"
      // },
      package: "com.jordangoldenberg.bevtrends", // ✅ Required for Google OAuth Android
    },
    web: {
      // favicon: "./assets/favicon.png"
    },
    plugins: ["expo-router"],
  },
};
