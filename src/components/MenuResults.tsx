import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { AllergenFeedback } from "./AllergenFeedback";
import { FavoriteButton } from "./FavoriteButton";
import { ShareResults } from "./ShareResults";
import { IngredientDetail } from "./IngredientDetail";
import { AlternativeSuggestions } from "./AlternativeSuggestions";
import { CrossContaminationWarning } from "./CrossContaminationWarning";
import { SeverityBadge, AllergySeverity } from "./AllergySeveritySelect";
import { translateItem } from "@/lib/translations";
import { translateAllergen, translateIngredient } from "@/data/businessTranslations";
import { AlertTriangle, Skull } from "lucide-react";

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
  menu_id?: string;
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
  cross_contamination_risk?: string[];
  category?: string;
  status?: DishStatus;
  foundAllergens?: string[];
  price?: string;
  description?: string;
}

interface UserAllergyWithSeverity {
  name: string;
  severity: AllergySeverity;
}

interface MenuResultsProps {
  dishes: Dish[];
  userAllergies?: string[];
  userAllergiesWithSeverity?: UserAllergyWithSeverity[];
  userPreferences?: string[];
  menuName?: string;
  menuId?: string;
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

export const MenuResults = ({ 
  dishes, 
  userAllergies = [], 
  userAllergiesWithSeverity = [],
  userPreferences = [], 
  menuName = "Menu",
  menuId,
  menuStyle 
}: MenuResultsProps) => {
  const { t, language } = useLanguage();
  const lang = language as LangCode;

  // Helper to get severity for an allergen
  const getAllergySeverity = (allergen: string): AllergySeverity | null => {
    const match = userAllergiesWithSeverity.find(a => 
      a.name.toLowerCase() === allergen.toLowerCase() ||
      allergen.toLowerCase().includes(a.name.toLowerCase()) ||
      a.name.toLowerCase().includes(allergen.toLowerCase())
    );
    return match?.severity || null;
  };

  // Get highest severity among found allergens
  const getHighestSeverity = (foundAllergens: string[]): AllergySeverity | null => {
    const severities = foundAllergens
      .map(a => getAllergySeverity(a))
      .filter((s): s is AllergySeverity => s !== null);
    
    if (severities.includes("severe")) return "severe";
    if (severities.includes("moderate")) return "moderate";
    if (severities.includes("mild")) return "mild";
    return null;
  };

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
      // Use translateIngredient as fallback
      return translateIngredient(item.original, language);
    }

    // Check ingredients_translations array
    const translation = dish.ingredients_translations?.[index];
    if (translation) {
      const translated = translation[lang];
      if (typeof translated === "string") return translated;
      return translateIngredient(translation.original, language);
    }

    // Plain string - use translateIngredient for better translation
    return translateIngredient(String(item), language);
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
    const foundAllergens = dish.allergens?.filter((allergen) => {
      const originalAllergen = getOriginal(allergen);
      return userAllergies.some(userAllergy => 
        originalAllergen.toLowerCase().includes(userAllergy.toLowerCase()) ||
        userAllergy.toLowerCase().includes(originalAllergen.toLowerCase())
      );
    }).map((allergen) => getOriginal(allergen)) || [];

    // Check cross-contamination risks
    const hasCrossContaminationRisk = dish.cross_contamination_risk?.some(risk =>
      userAllergies.some(allergy => 
        risk.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(risk.toLowerCase())
      )
    );

    let status: DishStatus = "safe";
    if (foundAllergens.length > 0) {
      status = "avoid";
    } else if (hasCrossContaminationRisk) {
      status = "caution";
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
        
        {/* Share button */}
        <div className="mt-4">
          <ShareResults 
            menuName={menuName}
            safeCount={statusCounts.safe || 0}
            cautionCount={statusCounts.caution || 0}
            avoidCount={statusCounts.avoid || 0}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {dishesWithStatus.map((dish) => {
          const highestSeverity = dish.foundAllergens ? getHighestSeverity(dish.foundAllergens) : null;
          const isSevere = highestSeverity === "severe";
          
          return (
          <Card
            key={dish.id}
            className={`p-6 hover:shadow-hover transition-all ${
              isSevere ? 'ring-2 ring-red-500 bg-red-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl flex-shrink-0 relative">
                  {getStatusEmoji(dish.status!)}
                  {isSevere && (
                    <Skull className="absolute -top-1 -right-1 h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{getDishDisplayName(dish)}</h3>
                    {/* Favorite button */}
                    {menuId && (
                      <FavoriteButton 
                        dishId={dish.id} 
                        menuId={dish.menu_id || menuId} 
                        dishName={dish.name}
                      />
                    )}
                  </div>
                  
                  {dish.description && (
                    <p className="text-sm text-muted-foreground mb-2">{dish.description}</p>
                  )}
                  
                  {/* Ingredients with click-to-detail */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dish.ingredients.map((ingredient, idx) => {
                      const originalIngredient = getOriginal(ingredient);
                      const matchedAllergens = dish.foundAllergens?.filter(allergen =>
                        originalIngredient.toLowerCase().includes(allergen.toLowerCase())
                      ) || [];
                      
                      return (
                        <IngredientDetail
                          key={`ingredient-${idx}`}
                          ingredient={getTranslatedIngredient(dish, idx)}
                          matchedAllergens={matchedAllergens}
                          allAllergens={dish.allergens?.map(a => getOriginal(a)) || []}
                          userAllergies={userAllergies}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Allergens */}
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
                  
                  {/* Found allergens warning with severity */}
                  {dish.foundAllergens && dish.foundAllergens.length > 0 && (
                    <div className={`mb-3 p-3 rounded-lg ${isSevere ? 'bg-red-500/10 border border-red-500/30' : 'bg-destructive/10'}`}>
                      {isSevere && (
                        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400 font-bold">
                          <Skull className="h-5 w-5" />
                          <span>{t("results.severeWarning") || "ERNSTIGE ALLERGIE GEDETECTEERD!"}</span>
                        </div>
                      )}
                      <p className={`text-sm font-medium ${isSevere ? 'text-red-600 dark:text-red-400' : 'text-destructive'}`}>
                        {t("results.contains")} {dish.foundAllergens.map(a => {
                          const severity = getAllergySeverity(a);
                          const translatedAllergen = translateAllergen(a, language);
                          return severity ? `${translatedAllergen} (${t(`severity.${severity}`)})` : translatedAllergen;
                        }).join(", ")}
                      </p>
                      {/* Show severity badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dish.foundAllergens.map((allergen, idx) => {
                          const severity = getAllergySeverity(allergen);
                          if (!severity) return null;
                          return (
                            <SeverityBadge key={idx} severity={severity} />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Cross contamination warning */}
                  {dish.cross_contamination_risk && dish.cross_contamination_risk.length > 0 && (
                    <div className="mb-2">
                      <CrossContaminationWarning 
                        risks={dish.cross_contamination_risk}
                        userAllergies={userAllergies}
                      />
                    </div>
                  )}
                  
                  {/* Status and feedback */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(dish.status!)}>
                      {getStatusText(dish.status!)}
                    </Badge>
                    <AllergenFeedback dish={dish} userAllergies={userAllergies} />
                  </div>
                  
                  {/* Alternative suggestions for avoided dishes */}
                  <AlternativeSuggestions 
                    currentDish={dish}
                    allDishes={dishesWithStatus}
                  />
                </div>
              </div>
              {dish.price && (
                <div className="text-lg font-semibold text-muted-foreground flex-shrink-0">
                  {dish.price}
                </div>
              )}
            </div>
          </Card>
        )})}
      </div>

      {/* Summary cards */}
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
