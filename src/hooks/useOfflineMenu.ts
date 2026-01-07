import { useState, useEffect, useCallback } from "react";
import { 
  cacheMenuForOffline, 
  getCachedMenu, 
  cacheMenuTranslations,
  getCachedMenuTranslations,
  cacheDishTranslations,
  isOffline,
  clearExpiredCache
} from "@/services/indexedDBCache";

type Language = "nl" | "en" | "fr" | "es" | "de" | "it" | "hu" | "id" | "tr" | "vi" | "th" | "uk" | "pt" | "ru" | "hi" | "pl" | "zh" | "ja" | "ko" | "ar";

interface Dish {
  id: string;
  name: string;
  name_translations?: Record<string, string>;
  ingredients: string[];
  ingredients_translations?: any[];
  allergens?: string[];
  allergens_translations?: any[];
  [key: string]: any;
}

interface UseOfflineMenuOptions {
  menuId: string;
  language: Language;
}

interface UseOfflineMenuResult {
  isOfflineMode: boolean;
  isCached: boolean;
  cacheMenu: (dishes: Dish[], menuData: any) => Promise<void>;
  getCachedData: () => Promise<{ dishes: Dish[]; menuData: any } | null>;
  getTranslation: (key: string) => Promise<string | null>;
  cacheTranslations: (translations: Record<string, string>) => Promise<void>;
}

export const useOfflineMenu = ({ menuId, language }: UseOfflineMenuOptions): UseOfflineMenuResult => {
  const [isOfflineMode, setIsOfflineMode] = useState(isOffline());
  const [isCached, setIsCached] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up expired cache on mount
    clearExpiredCache();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if menu is cached
  useEffect(() => {
    const checkCache = async () => {
      const cached = await getCachedMenu(menuId);
      setIsCached(!!cached);
    };
    checkCache();
  }, [menuId]);

  // Cache menu data
  const cacheMenu = useCallback(async (dishes: Dish[], menuData: any) => {
    await cacheMenuForOffline(menuId, dishes, menuData);
    
    // Also cache translations for each dish
    for (const dish of dishes) {
      if (dish.name_translations) {
        const translations: Record<string, Record<string, string>> = {};
        
        // Prepare translation data for all languages
        Object.entries(dish.name_translations).forEach(([lang, trans]) => {
          translations[lang] = {
            name: trans as string,
            ...(dish.ingredients_translations?.[0]?.[lang] && {
              ingredients: JSON.stringify(dish.ingredients_translations.map((it: any) => it[lang]))
            }),
            ...(dish.allergens_translations?.[0]?.[lang] && {
              allergens: JSON.stringify(dish.allergens_translations.map((at: any) => at[lang]))
            })
          };
        });
        
        await cacheDishTranslations(dish.id, translations);
      }
    }
    
    setIsCached(true);
  }, [menuId]);

  // Get cached data
  const getCachedData = useCallback(async () => {
    return getCachedMenu(menuId);
  }, [menuId]);

  // Get translation from cache
  const getTranslation = useCallback(async (key: string) => {
    const translations = await getCachedMenuTranslations(menuId, language);
    return translations?.[key] || null;
  }, [menuId, language]);

  // Cache translations
  const cacheTranslations = useCallback(async (translations: Record<string, string>) => {
    await cacheMenuTranslations(menuId, language, translations);
  }, [menuId, language]);

  return {
    isOfflineMode,
    isCached,
    cacheMenu,
    getCachedData,
    getTranslation,
    cacheTranslations
  };
};
