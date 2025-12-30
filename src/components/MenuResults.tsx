import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { AllergenFeedback } from "./AllergenFeedback";
import { translateItem } from "@/lib/translations";

type DishStatus = "safe" | "caution" | "avoid";
type LangCode = "nl" | "en" | "fr" | "es" | "de" | "it" | "hu" | "id" | "tr" | "vi" | "th" | "uk" | "pt" | "ru" | "hi" | "pl" | "zh" | "ja" | "ko" | "ar";

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
  ingredients: (string | TranslatedItem)[];
  ingredients_translations?: TranslatedItem[];
  allergens?: (string | TranslatedItem)[];
  allergens_translations?: TranslatedItem[];
  dietary_info?: (string | TranslatedItem)[];
  dietary_info_translations?: TranslatedItem[];
  status?: DishStatus;
  foundAllergens?: string[];
  price?: string;
  description?: string;
}

interface MenuResultsProps {
  dishes: Dish[];
  userAllergies?: string[];
  userPreferences?: string[];
  menuStyle?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontStyle?: string;
    backgroundColor?: string;
  };
}

const getStatusEmoji = (status: DishStatus) => {
  switch (status) {
    case "safe":
      return "😊";
    case "caution":
      return "😐";
    case "avoid":
      return "🤢";
  }
};

const getStatusColor = (status: DishStatus) => {
  switch (status) {
    case "safe":
      return "bg-success/10 text-success border-success/20";
    case "caution":
      return "bg-warning/10 text-warning border-warning/20";
    case "avoid":
      return "bg-destructive/10 text-destructive border-destructive/20";
  }
};

export const MenuResults = ({ dishes, userAllergies = [], userPreferences = [], menuStyle }: MenuResultsProps) => {
  const { t, language } = useLanguage();
  const lang = language as LangCode;

  // Get translated dish name with original if different
  const getDishDisplayName = (dish: Dish) => {
    const translations = dish.name_translations;
    if (!translations) return dish.name;
    
    const translatedName = translations[lang];
    if (!translatedName || translatedName.toLowerCase() === dish.name.toLowerCase()) {
      return dish.name;
    }
    return `${dish.name} / ${translatedName}`;
  };

  // Helper to get original value from item (string or TranslatedItem)
  const getOriginal = (item: string | TranslatedItem): string => {
    if (typeof item === "string") return item;
    return item.original || "";
  };

  // Get translated item - supports both string[] and TranslatedItem[]
  const getTranslatedIngredient = (dish: Dish, index: number): string => {
    const item = dish.ingredients[index];
    if (!item) return "";

    // If it's already a TranslatedItem object
    if (typeof item === "object" && item.original) {
      const translated = item[lang];
      if (typeof translated === "string") return translated;
      return translateItem(item.original, lang);
    }

    // Check ingredients_translations array
    const translation = dish.ingredients_translations?.[index];
    if (translation) {
      const translated = translation[lang];
      if (typeof translated === "string") return translated;
      return translateItem(translation.original, lang);
    }

    // Plain string - use fallback dictionary
    return translateItem(String(item), lang);
  };

  const getTranslatedAllergen = (dish: Dish, index: number): string => {
    const item = dish.allergens?.[index];
    if (!item) return "";

    if (typeof item === "object" && item.original) {
      const translated = item[lang];
      if (typeof translated === "string") return translated;
      return translateItem(item.original, lang);
    }

    const translation = dish.allergens_translations?.[index];
    if (translation) {
      const translated = translation[lang];
      if (typeof translated === "string") return translated;
      return translateItem(translation.original, lang);
    }

    return translateItem(String(item), lang);
  };

  const getFontClass = () => {
    if (!menuStyle?.fontStyle) return '';
    const font = menuStyle.fontStyle.toLowerCase();
    if (font.includes('serif')) return 'font-serif';
    if (font.includes('mono')) return 'font-mono';
    return '';
  };

  const customStyle = menuStyle ? {
    '--menu-primary': menuStyle.primaryColor || 'hsl(var(--primary))',
    '--menu-secondary': menuStyle.secondaryColor || 'hsl(var(--secondary))',
    fontFamily: menuStyle.fontStyle || 'inherit',
  } as React.CSSProperties : {};

  const getStatusText = (status: DishStatus) => {
    switch (status) {
      case "safe":
        return t("results.safe");
      case "caution":
        return t("results.adjustable");
      case "avoid":
        return t("results.containsAllergens");
    }
  };

  // Calculate status for each dish based on user allergies
  const dishesWithStatus = dishes.map(dish => {
    if (dish.status) return dish;
    
    // Check if any dish allergens match user allergies
    const foundAllergens = dish.allergens?.filter((allergen, idx) => {
      const originalAllergen = getOriginal(allergen);
      return userAllergies.some(userAllergy => 
        originalAllergen.toLowerCase().includes(userAllergy.toLowerCase()) ||
        userAllergy.toLowerCase().includes(originalAllergen.toLowerCase())
      );
    }).map((allergen) => getOriginal(allergen)) || [];

    let status: DishStatus = "safe";
    if (foundAllergens.length > 0) {
      status = "avoid";
    }

    return { ...dish, status, foundAllergens };
  });

  const statusCounts = dishesWithStatus.reduce((acc, dish) => {
    acc[dish.status!] = (acc[dish.status!] || 0) + 1;
    return acc;
  }, {} as Record<DishStatus, number>);

  return (
    <div className={`max-w-4xl mx-auto ${getFontClass()}`} style={customStyle}>
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
      </div>

      <div className="grid gap-4">
        {dishesWithStatus.map((dish) => (
          <Card
            key={dish.id}
            className="p-6 hover:shadow-hover transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl flex-shrink-0">
                  {getStatusEmoji(dish.status!)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2">{getDishDisplayName(dish)}</h3>
                  {dish.description && (
                    <p className="text-sm text-muted-foreground mb-2">{dish.description}</p>
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
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-muted-foreground mr-1">{t("results.allergens") || "Allergenen"}:</span>
                        {dish.allergens.map((allergen, idx) => {
                          const originalAllergen = getOriginal(allergen);
                          const isMatching = dish.foundAllergens?.some(
                            fa => fa.toLowerCase() === originalAllergen.toLowerCase()
                          );
                          return (
                            <Badge
                              key={`allergen-${idx}`}
                              variant="outline"
                              className={`text-xs ${isMatching ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-warning/10 text-warning border-warning/20'}`}
                            >
                              {getTranslatedAllergen(dish, idx)}
                            </Badge>
                          );
                        })}
                    </div>
                  )}
                  {dish.foundAllergens && dish.foundAllergens.length > 0 && (
                    <p className="text-sm text-destructive font-medium mb-2">
                      {t("results.contains")} {dish.foundAllergens.join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(dish.status!)}>
                      {getStatusText(dish.status!)}
                    </Badge>
                    <AllergenFeedback dish={dish} userAllergies={userAllergies} />
                  </div>
                </div>
              </div>
              {dish.price && (
                <div className="text-lg font-semibold text-muted-foreground flex-shrink-0">
                  {dish.price}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">😊</div>
            <div>
              <div className="font-semibold text-success">{t("results.safe")}</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.safe || 0} {t("results.dishes")}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-warning/5 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">😐</div>
            <div>
              <div className="font-semibold text-warning">{t("results.adjustable")}</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.caution || 0} {t("results.dishes")}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤢</div>
            <div>
              <div className="font-semibold text-destructive">{t("results.containsAllergens")}</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.avoid || 0} {t("results.dishes")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
