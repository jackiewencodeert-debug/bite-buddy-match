import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { GuestMenuResults } from "@/components/GuestMenuResults";
import { MenuResults } from "@/components/MenuResults";

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
  const { t } = useLanguage();

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
          title: t("menuView.menuNotFound"),
          description: t("menuView.invalidQR"),
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
        title: t("menuView.errorLoading"),
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
        title: t("menuView.loginRequired"),
        description: t("menuView.loginRequiredDesc"),
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
        title: t("menuView.comparisonComplete"),
        description: t("menuView.comparisonCompleteDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("menuView.errorScanning"),
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
      <LanguageToggle />
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("menuView.backToHome")}
        </Button>

        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            {t("menuView.disclaimer")}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>
              {menu?.menu_data?.name || t("menuView.title")}
            </CardTitle>
            <CardDescription>
              {dishes.length > 0 
                ? t("menuView.dishesAvailable").replace("{count}", dishes.length.toString())
                : t("menuView.noDishes")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user && (userAllergies.length > 0 || userCustomAllergies.length > 0) ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2">{t("menuView.yourAllergies")}</h3>
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
                      {t("menuView.comparing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t("menuView.compareAllergies")}
                    </>
                  )}
                </Button>

                {matchResults && (
                  <MenuResults 
                    dishes={dishes} 
                    userAllergies={[...userAllergies, ...userCustomAllergies.map((ca: any) => ca.name)]}
                  />
                )}
              </>
            ) : dishes.length > 0 ? (
              <GuestMenuResults dishes={dishes} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("menuView.noDishesAdded")}
              </p>
            )}

            {!user && dishes.length > 0 && (
              <div className="text-center space-y-4 pt-4">
                <p className="text-muted-foreground">
                  {t("menuView.loginToCompare")}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate("/auth")}>
                    {t("common.login")}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/auth")}>
                    {t("common.continueAsGuest")}
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