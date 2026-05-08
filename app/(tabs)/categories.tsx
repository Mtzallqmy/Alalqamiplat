import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { getCategories, Category } from '@/src/api/public';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function CategoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('تعذر تحميل التصنيفات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-6 border-b border-border mb-2">
        <Text className="text-2xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>التصنيفات</Text>
        <Text className="text-muted text-right mt-1" style={{ fontFamily: 'Tajawal-Regular' }}>تصفح المحتوى حسب القسم</Text>
      </View>

      {error ? (
        <View className="mx-4 p-4 bg-error/10 rounded-xl mb-4">
          <Text className="text-error text-center" style={{ fontFamily: 'Tajawal-Regular' }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/category/${item.slug}`)}
            className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row-reverse items-center"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <IconSymbol name="folder" size={24} color={colors.primary} />
            </View>
            <View className="flex-1 mr-4">
              <Text className="text-lg text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>{item.name}</Text>
              {item.description ? (
                <Text className="text-muted text-right mt-1" style={{ fontFamily: 'Tajawal-Regular' }} numberOfLines={2}>{item.description}</Text>
              ) : null}
            </View>
            <IconSymbol name="chevron.left" size={22} color={colors.muted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-muted" style={{ fontFamily: 'Tajawal-Regular' }}>لا توجد تصنيفات حالياً</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
