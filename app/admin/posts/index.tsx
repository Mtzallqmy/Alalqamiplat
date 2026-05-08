import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/src/api/admin';
import { Post } from '@/src/api/public';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminPostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadPosts = async () => {
    try {
      const data = await adminApi.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push({
        pathname: '/admin/posts/edit',
        params: { id: item.id }
      })}
    >
      <View style={styles.postInfo}>
        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.postMeta}>
          <Text style={styles.categoryLabel}>{item.category?.name || 'بدون قسم'}</Text>
          <Text style={styles.dateLabel}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ar-EG') : 'مسودة'}</Text>
        </View>
      </View>
      <IconSymbol name="chevron.left" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المقالات</Text>
        <TouchableOpacity onPress={() => router.push('/admin/posts/create')}>
          <IconSymbol name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا توجد مقالات حالياً</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postInfo: {
    flex: 1,
    marginRight: 10,
  },
  postTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
    textAlign: 'right',
    marginBottom: 5,
  },
  postMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#007AFF',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#999',
  },
});
