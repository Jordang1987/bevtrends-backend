import { Stack } from 'expo-router';

export default function ProfileStack() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="builder" options={{ title: 'Drink / Menu Builder' }} />
      <Stack.Screen name="menus/[id]" options={{ title: 'Menu' }} />
      <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
    </Stack>
  );
}
