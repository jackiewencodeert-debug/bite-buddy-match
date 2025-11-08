import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DishStatus = "safe" | "caution" | "avoid";

interface Dish {
  id: string;
  name: string;
  ingredients: string[];
  allergens?: string[];
  dietary_info?: string[];
  status?: DishStatus;
  foundAllergens?: string[];
  price?: string;
  description?: string;
}

interface MenuResultsProps {
  dishes: Dish[];
  userAllergies?: string[];
  userPreferences?: string[];
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

const getStatusText = (status: DishStatus) => {
  switch (status) {
    case "safe":
      return "Veilig";
    case "caution":
      return "Let op";
    case "avoid":
      return "Vermijd";
  }
};

export const MenuResults = ({ dishes, userAllergies = [], userPreferences = [] }: MenuResultsProps) => {
  // Calculate status for each dish based on user allergies
  const dishesWithStatus = dishes.map(dish => {
    if (dish.status) return dish;
    
    // Check if any dish allergens match user allergies
    const foundAllergens = dish.allergens?.filter(allergen => 
      userAllergies.some(userAllergy => 
        allergen.toLowerCase().includes(userAllergy.toLowerCase()) ||
        userAllergy.toLowerCase().includes(allergen.toLowerCase())
      )
    ) || [];

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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Menu Resultaten</h2>
        <p className="text-muted-foreground">
          {dishes.length} gerechten gevonden - Gebaseerd op jouw voorkeuren en allergieën
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
                  <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                  {dish.description && (
                    <p className="text-sm text-muted-foreground mb-2">{dish.description}</p>
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
                  {dish.foundAllergens && dish.foundAllergens.length > 0 && (
                    <p className="text-sm text-destructive font-medium mb-2">
                      ⚠️ Bevat: {dish.foundAllergens.join(", ")}
                    </p>
                  )}
                  <Badge className={getStatusColor(dish.status!)}>
                    {getStatusText(dish.status!)}
                  </Badge>
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
              <div className="font-semibold text-success">Veilig</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.safe || 0} gerechten
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-warning/5 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">😐</div>
            <div>
              <div className="font-semibold text-warning">Let op</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.caution || 0} gerechten
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤢</div>
            <div>
              <div className="font-semibold text-destructive">Vermijd</div>
              <div className="text-sm text-muted-foreground">
                {statusCounts.avoid || 0} gerechten
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
