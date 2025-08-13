import { Stack } from 'expo-router';

export default function TrendsStack() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Trends' }} />
      <Stack.Screen name="near-me" options={{ title: 'Near Me' }} />
      <Stack.Screen name="national" options={{ title: 'National' }} />
      <Stack.Screen name="journal" options={{ title: 'Journal' }} />
      <Stack.Screen name="place/[id]" options={{ title: 'Details' }} />
    </Stack>
  );
}
