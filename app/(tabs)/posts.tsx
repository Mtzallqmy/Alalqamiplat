import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getPosts, Post } from "@/src/api/public";
import { Image } from "expo-image";

export default function PostsScreen() {
  const colors = useColors();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async (pageNum: number, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      const data = await getPosts(pageNum, 10);
      
      if (isRefresh) {
        setPosts(data.items);
      } else {
        setPosts(prev => [...prev, ...data.items]);
      }
      
      const totalPages = data.pagination?.totalPages || 1;
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('حدث خطأ في تحميل المنشورات');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  const onRefresh = () => {
    loadPosts(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      loadPosts(page + 1);
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
          style={{ width: 100, height: 100, borderRadius: 8 }}
          contentFit="cover"
        />
      )}
      <View className="flex-1 mr-3 justify-between py-1">
        <View>
          <Text className="text-base font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }} numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-xs text-muted mt-2 text-right" style={{ fontFamily: 'Tajawal-Regular' }} numberOfLines={2}>
            {item.excerpt}
          </Text>
        </View>
        <Text className="text-[10px] text-primary text-right mt-2" style={{ fontFamily: 'Tajawal-Bold' }}>
          {item.category?.name || 'مقال'} • {item.readingTime || 5} دقائق
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && posts.length === 0) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-6 border-b border-border mb-2">
        <Text className="text-2xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>جميع المنشورات</Text>
      </View>

      {error && (
        <View className="mx-4 p-4 bg-error/10 rounded-xl mb-4">
          <Text className="text-error text-center" style={{ fontFamily: 'Tajawal-Regular' }}>{error}</Text>
          <TouchableOpacity onPress={() => loadPosts(1)} className="mt-2">
            <Text className="text-primary text-center" style={{ fontFamily: 'Tajawal-Bold' }}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : <View className="h-10" />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-muted" style={{ fontFamily: 'Tajawal-Regular' }}>لا توجد منشورات حالياً</Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}
