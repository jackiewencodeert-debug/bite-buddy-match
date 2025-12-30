/**
 * IndexedDB Cache for allergen patterns
 * Reduces database queries by caching patterns locally
 */

const DB_NAME = 'bitebuddy-cache';
const DB_VERSION = 1;
const STORE_NAME = 'allergen-patterns';
const CACHE_KEY = 'patterns';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get cached data
 */
export async function getCachedPatterns<T>(): Promise<T | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_TTL) {
          resolve(null);
          return;
        }

        resolve(entry.data as T);
      };

      request.onerror = () => {
        console.error('Cache read error:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCachedPatterns<T>(data: T): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry: CacheEntry = {
        key: CACHE_KEY,
        data,
        timestamp: Date.now()
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Cache write error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available:', error);
  }
}

/**
 * Clear cached patterns (call after feedback processing)
 */
export async function clearCachedPatterns(): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(CACHE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Ignore errors
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Get cache age in minutes
 */
export async function getCacheAge(): Promise<number | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        resolve(Math.round((Date.now() - entry.timestamp) / 60000));
      };

      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
