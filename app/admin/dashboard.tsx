import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/context';
import { adminApi, AdminStats } from '@/src/api/admin';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminDashboard() {
  const { token, logout, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/admin/login');
    } else {
      loadStats();
    }
  }, [token]);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/more');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>مرحباً، {user?.name || 'المدير'}</Text>
          <Text style={styles.welcomeSubtext}>إليك نظرة سريعة على إحصائيات الموقع</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.postsCount || 0}</Text>
            <Text style={styles.statLabel}>المقالات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.categoriesCount || 0}</Text>
            <Text style={styles.statLabel}>الأقسام</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.viewsCount || 0}</Text>
            <Text style={styles.statLabel}>المشاهدات</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/admin/posts')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="chevron.left" size={20} color="#666" />
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemText}>إدارة المقالات</Text>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="doc.text" size={24} color="#007AFF" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/admin/posts/create')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="chevron.left" size={20} color="#666" />
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemText}>إضافة مقال جديد</Text>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E5F1FF' }]}>
                <IconSymbol name="plus" size={24} color="#007AFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    fontSize: 20,
    fontFamily: 'Tajawal-Bold',
  },
  content: {
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: 'Tajawal-Bold',
    textAlign: 'right',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Tajawal-Regular',
    textAlign: 'right',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Tajawal-Bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#666',
    marginTop: 5,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLeft: {
    marginRight: 'auto',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    marginRight: 15,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
