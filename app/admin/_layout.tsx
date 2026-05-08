import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="posts/index" />
      <Stack.Screen name="posts/create" />
      <Stack.Screen name="posts/edit" />
    </Stack>
  );
}
