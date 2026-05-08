import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/use-colors';

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 12);
  const tabBarHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontFamily: 'Tajawal-Bold', fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="posts" options={{ title: 'المقالات', tabBarIcon: ({ color }) => <IconSymbol size={25} name="list.bullet" color={color} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'التصنيفات', tabBarIcon: ({ color }) => <IconSymbol size={25} name="folder" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'البحث', tabBarIcon: ({ color }) => <IconSymbol size={25} name="magnifyingglass" color={color} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'المفضلة', tabBarIcon: ({ color }) => <IconSymbol size={25} name="heart.fill" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'المزيد', tabBarIcon: ({ color }) => <IconSymbol size={25} name="ellipsis" color={color} /> }} />
    </Tabs>
  );
}
