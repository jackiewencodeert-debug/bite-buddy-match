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
  const [user, setUser] = useState<any>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

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

      // Check if user is logged in
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
            .filter(p => p.preference_type === "allergie")
            .map(p => p.preference_value);
          setUserAllergies(allergies);
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
      await supabase.from("menu_scans").insert({
        menu_id: menu.id,
        scanner_user_id: user.id,
        allergies_checked: userAllergies,
        preferences_checked: [],
      });

      toast({
        title: "Scan succesvol!",
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
            <CardTitle>Menu QR-Code</CardTitle>
            <CardDescription>
              Scan deze QR-code om het menu te vergelijken met je allergieën
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode
                value={`${window.location.origin}/menu/${qrCode}`}
                size={200}
              />
            </div>

            {user ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Je allergieën:</h3>
                  {userAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userAllergies.map((allergie) => (
                        <Badge key={allergie} variant="secondary">
                          {allergie}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Je hebt nog geen allergieën ingesteld
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleScan}
                  disabled={scanning || userAllergies.length === 0}
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
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Log in om je allergieën te vergelijken met dit menu
                </p>
                <Button onClick={() => navigate("/auth")}>
                  Inloggen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuView;