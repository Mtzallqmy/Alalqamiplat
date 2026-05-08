import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminApi } from '@/src/api/admin';
import { Category } from '@/src/api/public';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { makeExcerpt, publicPostUrl } from '@/src/utils/content';

export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadPost();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPost = async () => {
    setLoading(true);
    try {
      const post = await adminApi.getPost(id!);
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt || '');
        setCoverImage(post.coverImage || '');
        setCategoryId(post.category?.id || '');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل بيانات المقال');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title || !content) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان والمحتوى');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        title,
        content,
        excerpt: makeExcerpt(content, excerpt),
        coverImage,
        categoryId,
        status: publish ? 'PUBLISHED' : 'DRAFT'
      };

      let result: any;
      if (isEdit) {
        result = await adminApi.updatePost(id!, postData);
      } else {
        result = await adminApi.createPost(postData);
      }

      Alert.alert('نجاح', isEdit ? 'تم تحديث المقال بنجاح' : 'تم إنشاء المقال بنجاح');
      
      if (publish && result.slug) {
        const url = publicPostUrl(result.slug);
        setPublishedUrl(url);
      } else if (!isEdit) {
        router.back();
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في حفظ المقال');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (publishedUrl) {
      await Share.share({ message: publishedUrl });
    }
  };

  const handleOpenPublished = async () => {
    if (publishedUrl) {
      await Linking.openURL(publishedUrl).catch(() => null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'تعديل مقال' : 'إضافة مقال جديد'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {publishedUrl && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>تم النشر بنجاح!</Text>
            <Text style={styles.urlText}>{publishedUrl}</Text>
            <View style={styles.successActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionButtonText}>مشاركة</Text>
                <IconSymbol name="square.and.arrow.up" size={18} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleOpenPublished}>
                <Text style={styles.actionButtonText}>فتح المقال</Text>
                <IconSymbol name="globe" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>العنوان</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="عنوان المقال"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>القسم</Text>
          <View style={styles.categoryContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>رابط صورة الغلاف</Text>
          <TextInput
            style={styles.input}
            value={coverImage}
            onChangeText={setCoverImage}
            placeholder="https://example.com/image.jpg"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>مقتطف (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={excerpt}
            onChangeText={setExcerpt}
            placeholder="وصف قصير للمقال"
            multiline
            numberOfLines={2}
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>المحتوى</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={content}
            onChangeText={setContent}
            placeholder="اكتب محتوى المقال هنا..."
            multiline
            textAlign="right"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.saveButton, styles.draftButton]} 
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            <Text style={styles.draftButtonText}>حفظ كمسودة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>نشر المقال</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  contentArea: {
    height: 250,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flex: 0.6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
  },
  draftButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 0.35,
  },
  draftButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
  },
  successBox: {
    backgroundColor: '#E5F9E7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#28A745',
    fontFamily: 'Tajawal-Bold',
    fontSize: 16,
  },
  urlText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  successActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#007AFF',
    marginRight: 5,
    fontFamily: 'Tajawal-Regular',
  },
});
