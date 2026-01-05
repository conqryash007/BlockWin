// Image Cache Utility
// Uses localStorage for caching TheSportsDB images
// TTL: 30 days

const CACHE_PREFIX = 'sportsdb_img_';
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get cached image data
 */
export function getCachedImage<T = unknown>(key: string): T | null {
  if (!isBrowser()) return null;
  
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const stored = localStorage.getItem(cacheKey);
    
    if (!stored) return null;
    
    const entry: CacheEntry<T> = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('[ImageCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Set cached image data
 */
export function setCachedImage<T = unknown>(key: string, data: T): void {
  if (!isBrowser()) return;
  
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + TTL_MS,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[ImageCache] Storage quota exceeded, clearing old entries');
      clearExpiredCache();
      // Try again
      try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const now = Date.now();
        const entry: CacheEntry<T> = {
          data,
          timestamp: now,
          expiresAt: now + TTL_MS,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        console.warn('[ImageCache] Failed to cache after cleanup');
      }
    } else {
      console.warn('[ImageCache] Error setting cache:', error);
    }
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  if (!isBrowser()) return 0;
  
  let clearedCount = 0;
  const now = Date.now();
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        
        const entry: CacheEntry = JSON.parse(stored);
        if (now > entry.expiresAt) {
          keysToRemove.push(key);
        }
      } catch {
        // Invalid entry, remove it
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  } catch (error) {
    console.warn('[ImageCache] Error clearing cache:', error);
  }
  
  return clearedCount;
}

/**
 * Clear all cached images
 */
export function clearAllCache(): number {
  if (!isBrowser()) return 0;
  
  let clearedCount = 0;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  } catch (error) {
    console.warn('[ImageCache] Error clearing all cache:', error);
  }
  
  return clearedCount;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  expiredEntries: number;
  totalSizeBytes: number;
} {
  if (!isBrowser()) {
    return { totalEntries: 0, expiredEntries: 0, totalSizeBytes: 0 };
  }
  
  let totalEntries = 0;
  let expiredEntries = 0;
  let totalSizeBytes = 0;
  const now = Date.now();
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      
      totalEntries++;
      const stored = localStorage.getItem(key);
      if (stored) {
        totalSizeBytes += stored.length * 2; // UTF-16 characters
        try {
          const entry: CacheEntry = JSON.parse(stored);
          if (now > entry.expiresAt) {
            expiredEntries++;
          }
        } catch {
          expiredEntries++;
        }
      }
    }
  } catch (error) {
    console.warn('[ImageCache] Error getting stats:', error);
  }
  
  return { totalEntries, expiredEntries, totalSizeBytes };
}
