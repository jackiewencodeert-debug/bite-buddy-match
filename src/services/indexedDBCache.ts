/**
 * IndexedDB Cache for allergen patterns and translations
 * Enables offline functionality by caching data locally
 */

const DB_NAME = 'bitebuddy-cache';
const DB_VERSION = 2;
const PATTERNS_STORE = 'allergen-patterns';
const TRANSLATIONS_STORE = 'translations';
const MENUS_STORE = 'cached-menus';
const CACHE_KEY = 'patterns';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour for patterns
const TRANSLATION_TTL = 24 * 60 * 60 * 1000; // 24 hours for translations
const MENU_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for menus

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

interface TranslationEntry {
  key: string; // Format: "menuId:language" or "dish:dishId:language"
  translations: Record<string, string>;
  timestamp: number;
}

interface CachedMenu {
  menuId: string;
  dishes: any[];
  menuData: any;
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
      
      // Create stores if they don't exist
      if (!database.objectStoreNames.contains(PATTERNS_STORE)) {
        database.createObjectStore(PATTERNS_STORE, { keyPath: 'key' });
      }
      
      if (!database.objectStoreNames.contains(TRANSLATIONS_STORE)) {
        const translationStore = database.createObjectStore(TRANSLATIONS_STORE, { keyPath: 'key' });
        translationStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!database.objectStoreNames.contains(MENUS_STORE)) {
        const menuStore = database.createObjectStore(MENUS_STORE, { keyPath: 'menuId' });
        menuStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// ==================== PATTERNS CACHE ====================

/**
 * Get cached patterns
 */
export async function getCachedPatterns<T>(): Promise<T | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(PATTERNS_STORE, 'readonly');
      const store = transaction.objectStore(PATTERNS_STORE);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

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
 * Set cached patterns
 */
export async function setCachedPatterns<T>(data: T): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(PATTERNS_STORE, 'readwrite');
      const store = transaction.objectStore(PATTERNS_STORE);
      
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
 * Clear cached patterns
 */
export async function clearCachedPatterns(): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(PATTERNS_STORE, 'readwrite');
      const store = transaction.objectStore(PATTERNS_STORE);
      const request = store.delete(CACHE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
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
      const transaction = database.transaction(PATTERNS_STORE, 'readonly');
      const store = transaction.objectStore(PATTERNS_STORE);
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

// ==================== TRANSLATIONS CACHE ====================

/**
 * Cache translations for a specific menu and language
 */
export async function cacheMenuTranslations(
  menuId: string, 
  language: string, 
  translations: Record<string, string>
): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(TRANSLATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(TRANSLATIONS_STORE);
      
      const entry: TranslationEntry = {
        key: `menu:${menuId}:${language}`,
        translations,
        timestamp: Date.now()
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Translation cache error:', error);
  }
}

/**
 * Get cached translations for a menu
 */
export async function getCachedMenuTranslations(
  menuId: string, 
  language: string
): Promise<Record<string, string> | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(TRANSLATIONS_STORE, 'readonly');
      const store = transaction.objectStore(TRANSLATIONS_STORE);
      const request = store.get(`menu:${menuId}:${language}`);

      request.onsuccess = () => {
        const entry = request.result as TranslationEntry | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > TRANSLATION_TTL) {
          resolve(null);
          return;
        }

        resolve(entry.translations);
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Translation cache read error:', error);
    return null;
  }
}

/**
 * Cache dish translations for all languages at once
 */
export async function cacheDishTranslations(
  dishId: string,
  translations: Record<string, Record<string, string>>
): Promise<void> {
  try {
    const database = await openDB();
    
    const transaction = database.transaction(TRANSLATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(TRANSLATIONS_STORE);
    
    const promises = Object.entries(translations).map(([lang, trans]) => {
      return new Promise<void>((resolve, reject) => {
        const entry: TranslationEntry = {
          key: `dish:${dishId}:${lang}`,
          translations: trans,
          timestamp: Date.now()
        };
        
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Dish translation cache error:', error);
  }
}

/**
 * Get cached dish translations
 */
export async function getCachedDishTranslations(
  dishId: string, 
  language: string
): Promise<Record<string, string> | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(TRANSLATIONS_STORE, 'readonly');
      const store = transaction.objectStore(TRANSLATIONS_STORE);
      const request = store.get(`dish:${dishId}:${language}`);

      request.onsuccess = () => {
        const entry = request.result as TranslationEntry | undefined;
        
        if (!entry || Date.now() - entry.timestamp > TRANSLATION_TTL) {
          resolve(null);
          return;
        }

        resolve(entry.translations);
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    return null;
  }
}

// ==================== MENU CACHE ====================

/**
 * Cache complete menu data for offline use
 */
export async function cacheMenuForOffline(
  menuId: string,
  dishes: any[],
  menuData: any
): Promise<void> {
  try {
    const database = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(MENUS_STORE, 'readwrite');
      const store = transaction.objectStore(MENUS_STORE);
      
      const entry: CachedMenu = {
        menuId,
        dishes,
        menuData,
        timestamp: Date.now()
      };

      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`Menu ${menuId} cached for offline use`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Menu cache error:', error);
  }
}

/**
 * Get cached menu for offline use
 */
export async function getCachedMenu(menuId: string): Promise<{ dishes: any[]; menuData: any } | null> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(MENUS_STORE, 'readonly');
      const store = transaction.objectStore(MENUS_STORE);
      const request = store.get(menuId);

      request.onsuccess = () => {
        const entry = request.result as CachedMenu | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > MENU_TTL) {
          resolve(null);
          return;
        }

        resolve({
          dishes: entry.dishes,
          menuData: entry.menuData
        });
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Menu cache read error:', error);
    return null;
  }
}

/**
 * Get all cached menu IDs
 */
export async function getAllCachedMenuIds(): Promise<string[]> {
  try {
    const database = await openDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(MENUS_STORE, 'readonly');
      const store = transaction.objectStore(MENUS_STORE);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => resolve([]);
    });
  } catch (error) {
    return [];
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const database = await openDB();
    const now = Date.now();
    
    // Clear expired translations
    const translationTransaction = database.transaction(TRANSLATIONS_STORE, 'readwrite');
    const translationStore = translationTransaction.objectStore(TRANSLATIONS_STORE);
    const translationCursor = translationStore.openCursor();
    
    translationCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const entry = cursor.value as TranslationEntry;
        if (now - entry.timestamp > TRANSLATION_TTL) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    // Clear expired menus
    const menuTransaction = database.transaction(MENUS_STORE, 'readwrite');
    const menuStore = menuTransaction.objectStore(MENUS_STORE);
    const menuCursor = menuStore.openCursor();
    
    menuCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const entry = cursor.value as CachedMenu;
        if (now - entry.timestamp > MENU_TTL) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Clear expired cache error:', error);
  }
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Get total cache size estimate
 */
export async function getCacheStats(): Promise<{ 
  menusCount: number; 
  translationsCount: number;
  estimatedSize: string;
}> {
  try {
    const database = await openDB();
    
    const menuCount = await new Promise<number>((resolve) => {
      const transaction = database.transaction(MENUS_STORE, 'readonly');
      const store = transaction.objectStore(MENUS_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    const translationCount = await new Promise<number>((resolve) => {
      const transaction = database.transaction(TRANSLATIONS_STORE, 'readonly');
      const store = transaction.objectStore(TRANSLATIONS_STORE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    // Estimate storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
      return {
        menusCount: menuCount,
        translationsCount: translationCount,
        estimatedSize: `${usedMB} MB`
      };
    }

    return {
      menusCount: menuCount,
      translationsCount: translationCount,
      estimatedSize: 'Unknown'
    };
  } catch (error) {
    return {
      menusCount: 0,
      translationsCount: 0,
      estimatedSize: 'Unknown'
    };
  }
}
