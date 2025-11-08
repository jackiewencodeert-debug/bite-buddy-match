import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Badge } from "@/components/ui/badge";

const MenuView = () => {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userCustomAllergies, setUserCustomAllergies] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [matchResults, setMatchResults] = useState<any>(null);

  useEffect(() => {
    loadMenuAndUser();
  }, [qrCode]);

  const loadMenuAndUser = async () => {
    try {
      // Load menu
      const { data: menuData } = await supabase
        .from("menus")
        .select("*")
        .eq("qr_code", qrCode)
        .single();

      if (!menuData) {
        toast({
          title: "Menu niet gevonden",
          description: "Deze QR-code is niet geldig.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setMenu(menuData);

      // Load dishes for this menu
      const { data: dishesData } = await supabase
        .from("dishes")
        .select("*")
        .eq("menu_id", menuData.id);

      setDishes(dishesData || []);

      // Check if user is logged in or guest
      const guestType = localStorage.getItem("userType");
      if (guestType === "gast") {
        // Load guest preferences from localStorage
        const guestPrefs = localStorage.getItem("guestPreferences");
        if (guestPrefs) {
          const prefs = JSON.parse(guestPrefs);
          const allergies = prefs.allergies || [];
          const customAllergies = prefs.customAllergies || [];
          setUserAllergies(allergies);
          setUserCustomAllergies(customAllergies);
          setUser({ isGuest: true });
        }
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Load user preferences
          const { data: prefsData } = await supabase
            .from("preferences")
            .select("preference_type, preference_value, characteristics")
            .eq("user_id", currentUser.id);

          if (prefsData) {
            const allergies = prefsData
              .filter(p => p.preference_type === "allergie" && !p.characteristics)
              .map(p => p.preference_value);
            const customAllergies = prefsData
              .filter(p => p.preference_type === "allergie" && p.characteristics)
              .map(p => ({
                name: p.preference_value,
                characteristics: p.characteristics
              }));
            setUserAllergies(allergies);
            setUserCustomAllergies(customAllergies);
          }
        }
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

  const handleScan = async () => {
    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Log in om je allergieën te vergelijken met het menu.",
      });
      navigate("/auth");
      return;
    }

    setScanning(true);
    try {
      // Compare dishes with user allergies
      const results = dishes.map(dish => {
        const dishAllergens = dish.allergens || [];
        const dishIngredients = dish.ingredients || [];
        
        // Check standard allergies
        const hasUserAllergy = dishAllergens.some((allergen: string) => 
          userAllergies.includes(allergen)
        );

        // Check custom allergies characteristics
        const hasCustomAllergyMatch = userCustomAllergies.some((customAllergy: any) => {
          return customAllergy.characteristics.some((char: string) => 
            dishIngredients.some((ing: string) => 
              ing.toLowerCase().includes(char.toLowerCase())
            )
          );
        });

        const matchedAllergens = dishAllergens.filter((a: string) => userAllergies.includes(a));
        const matchedCustom = userCustomAllergies.filter((ca: any) => 
          ca.characteristics.some((char: string) => 
            dishIngredients.some((ing: string) => 
              ing.toLowerCase().includes(char.toLowerCase())
            )
          )
        ).map((ca: any) => ca.name);

        // Determine status: avoid (contains allergens), caution (might be adaptable), safe
        let status = "safe";
        if (hasUserAllergy || hasCustomAllergyMatch) {
          status = "avoid";
        } else if (dishAllergens.length > 0) {
          // Has allergens but not user's specific ones - might be adaptable
          status = "caution";
        }

        return {
          dish,
          status,
          matchedAllergens,
          matchedCustom
        };
      });

      setMatchResults(results);

      // Log scan to database (only if logged in user, not guest)
      if (!user.isGuest) {
        await supabase.from("menu_scans").insert({
          menu_id: menu.id,
          scanner_user_id: user.id,
          allergies_checked: [...userAllergies, ...userCustomAllergies.map((ca: any) => ca.name)],
          preferences_checked: [],
        });
      }

      toast({
        title: "Vergelijking compleet!",
        description: "Je allergieën zijn vergeleken met het menu.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij scannen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <CardDescription>
              {dishes.length > 0 
                ? `${dishes.length} gerechten beschikbaar`
                : "Dit menu heeft nog geen gerechten"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user && (userAllergies.length > 0 || userCustomAllergies.length > 0) ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Je allergieën:</h3>
                  <div className="flex flex-wrap gap-2">
                    {userAllergies.map((allergie) => (
                      <Badge key={allergie} variant="secondary">
                        {allergie}
                      </Badge>
                    ))}
                    {userCustomAllergies.map((ca: any) => (
                      <Badge key={ca.name} variant="secondary">
                        {ca.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleScan}
                  disabled={scanning || dishes.length === 0}
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig met vergelijken...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Vergelijk met mijn allergieën
                    </>
                  )}
                </Button>

                {matchResults && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold text-lg">Resultaten:</h3>
                    {matchResults.map((result: any, index: number) => {
                      const getStatusColor = () => {
                        switch (result.status) {
                          case "safe":
                            return "border-success/50 bg-success/5";
                          case "caution":
                            return "border-warning/50 bg-warning/5";
                          case "avoid":
                            return "border-destructive/50 bg-destructive/5";
                          default:
                            return "";
                        }
                      };

                      const getStatusEmoji = () => {
                        switch (result.status) {
                          case "safe":
                            return "😊";
                          case "caution":
                            return "😐";
                          case "avoid":
                            return "🤢";
                          default:
                            return "";
                        }
                      };

                      const getStatusText = () => {
                        switch (result.status) {
                          case "safe":
                            return "Veilig";
                          case "caution":
                            return "Aanpasbaar";
                          case "avoid":
                            return "Bevat allergenen";
                          default:
                            return "";
                        }
                      };

                      return (
                        <Card key={index} className={`p-4 ${getStatusColor()}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{getStatusEmoji()}</span>
                                <div>
                                  <h4 className="font-semibold">{result.dish.name}</h4>
                                  <p className="text-xs text-muted-foreground">{getStatusText()}</p>
                                </div>
                              </div>
                              {result.dish.description && (
                                <p className="text-sm text-muted-foreground mb-2">{result.dish.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {result.dish.ingredients.map((ing: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {ing}
                                  </Badge>
                                ))}
                              </div>
                              {result.status === "avoid" && (result.matchedAllergens.length > 0 || result.matchedCustom.length > 0) && (
                                <div className="mt-2">
                                  <p className="text-sm font-semibold text-destructive">Gevonden allergenen:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {result.matchedAllergens.map((a: string) => (
                                      <Badge key={a} variant="destructive" className="text-xs">
                                        {a}
                                      </Badge>
                                    ))}
                                    {result.matchedCustom.map((c: string) => (
                                      <Badge key={c} variant="destructive" className="text-xs">
                                        {c}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {result.status === "caution" && (
                                <p className="text-sm text-warning mt-2">
                                  Bevat andere allergenen. Vraag personeel om aanpassingen.
                                </p>
                              )}
                            </div>
                            {result.dish.price && (
                              <span className="font-semibold text-muted-foreground">
                                {result.dish.price}
                              </span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : dishes.length > 0 ? (
              <div className="space-y-3">
                {dishes.map((dish) => (
                  <Card key={dish.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{dish.name}</h4>
                        {dish.description && (
                          <p className="text-sm text-muted-foreground mb-2">{dish.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {dish.ingredients.map((ing: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ing}
                            </Badge>
                          ))}
                        </div>
                        {dish.allergens && dish.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dish.allergens.map((allergen: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {dish.price && (
                        <span className="font-semibold text-muted-foreground">
                          {dish.price}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Dit menu heeft nog geen gerechten toegevoegd.
              </p>
            )}

            {!user && dishes.length > 0 && (
              <div className="text-center space-y-4 pt-4">
                <p className="text-muted-foreground">
                  Log in of ga door als gast om je allergieën te vergelijken met dit menu
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate("/auth")}>
                    Inloggen
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/auth")}>
                    Doorgaan als Gast
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuView;