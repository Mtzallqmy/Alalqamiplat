export const SITE_ORIGIN = 'https://moatazalalqami.online';

export function normalizeUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const clean = url.trim();
  if (!clean) return undefined;
  if (clean.startsWith('data:')) return undefined;
  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('/')) return `${SITE_ORIGIN}${clean}`;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `https://${clean}`;
}

export function stripHtml(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeExcerpt(content?: string | null, fallback?: string | null, min = 140, max = 180): string {
  const preferred = stripHtml(fallback);
  if (preferred) return preferred.slice(0, max);

  const plain = stripHtml(content);
  if (!plain) return '';
  if (plain.length <= max) return plain;

  const start = plain.length > min * 2 ? Math.max(0, Math.floor(plain.length / 3) - 30) : 0;
  const slice = plain.slice(start, start + max + 40);
  const end = slice.lastIndexOf(' ', max);
  return `${slice.slice(0, end > min ? end : max).trim()}…`;
}

export function estimateReadingTime(content?: string | null): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function publicPostUrl(slug?: string | null): string {
  return slug ? `${SITE_ORIGIN}/posts/${slug}` : SITE_ORIGIN;
}
