import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Share, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getPostBySlug, Post } from "@/src/api/public";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RenderHtml from 'react-native-render-html';
import { IconSymbol } from "@/components/ui/icon-symbol";

const FAVORITES_KEY = 'favorites';
const FAVORITE_POSTS_KEY = 'favorite_posts';

export default function PostDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadPost = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPostBySlug(slug as string);
      setPost(data.post);
      
      // Check if favorite
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const favs = favorites ? JSON.parse(favorites) : [];
      setIsFavorite(favs.includes(data.post.id));
    } catch (err) {
      console.error('Error loading post:', err);
      setError('حدث خطأ في تحميل المنشور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [slug]);

  const toggleFavorite = async () => {
    if (!post) return;
    try {
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const storedPosts = await AsyncStorage.getItem(FAVORITE_POSTS_KEY);
      let favs: string[] = favorites ? JSON.parse(favorites) : [];
      const postsMap = storedPosts ? JSON.parse(storedPosts) : {};

      if (isFavorite) {
        favs = favs.filter((id: string) => id !== post.id);
        delete postsMap[post.id];
      } else if (!favs.includes(post.id)) {
        favs.push(post.id);
        postsMap[post.id] = post;
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
      await AsyncStorage.setItem(FAVORITE_POSTS_KEY, JSON.stringify(postsMap));
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${post.title}\nhttps://moatazalalqami.online/posts/${post.slug}`,
        title: post.title,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (error || !post) {
    return (
      <ScreenContainer className="flex items-center justify-center p-4">
        <Text className="text-error mb-4" style={{ fontFamily: 'Tajawal-Regular' }}>{error || 'المنشور غير موجود'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-2 rounded-lg">
          <Text className="text-background" style={{ fontFamily: 'Tajawal-Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Actions */}
        <View className="flex-row justify-between items-center px-4 py-4 absolute top-0 left-0 right-0 z-10">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-black/20 w-10 h-10 rounded-full items-center justify-center"
          >
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={handleShare} 
              className="bg-black/20 w-10 h-10 rounded-full items-center justify-center ml-2"
            >
              <IconSymbol name="square.and.arrow.up" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={toggleFavorite} 
              className="bg-black/20 w-10 h-10 rounded-full items-center justify-center ml-2"
            >
              <IconSymbol 
                name={isFavorite ? "heart.fill" : "heart"} 
                size={20} 
                color={isFavorite ? colors.error : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cover Image */}
        {post.coverImage && (
          <Image
            source={{ uri: post.coverImage }}
            style={{ width: '100%', height: 300 }}
            contentFit="cover"
          />
        )}

        {/* Content Container */}
        <View className="px-4 -mt-6 bg-background rounded-t-3xl pt-6">
          <View className="flex-row justify-end mb-2">
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs" style={{ fontFamily: 'Tajawal-Bold' }}>
                {post.category?.name || 'مقال'}
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-foreground text-right mb-4" style={{ fontFamily: 'Tajawal-Bold' }}>
            {post.title}
          </Text>

          <View className="flex-row-reverse items-center mb-6 pb-6 border-b border-border">
            {post.author?.avatar && (
              <Image 
                source={{ uri: post.author.avatar.startsWith('/') ? `https://moatazalalqami.online${post.author.avatar}` : post.author.avatar }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
              />
            )}
            <View className="mr-3 items-end">
              <Text className="text-foreground font-bold" style={{ fontFamily: 'Tajawal-Bold' }}>{post.author?.name || 'معتز العلقمي'}</Text>
              <Text className="text-muted text-xs" style={{ fontFamily: 'Tajawal-Regular' }}>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ar-EG') : ''} • {post.readingTime || 5} دقائق قراءة
              </Text>
            </View>
          </View>

          {/* HTML Content */}
          <View style={{ alignItems: 'flex-end' }}>
            <RenderHtml
              contentWidth={width - 32}
              source={{ html: post.content }}
              baseStyle={{
                color: colors.foreground,
                textAlign: 'right',
                fontFamily: 'Tajawal-Regular',
                fontSize: 16,
                lineHeight: 26,
              }}
              tagsStyles={{
                p: { marginBottom: 15, textAlign: 'right' },
                h1: { fontFamily: 'Tajawal-Bold', textAlign: 'right', color: colors.primary, marginBottom: 10 },
                h2: { fontFamily: 'Tajawal-Bold', textAlign: 'right', color: colors.primary, marginBottom: 10 },
                li: { textAlign: 'right' },
              }}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
