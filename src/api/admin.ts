import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_TOKEN_KEY } from '@/src/auth/context';
import { Post, Category } from './public';
import { makeExcerpt, normalizeUrl } from '@/src/utils/content';

const API_BASE = 'https://moatazalalqami.online/api';

async function getAuthToken() {
  const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  return typeof token === 'string' && token.trim() ? token : null;
}

function normalizeResponse<T>(payload: any): T {
  if (payload?.success && payload?.data !== undefined) return payload.data as T;
  if (payload?.data !== undefined) return payload.data as T;
  if (payload?.items !== undefined) return payload as T;
  return payload as T;
}

async function parsePayload(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function fetchAdmin<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('يرجى تسجيل الدخول للإدارة أولاً.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });

  const payload = await parsePayload(response);

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.error ||
      payload?.message ||
      (response.status === 401 ? 'انتهت جلسة الإدارة. سجل الدخول مرة أخرى.' : `خطأ من الخادم: ${response.status}`);
    throw new Error(message);
  }

  return normalizeResponse<T>(payload);
}

export interface AdminStats {
  postsCount?: number;
  categoriesCount?: number;
  viewsCount?: number;
  publishedPosts?: number;
  draftPosts?: number;
  [key: string]: any;
}

type AdminPostPayload = Partial<Post> & {
  categoryId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
};

function cleanPostPayload(postData: AdminPostPayload): AdminPostPayload {
  return {
    ...postData,
    title: postData.title?.trim(),
    content: postData.content?.trim(),
    excerpt: makeExcerpt(postData.content, postData.excerpt),
    coverImage: normalizeUrl(postData.coverImage) || '',
    categoryId: postData.categoryId || undefined,
  };
}

export const adminApi = {
  getStats: () => fetchAdmin<AdminStats>('/admin/stats'),

  getPosts: async () => {
    const result = await fetchAdmin<Post[] | { items: Post[] }>('/admin/posts');
    return Array.isArray(result) ? result : result.items ?? [];
  },

  getCategories: async () => {
    const result = await fetchAdmin<Category[] | { items: Category[] }>('/admin/categories');
    return Array.isArray(result) ? result : result.items ?? [];
  },

  getPost: async (id: string) => {
    try {
      return await fetchAdmin<Post>(`/admin/posts/${id}`);
    } catch {
      const posts = await adminApi.getPosts();
      const found = posts.find(post => post.id === id);
      if (!found) throw new Error('تعذر العثور على المقال.');
      return found;
    }
  },

  createPost: (postData: AdminPostPayload) =>
    fetchAdmin<Post>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(cleanPostPayload(postData)),
    }),

  updatePost: async (id: string, postData: AdminPostPayload) => {
    const payload = cleanPostPayload(postData);
    try {
      return await fetchAdmin<Post>(`/admin/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!/404|405|method/i.test(message)) throw error;
      return fetchAdmin<Post>(`/admin/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
  },

  deletePost: (id: string) =>
    fetchAdmin<void>(`/admin/posts/${id}`, {
      method: 'DELETE',
    }),
};
