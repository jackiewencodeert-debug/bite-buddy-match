import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, X, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Dish {
  id?: string;
  name: string;
  description: string;
  price: string;
  ingredients: string[];
  allergens: string[];
  dietary_info: string[];
}

const commonAllergens = [
  "noten", "gluten", "lactose", "schaaldieren", "vis", 
  "eieren", "soja", "sulfiet", "pinda's", "sesam"
];

const MenuEditor = () => {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [newDish, setNewDish] = useState<Dish>({
    name: "",
    description: "",
    price: "",
    ingredients: [],
    allergens: [],
    dietary_info: []
  });
  const [newIngredient, setNewIngredient] = useState("");
  const [businessAllergens, setBusinessAllergens] = useState<string[]>([]);

  useEffect(() => {
    loadMenuAndDishes();
    loadBusinessProfile();
  }, [menuId]);

  const loadBusinessProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_allergen_warnings")
        .eq("id", user.id)
        .single();

      if (profile?.business_allergen_warnings) {
        setBusinessAllergens(profile.business_allergen_warnings);
      }
    } catch (error) {
      console.error("Error loading business profile:", error);
    }
  };

  const loadMenuAndDishes = async () => {
    try {
      const { data: dishesData } = await supabase
        .from("dishes")
        .select("*")
        .eq("menu_id", menuId);

      if (dishesData) {
        setDishes(dishesData);
      }
    } catch (error: any) {
      toast({
        title: "Fout bij laden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setNewDish({
        ...newDish,
        ingredients: [...newDish.ingredients, newIngredient.trim()]
      });
      setNewIngredient("");
    }
  };

  const removeIngredient = (index: number) => {
    setNewDish({
      ...newDish,
      ingredients: newDish.ingredients.filter((_, i) => i !== index)
    });
  };

  const toggleAllergen = (allergen: string) => {
    setNewDish({
      ...newDish,
      allergens: newDish.allergens.includes(allergen)
        ? newDish.allergens.filter(a => a !== allergen)
        : [...newDish.allergens, allergen]
    });
  };

  const addDish = async () => {
    if (!newDish.name || newDish.ingredients.length === 0) {
      toast({
        title: "Onvolledig",
        description: "Vul minimaal een naam en ingrediënten in",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Add business-wide allergens to this dish
      const allAllergens = [...new Set([...newDish.allergens, ...businessAllergens])];

      const { error } = await supabase.from("dishes").insert({
        menu_id: menuId,
        name: newDish.name,
        description: newDish.description,
        price: newDish.price,
        ingredients: newDish.ingredients,
        allergens: allAllergens,
        dietary_info: newDish.dietary_info
      });

      if (error) throw error;

      toast({
        title: "Gerecht toegevoegd!",
        description: `${newDish.name} is toegevoegd aan het menu`,
      });

      // Reset form
      setNewDish({
        name: "",
        description: "",
        price: "",
        ingredients: [],
        allergens: [],
        dietary_info: []
      });

      loadMenuAndDishes();
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const finishEditing = async () => {
    navigate("/business");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar Dashboard
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Menu Bewerken</h1>
          <p className="text-muted-foreground">
            Voeg gerechten toe en specificeer ingrediënten en allergenen
          </p>
        </div>

        {businessAllergens.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">⚠️ Standaard Allergenen</CardTitle>
              <CardDescription>
                Deze allergenen worden automatisch aan alle gerechten toegevoegd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {businessAllergens.map((allergen) => (
                  <Badge key={allergen} variant="destructive">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nieuw Gerecht Toevoegen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Naam Gerecht *</Label>
                <Input
                  placeholder="Bijv. Caesar Salade"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prijs</Label>
                <Input
                  placeholder="€12,50"
                  value={newDish.price}
                  onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschrijving</Label>
              <Textarea
                placeholder="Korte beschrijving van het gerecht"
                value={newDish.description}
                onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ingrediënten *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Voeg ingrediënt toe"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                />
                <Button type="button" onClick={addIngredient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newDish.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newDish.ingredients.map((ing, index) => (
                    <Badge key={index} variant="secondary">
                      {ing}
                      <button
                        onClick={() => removeIngredient(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Extra Allergenen (naast standaard)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonAllergens.map((allergen) => (
                  <div key={allergen} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${allergen}`}
                      checked={newDish.allergens.includes(allergen)}
                      onCheckedChange={() => toggleAllergen(allergen)}
                      disabled={businessAllergens.includes(allergen)}
                    />
                    <Label htmlFor={`allergen-${allergen}`} className="cursor-pointer">
                      {allergen}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={addDish} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Gerecht Toevoegen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {dishes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Toegevoegde Gerechten ({dishes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dishes.map((dish) => (
                <div key={dish.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{dish.name}</h3>
                      {dish.description && (
                        <p className="text-sm text-muted-foreground mt-1">{dish.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dish.ingredients.map((ing, i) => (
                          <Badge key={i} variant="outline">
                            {ing}
                          </Badge>
                        ))}
                      </div>
                      {dish.allergens && dish.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {dish.allergens.map((allergen, i) => (
                            <Badge key={i} variant="destructive">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {dish.price && (
                      <span className="font-semibold text-muted-foreground ml-4">
                        {dish.price}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button onClick={finishEditing} size="lg" className="w-full">
          <Save className="mr-2 h-5 w-5" />
          Klaar met Bewerken
        </Button>
      </div>
    </div>
  );
};

export default MenuEditor;