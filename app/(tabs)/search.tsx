import { FlatList, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { searchPosts, Post } from "@/src/api/public";
import { Image } from "expo-image";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const data = await searchPosts(searchQuery);
      setResults(data.items || []);
    } catch (err) {
      console.error('Error searching:', err);
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => router.push(`/post/${item.slug}`)}
      className="mx-4 mb-4 bg-surface rounded-xl overflow-hidden border border-border p-3 flex-row-reverse"
    >
      {item.coverImage && (
        <Image
          source={{ uri: item.coverImage }}
          style={{ width: 80, height: 80, borderRadius: 8 }}
          contentFit="cover"
        />
      )}
      <View className="flex-1 mr-3 justify-center">
        <Text className="text-base font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted mt-1 text-right" style={{ fontFamily: 'Tajawal-Regular' }}>
          {item.category?.name || 'مقال'} • {item.readingTime || 5} دقائق
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-foreground text-right mb-4" style={{ fontFamily: 'Tajawal-Bold' }}>البحث</Text>
        
        <View className="flex-row-reverse items-center bg-surface border border-border rounded-xl px-4 py-2">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            placeholder="ابحث عن المقالات، المواضيع..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={handleSearch}
            className="flex-1 text-right mr-2 h-10 text-foreground"
            style={{ fontFamily: 'Tajawal-Regular' }}
          />
        </View>
      </View>

      {error && (
        <View className="mx-4 p-4 bg-error/10 rounded-xl mb-4">
          <Text className="text-error text-center" style={{ fontFamily: 'Tajawal-Regular' }}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-muted" style={{ fontFamily: 'Tajawal-Regular' }}>جاري البحث...</Text>
        </View>
      ) : !searched ? (
        <View className="flex-1 items-center justify-center px-10">
          <IconSymbol name="magnifyingglass" size={60} color={colors.border} />
          <Text className="text-muted text-center mt-4" style={{ fontFamily: 'Tajawal-Regular' }}>
            ابدأ كتابة ما تبحث عنه لاستكشاف المقالات
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-muted text-center" style={{ fontFamily: 'Tajawal-Regular' }}>
            لم نجد أي نتائج لـ "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
