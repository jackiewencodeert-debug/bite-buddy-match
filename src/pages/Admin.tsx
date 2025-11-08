import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, ScanLine, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalUsers: number;
  totalScans: number;
  preferences: { type: string; value: string; count: number }[];
}

const Admin = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      
      if (!hasAdminRole) {
        toast({
          title: "Geen toegang",
          description: "Je hebt geen admin rechten.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadStats();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/auth");
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

      // Get preferences statistics
      const { data: prefsData } = await supabase
        .from("preferences")
        .select("preference_type, preference_value");

      // Count preferences
      const preferenceCounts: Record<string, number> = {};
      prefsData?.forEach(pref => {
        const key = `${pref.preference_type}: ${pref.preference_value}`;
        preferenceCounts[key] = (preferenceCounts[key] || 0) + 1;
      });

      const preferences = Object.entries(preferenceCounts)
        .map(([key, count]) => {
          const [type, value] = key.split(": ");
          return { type, value, count };
        })
        .sort((a, b) => b.count - a.count);

      setStats({
        totalUsers: userCount || 0,
        totalScans: scanCount || 0,
        preferences,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "Kon statistieken niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overzicht van app statistieken</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Statistieken laden...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Totaal Accounts
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Geregistreerde gebruikers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Totaal Scans
                  </CardTitle>
                  <ScanLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalScans}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Menu's gescand
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unieke Voorkeuren
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats?.preferences.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verschillende voorkeuren
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Preferences Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Voorkeuren Overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.preferences && stats.preferences.length > 0 ? (
                  <div className="space-y-4">
                    {stats.preferences.map((pref, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {pref.type}: <span className="text-muted-foreground">{pref.value}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{pref.count}x</p>
                          </div>
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${Math.min(
                                  (pref.count / (stats.preferences[0]?.count || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nog geen voorkeuren geregistreerd
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
