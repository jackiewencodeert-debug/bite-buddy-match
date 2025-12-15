import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface Dish {
  id: string;
  name: string;
  ingredients: string[];
  allergens?: string[];
  dietary_info?: string[];
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
  };
  categories?: string[];
}

export const GuestMenuResults = ({ dishes, menuStyle, categories }: GuestMenuResultsProps) => {
  const { t } = useLanguage();

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
  } as React.CSSProperties : {};

  return (
    <div className="max-w-4xl mx-auto" style={customStyle}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{t("results.title")}</h2>
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
            <h3 className="text-xl font-semibold mb-4 text-primary border-b border-border pb-2">
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
                      <h3 className="text-xl font-semibold">{dish.name}</h3>
                      {dish.dietary_info && dish.dietary_info.length > 0 && (
                        <div className="flex gap-1">
                          {dish.dietary_info
                            .filter(info => info.toLowerCase() !== "vegetarisch" || !dish.dietary_info?.some(d => d.toLowerCase() === "veganistisch"))
                            .map((info, idx) => (
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
                      {dish.ingredients.map((ingredient, idx) => (
                        <Badge
                          key={`${ingredient}-${idx}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                    {dish.allergens && dish.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Allergenen:</span>
                        {dish.allergens.map((allergen, idx) => (
                          <Badge
                            key={`allergen-${idx}`}
                            variant="outline"
                            className="text-xs bg-warning/10 text-warning border-warning/20"
                          >
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {dish.price && (
                    <div className="text-lg font-semibold text-primary flex-shrink-0">
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
