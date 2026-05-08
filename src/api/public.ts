import AsyncStorage from '@react-native-async-storage/async-storage';
import { estimateReadingTime, makeExcerpt, normalizeUrl, SITE_ORIGIN } from '@/src/utils/content';

export const SITE_BASE = SITE_ORIGIN;
const API_BASE = `${SITE_BASE}/api/public`;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function getCachedData<T>(key: string, allowExpired = false): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    const entry: CacheEntry<T> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired && !allowExpired) return null;
    return entry.data;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
}

async function fetchWithCache<T>(endpoint: string, cacheKey: string, options?: RequestInit): Promise<T> {
  const cached = await getCachedData<T>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || data?.message || `API Error: ${response.status}`);
    }

    const result = data?.data ?? data;
    await setCachedData(cacheKey, result);
    return result as T;
  } catch (error) {
    const stale = await getCachedData<T>(cacheKey, true);
    if (stale) return stale;
    throw error;
  }
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  publishedAt?: string;
  readingTime?: number;
  views?: number;
  author?: Author;
  category?: Category;
  status?: string;
}

export interface Settings {
  logo?: string;
  primaryColor?: string;
  email?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  privacyUrl?: string;
  siteName?: string;
  siteDescription?: string;
  about?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function hydratePost(post: Post): Post {
  const avatar = normalizeUrl(post.author?.avatar || post.author?.image);
  return {
    ...post,
    title: post.title || 'بدون عنوان',
    content: post.content || '',
    coverImage: normalizeUrl(post.coverImage),
    excerpt: makeExcerpt(post.content, post.excerpt),
    readingTime: post.readingTime || estimateReadingTime(post.content || post.excerpt),
    author: post.author
      ? {
          ...post.author,
          avatar,
          image: avatar,
          name: post.author.name || 'معتز العلقمي',
        }
      : { id: 'default', name: 'معتز العلقمي', avatar: undefined },
  };
}

function normalizePagination<T extends Post>(result: PaginatedResponse<T> | T[]): PaginatedResponse<Post> {
  if (Array.isArray(result)) return { items: result.map(hydratePost) };
  return { items: (result.items ?? []).map(hydratePost), pagination: result.pagination };
}

export async function getPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> {
  const cacheKey = `posts_page_${page}_${limit}`;
  const result = await fetchWithCache<PaginatedResponse<Post> | Post[]>(`/posts?page=${page}&limit=${limit}`, cacheKey);
  const normalized = normalizePagination(result);
  if (page === 1) await setCachedData('offline_latest_posts', normalized.items.slice(0, 20));
  return normalized;
}

export async function getOfflineLatestPosts(): Promise<Post[]> {
  return (await getCachedData<Post[]>('offline_latest_posts', true)) ?? [];
}

export async function getPostBySlug(slug: string): Promise<{ post: Post; related: Post[] }> {
  const cacheKey = `post_${slug}`;
  const result = await fetchWithCache<{ post: Post; related?: Post[] } | Post>(`/posts/${slug}`, cacheKey);
  if ('post' in result) return { post: hydratePost(result.post), related: (result.related ?? []).map(hydratePost) };
  return { post: hydratePost(result), related: [] };
}

export async function getCategories(): Promise<Category[]> {
  const result = await fetchWithCache<Category[] | { items: Category[] }>('/categories', 'categories');
  return Array.isArray(result) ? result : result.items ?? [];
}

export async function getPostsByCategory(
  categorySlug: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Post>> {
  const cacheKey = `category_${categorySlug}_page_${page}_${limit}`;
  const result = await fetchWithCache<PaginatedResponse<Post> | Post[]>(
    `/posts?category=${encodeURIComponent(categorySlug)}&page=${page}&limit=${limit}`,
    cacheKey,
  );
  return normalizePagination(result);
}

export async function searchPosts(query: string): Promise<PaginatedResponse<Post>> {
  const cacheKey = `search_${query}`;
  const result = await fetchWithCache<PaginatedResponse<Post> | Post[]>(`/search?q=${encodeURIComponent(query)}`, cacheKey);
  return normalizePagination(result);
}

export async function getSettings(): Promise<Settings> {
  const settings = await fetchWithCache<Settings>('/settings', 'settings');
  const logo = normalizeUrl(settings?.logo);
  return {
    siteName: 'معتز العلقمي',
    siteDescription: 'مقالات وقصص وإلهام',
    website: SITE_BASE,
    privacyUrl: `${SITE_BASE}/privacy`,
    email: 'moataz775498320@gmail.com',
    facebook: 'https://www.facebook.com/moataz77549',
    instagram: 'https://www.instagram.com/Moataz77549',
    twitter: 'https://x.com/Moataz77549',
    about:
      'منصة معتز العلقمي، كاتب وصيدلاني يمني، مهتم بالمحتوى الصيدلاني، والتقني والثقافي المتنوع، وهذه أحد مساحاتي وأماكني التي بدأت بممارسة شغفي فيها.',
    ...settings,
    logo,
  };
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      key =>
        key.startsWith('posts_') ||
        key.startsWith('post_') ||
        key.startsWith('category_') ||
        key.startsWith('search_') ||
        key === 'categories' ||
        key === 'settings' ||
        key === 'offline_latest_posts',
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
