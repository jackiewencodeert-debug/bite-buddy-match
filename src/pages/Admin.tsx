import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, ScanLine, Heart, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalUsers: number;
  totalScans: number;
  totalPreferences: number;
  preferenceBreakdown: { [key: string]: number };
  scanMethodBreakdown: { camera: number; upload: number };
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalScans: 0,
    totalPreferences: 0,
    preferenceBreakdown: {},
    scanMethodBreakdown: { camera: 0, upload: 0 },
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "admin");
      
      if (!isAdmin) {
        toast({
          title: "Geen toegang",
          description: "Je hebt geen admin rechten.",
          variant: "destructive",
        });
        navigate("/profile");
        return;
      }

      // Load statistics
      await loadStats();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total scans
      const { count: scanCount } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true });

      // Get scan method breakdown
      const { data: scans } = await supabase
        .from("scans")
        .select("scan_method");

      const scanMethodBreakdown = {
        camera: scans?.filter(s => s.scan_method === "camera").length || 0,
        upload: scans?.filter(s => s.scan_method === "upload").length || 0,
      };

      // Get total preferences and breakdown
      const { data: preferences } = await supabase
        .from("preferences")
        .select("preference_type, preference_value");

      const preferenceBreakdown: { [key: string]: number } = {};
      preferences?.forEach(pref => {
        const key = `${pref.preference_type}: ${pref.preference_value}`;
        preferenceBreakdown[key] = (preferenceBreakdown[key] || 0) + 1;
      });

      setStats({
        totalUsers: userCount || 0,
        totalScans: scanCount || 0,
        totalPreferences: preferences?.length || 0,
        preferenceBreakdown,
        scanMethodBreakdown,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Fout bij laden statistieken",
        description: "Kon statistieken niet ophalen.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/profile">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Profiel
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Overzicht van alle gebruikers, scans en voorkeuren
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Geregistreerde accounts
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Scans</CardTitle>
                <ScanLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalScans}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Camera: {stats.scanMethodBreakdown.camera} | Upload: {stats.scanMethodBreakdown.upload}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Voorkeuren</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalPreferences}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Opgeslagen allergieën & diëten
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Voorkeur Statistieken</CardTitle>
              <CardDescription>
                Overzicht van hoe vaak elke voorkeur is geselecteerd
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.preferenceBreakdown).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nog geen voorkeuren opgegeven door gebruikers
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.preferenceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([preference, count]) => (
                      <div key={preference} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="font-medium">{preference}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${(count / stats.totalPreferences) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-lg min-w-[3rem] text-right">
                            {count}x
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
