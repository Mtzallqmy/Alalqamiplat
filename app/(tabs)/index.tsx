import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getPosts, getCategories, Post, Category } from "@/src/api/public";
import { Image } from "expo-image";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [postsData, categoriesData] = await Promise.all([
        getPosts(1, 5),
        getCategories(),
      ]);

      const items = postsData.items || [];
      if (items.length > 0) {
        setFeaturedPost(items[0]);
        setLatestPosts(items.slice(1, 4));
      }
      setCategories(categoriesData.slice(0, 6));
    } catch (err) {
      console.error('Error loading home data:', err);
      setError('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted" style={{ fontFamily: 'Tajawal-Regular' }}>جاري التحميل...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>معتز العلقمي</Text>
          <Text className="text-muted text-right mt-1" style={{ fontFamily: 'Tajawal-Regular' }}>مرحباً بك في منصتك الفاخرة</Text>
        </View>

        {error && (
          <View className="mx-4 p-4 bg-error/10 rounded-xl mb-6">
            <Text className="text-error text-center" style={{ fontFamily: 'Tajawal-Regular' }}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} className="mt-2">
              <Text className="text-primary text-center" style={{ fontFamily: 'Tajawal-Bold' }}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Post */}
        {featuredPost && (
          <TouchableOpacity
            onPress={() => router.push(`/post/${featuredPost.slug}`)}
            className="mx-4 mb-8 bg-surface rounded-2xl overflow-hidden border border-border shadow-sm"
          >
            {featuredPost.coverImage && (
              <Image
                source={{ uri: featuredPost.coverImage }}
                style={{ width: '100%', height: 200 }}
                contentFit="cover"
              />
            )}
            <View className="p-4">
              <View className="flex-row justify-end mb-2">
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs" style={{ fontFamily: 'Tajawal-Bold' }}>
                    {featuredPost.category?.name || 'منشور مميز'}
                  </Text>
                </View>
              </View>
              <Text className="text-xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }} numberOfLines={2}>
                {featuredPost.title}
              </Text>
              <Text className="text-muted text-sm mt-2 text-right" style={{ fontFamily: 'Tajawal-Regular' }} numberOfLines={2}>
                {featuredPost.excerpt}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Categories */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <TouchableOpacity onPress={() => router.push('/(tabs)/posts')}>
              <Text className="text-primary" style={{ fontFamily: 'Tajawal-Regular' }}>عرض الكل</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground" style={{ fontFamily: 'Tajawal-Bold' }}>الأقسام</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row-reverse' }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => router.push(`/category/${category.slug}`)}
                className="bg-surface border border-border px-6 py-3 rounded-xl ml-3"
              >
                <Text className="text-foreground" style={{ fontFamily: 'Tajawal-Bold' }}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Latest Posts */}
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => router.push('/(tabs)/posts')}>
              <Text className="text-primary" style={{ fontFamily: 'Tajawal-Regular' }}>المزيد</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground" style={{ fontFamily: 'Tajawal-Bold' }}>أحدث المنشورات</Text>
          </View>

          {latestPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              onPress={() => router.push(`/post/${post.slug}`)}
              className="flex-row-reverse bg-surface rounded-xl overflow-hidden border border-border mb-4 p-3"
            >
              {post.coverImage && (
                <Image
                  source={{ uri: post.coverImage }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  contentFit="cover"
                />
              )}
              <View className="flex-1 mr-3 justify-center">
                <Text className="text-base font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text className="text-xs text-muted mt-1 text-right" style={{ fontFamily: 'Tajawal-Regular' }}>
                  {post.author?.name || 'معتز العلقمي'} • {post.readingTime || 5} دقائق
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
