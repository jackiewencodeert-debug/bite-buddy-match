import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DishStatus = "safe" | "caution" | "avoid";

interface Dish {
  id: number;
  name: string;
  ingredients: string[];
  status: DishStatus;
  price: string;
}

const mockDishes: Dish[] = [
  {
    id: 1,
    name: "Gegrilde Kip Salade",
    ingredients: ["kip", "sla", "tomaat", "komkommer"],
    status: "safe",
    price: "€12,50",
  },
  {
    id: 2,
    name: "Pizza Margherita",
    ingredients: ["kaas", "tomaat", "basilicum"],
    status: "caution",
    price: "€10,00",
  },
  {
    id: 3,
    name: "Pasta Carbonara",
    ingredients: ["pasta", "room", "spek", "ei"],
    status: "avoid",
    price: "€13,50",
  },
  {
    id: 4,
    name: "Groente Wrap",
    ingredients: ["wrap", "groenten", "hummus"],
    status: "safe",
    price: "€9,50",
  },
  {
    id: 5,
    name: "Caesar Salade",
    ingredients: ["sla", "kip", "kaas", "croutons"],
    status: "caution",
    price: "€11,00",
  },
];

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

export const MenuResults = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Menu Resultaten</h2>
        <p className="text-muted-foreground">
          Gebaseerd op je allergieën en voorkeuren
        </p>
      </div>

      <div className="grid gap-4">
        {mockDishes.map((dish) => (
          <Card
            key={dish.id}
            className="p-6 hover:shadow-hover transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl flex-shrink-0">
                  {getStatusEmoji(dish.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dish.ingredients.map((ingredient) => (
                      <Badge
                        key={ingredient}
                        variant="secondary"
                        className="text-xs"
                      >
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                  <Badge className={getStatusColor(dish.status)}>
                    {getStatusText(dish.status)}
                  </Badge>
                </div>
              </div>
              <div className="text-lg font-semibold text-muted-foreground flex-shrink-0">
                {dish.price}
              </div>
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
                {mockDishes.filter((d) => d.status === "safe").length} gerechten
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
                {mockDishes.filter((d) => d.status === "caution").length} gerechten
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
                {mockDishes.filter((d) => d.status === "avoid").length} gerechten
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
