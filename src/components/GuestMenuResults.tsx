import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { AllergenFeedback } from "./AllergenFeedback";

interface TranslatedItem {
  original: string;
  nl?: string;
  en?: string;
  fr?: string;
  es?: string;
  de?: string;
  it?: string;
  hu?: string;
  id?: string;
  tr?: string;
  vi?: string;
  th?: string;
  uk?: string;
  pt?: string;
  ru?: string;
  hi?: string;
  pl?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  ar?: string;
}

interface Dish {
  id: string;
  name: string;
  name_translations?: {
    nl?: string;
    en?: string;
    fr?: string;
    es?: string;
    de?: string;
    it?: string;
    hu?: string;
    id?: string;
    tr?: string;
    vi?: string;
    th?: string;
    uk?: string;
    pt?: string;
    ru?: string;
    hi?: string;
    pl?: string;
    zh?: string;
    ja?: string;
    ko?: string;
    ar?: string;
  };
  ingredients: string[];
  ingredients_translations?: TranslatedItem[];
  allergens?: string[];
  allergens_translations?: TranslatedItem[];
  dietary_info?: string[];
  dietary_info_translations?: TranslatedItem[];
  price?: string;
  description?: string;
  category?: string;
}

interface GuestMenuResultsProps {
  dishes: Dish[];
  menuStyle?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontStyle?: string;
    backgroundColor?: string;
  };
  categories?: string[];
}

export const GuestMenuResults = ({ dishes, menuStyle, categories }: GuestMenuResultsProps) => {
  const { t, language } = useLanguage();

  // Get translated dish name with original if different
  const getDishDisplayName = (dish: Dish) => {
    const translations = dish.name_translations;
    if (!translations) return dish.name;
    
    const translatedName = translations[language as keyof typeof translations];
    if (!translatedName || translatedName.toLowerCase() === dish.name.toLowerCase()) {
      return dish.name;
    }
    return `${dish.name} / ${translatedName}`;
  };

  // Get translated item from translations array by index, or fallback to original string
  const getTranslatedIngredient = (dish: Dish, index: number): string => {
    const translation = dish.ingredients_translations?.[index];
    if (translation) {
      const translated = translation[language as keyof TranslatedItem];
      if (typeof translated === 'string') return translated;
      return translation.original;
    }
    return dish.ingredients[index] || '';
  };

  const getTranslatedAllergen = (dish: Dish, index: number): string => {
    const translation = dish.allergens_translations?.[index];
    if (translation) {
      const translated = translation[language as keyof TranslatedItem];
      if (typeof translated === 'string') return translated;
      return translation.original;
    }
    return dish.allergens?.[index] || '';
  };

  const getTranslatedDietaryInfo = (dish: Dish, index: number): string => {
    const translation = dish.dietary_info_translations?.[index];
    if (translation) {
      const translated = translation[language as keyof TranslatedItem];
      if (typeof translated === 'string') return translated;
      return translation.original;
    }
    return dish.dietary_info?.[index] || '';
  };

  // Group dishes by category if categories exist
  const groupedDishes = categories && categories.length > 0
    ? categories.map(category => ({
        category,
        dishes: dishes.filter(dish => dish.category?.toLowerCase() === category.toLowerCase())
      })).filter(group => group.dishes.length > 0)
    : [{ category: null, dishes }];

  // Apply menu styling if available
  const customStyle = menuStyle ? {
    '--menu-primary': menuStyle.primaryColor || 'hsl(var(--primary))',
    '--menu-secondary': menuStyle.secondaryColor || 'hsl(var(--secondary))',
    '--menu-bg': menuStyle.backgroundColor || 'transparent',
    fontFamily: menuStyle.fontStyle || 'inherit',
  } as React.CSSProperties : {};

  const getFontClass = () => {
    if (!menuStyle?.fontStyle) return '';
    const font = menuStyle.fontStyle.toLowerCase();
    if (font.includes('serif')) return 'font-serif';
    if (font.includes('mono')) return 'font-mono';
    return '';
  };

  return (
    <div 
      className={`max-w-4xl mx-auto ${getFontClass()}`} 
      style={customStyle}
    >
      <div className="text-center mb-8">
        <h2 
          className="text-3xl font-bold mb-2"
          style={{ color: menuStyle?.primaryColor }}
        >
          {t("results.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("results.found").replace("{count}", String(dishes.length))}
        </p>
        <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg">
          💡 {t("results.guestHint") || "Log in om te zien welke gerechten bij jouw allergieën passen"}
        </p>
      </div>

      {groupedDishes.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          {group.category && (
            <h3 
              className="text-xl font-semibold mb-4 border-b border-border pb-2"
              style={{ color: menuStyle?.primaryColor || 'hsl(var(--primary))' }}
            >
              {group.category}
            </h3>
          )}
          <div className="grid gap-4">
            {group.dishes.map((dish) => (
              <Card
                key={dish.id}
                className="p-6 hover:shadow-hover transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{getDishDisplayName(dish)}</h3>
                      {dish.dietary_info && dish.dietary_info.length > 0 && (
                        <div className="flex gap-1">
                          {dish.dietary_info
                            .map((_, idx) => ({ info: getTranslatedDietaryInfo(dish, idx), idx }))
                            .filter(({ info }) => {
                              const infoStr = info.toLowerCase();
                              const hasVegan = dish.dietary_info?.some((_, i) => 
                                getTranslatedDietaryInfo(dish, i).toLowerCase().includes('vegan')
                              );
                              return !infoStr.includes('vegetar') || !hasVegan;
                            })
                            .map(({ info, idx }) => (
                              <Badge
                                key={`diet-${idx}`}
                                variant="outline"
                                className="text-xs bg-success/10 text-success border-success/20"
                              >
                                {info}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    {dish.description && (
                      <p className="text-sm text-muted-foreground mb-3">{dish.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {dish.ingredients.map((_, idx) => (
                        <Badge
                          key={`ingredient-${idx}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {getTranslatedIngredient(dish, idx)}
                        </Badge>
                      ))}
                    </div>
                    {dish.allergens && dish.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-1">{t("results.allergens") || "Allergenen"}:</span>
                        {dish.allergens.map((_, idx) => (
                          <Badge
                            key={`allergen-${idx}`}
                            variant="outline"
                            className="text-xs bg-destructive/20 text-destructive border-destructive/30"
                          >
                            {getTranslatedAllergen(dish, idx)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      <AllergenFeedback dish={dish} />
                    </div>
                  </div>
                  {dish.price && (
                    <div 
                      className="text-lg font-semibold flex-shrink-0"
                      style={{ color: menuStyle?.primaryColor || 'hsl(var(--primary))' }}
                    >
                      {dish.price}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
