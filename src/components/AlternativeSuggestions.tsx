import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface Dish {
  id: string;
  name: string;
  status?: "safe" | "caution" | "avoid";
  category?: string;
  price?: string;
}

interface AlternativeSuggestionsProps {
  currentDish: Dish;
  allDishes: Dish[];
  maxSuggestions?: number;
}

export const AlternativeSuggestions = ({ 
  currentDish, 
  allDishes, 
  maxSuggestions = 3 
}: AlternativeSuggestionsProps) => {
  const { t } = useLanguage();

  // Only show alternatives for dishes that should be avoided
  if (currentDish.status !== "avoid") {
    return null;
  }

  // Find safe alternatives
  const alternatives = allDishes
    .filter(dish => {
      // Must be safe or caution (not avoid)
      if (dish.status === "avoid" || dish.id === currentDish.id) return false;
      
      // Prioritize same category if available
      if (currentDish.category && dish.category) {
        return dish.category === currentDish.category;
      }
      
      return true;
    })
    .slice(0, maxSuggestions);

  // If no category matches, get any safe dishes
  const finalAlternatives = alternatives.length > 0 
    ? alternatives 
    : allDishes
        .filter(dish => dish.status === "safe" && dish.id !== currentDish.id)
        .slice(0, maxSuggestions);

  if (finalAlternatives.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-success/5 border border-success/20">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-success">
          {t("alternatives.title")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {finalAlternatives.map((dish) => (
          <Badge 
            key={dish.id} 
            variant="outline" 
            className="bg-success/10 text-success border-success/30 cursor-pointer hover:bg-success/20 transition-colors"
          >
            {dish.name}
            {dish.price && <span className="ml-1 text-xs opacity-70">({dish.price})</span>}
          </Badge>
        ))}
      </div>
    </div>
  );
};
