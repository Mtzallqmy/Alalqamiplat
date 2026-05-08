import { FlatList, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Post } from '@/src/api/public';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

const FAVORITES_KEY = 'favorites';
const FAVORITE_POSTS_KEY = 'favorite_posts';

export default function FavoritesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const [favoriteIds, storedPosts] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(FAVORITE_POSTS_KEY),
      ]);
      const ids: string[] = favoriteIds ? JSON.parse(favoriteIds) : [];
      const postsMap: Record<string, Post> = storedPosts ? JSON.parse(storedPosts) : {};
      setFavorites(ids.map(id => postsMap[id]).filter(Boolean));
    } catch (err) {
      console.error('Error loading favorites:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const removeFavorite = async (postId: string) => {
    try {
      const [favoriteIds, storedPosts] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(FAVORITE_POSTS_KEY),
      ]);
      let ids: string[] = favoriteIds ? JSON.parse(favoriteIds) : [];
      const postsMap: Record<string, Post> = storedPosts ? JSON.parse(storedPosts) : {};
      ids = ids.filter(id => id !== postId);
      delete postsMap[postId];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      await AsyncStorage.setItem(FAVORITE_POSTS_KEY, JSON.stringify(postsMap));
      setFavorites(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => router.push(`/post/${item.slug}`)} className="mx-4 mb-4 bg-surface rounded-xl overflow-hidden border border-border p-3 flex-row-reverse">
      {item.coverImage ? <Image source={{ uri: item.coverImage }} style={{ width: 80, height: 80, borderRadius: 8 }} contentFit="cover" /> : null}
      <View className="flex-1 mr-3 justify-between">
        <Text className="text-base font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity onPress={() => removeFavorite(item.id)} className="flex-row-reverse items-center">
          <IconSymbol name="heart.fill" size={14} color={colors.error} />
          <Text className="text-xs text-error mr-1" style={{ fontFamily: 'Tajawal-Regular' }}>إزالة من المفضلة</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && favorites.length === 0) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-6 border-b border-border mb-2">
        <Text className="text-2xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>المفضلة</Text>
        <Text className="text-muted text-right mt-1" style={{ fontFamily: 'Tajawal-Regular' }}>تُحفظ محليًا للرجوع السريع</Text>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <IconSymbol name="heart" size={60} color={colors.border} />
          <Text className="text-muted text-center mt-4" style={{ fontFamily: 'Tajawal-Regular' }}>لم تقم بإضافة أي مقالات للمفضلة بعد</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="mt-6 bg-primary px-8 py-3 rounded-xl">
            <Text className="text-background font-bold" style={{ fontFamily: 'Tajawal-Bold' }}>استكشف المقالات</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={favorites} renderItem={renderPost} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 20 }} />
      )}
    </ScreenContainer>
  );
}
