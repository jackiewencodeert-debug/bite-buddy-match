import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, ScanLine, Heart, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

interface Stats {
  totalUsers: number;
  totalScans: number;
  preferences: { type: string; value: string; count: number }[];
}

interface AdStats {
  shown: number;
  completed: number;
  skipped: number;
  completionRate: number;
  avgSkipCountdown: number;
}

const Admin = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [adStats, setAdStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

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
          title: t("admin.noAccess"),
          description: t("admin.noAdminRights"),
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadStats();
      loadAdStats();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/auth");
    }
  };

  const loadAdStats = async () => {
    try {
      const { data: adData } = await supabase
        .from("ad_analytics")
        .select("event_type, countdown_value");

      if (adData) {
        const shown = adData.filter(a => a.event_type === 'shown').length;
        const completed = adData.filter(a => a.event_type === 'completed').length;
        const skipped = adData.filter(a => a.event_type === 'skipped').length;
        
        const skippedWithCountdown = adData.filter(
          a => a.event_type === 'skipped' && a.countdown_value !== null
        );
        const avgSkipCountdown = skippedWithCountdown.length > 0
          ? skippedWithCountdown.reduce((sum, a) => sum + (a.countdown_value || 0), 0) / skippedWithCountdown.length
          : 0;
        
        const completionRate = shown > 0 ? (completed / shown) * 100 : 0;

        setAdStats({
          shown,
          completed,
          skipped,
          completionRate: Math.round(completionRate * 10) / 10,
          avgSkipCountdown: Math.round(avgSkipCountdown * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error loading ad stats:", error);
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
        title: t("common.error"),
        description: t("admin.errorLoadingStats"),
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
      <LanguageToggle />
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("admin.loadingStats")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.totalUsers")}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.registeredUsers")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.totalScans")}
                  </CardTitle>
                  <ScanLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalScans}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.menusScanned")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.uniquePreferences")}
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats?.preferences.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.differentPreferences")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ad Analytics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t("admin.adAnalytics")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adStats ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("admin.totalShown")}</p>
                        <p className="text-3xl font-bold">{adStats.shown}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("admin.completionRate")}</p>
                        <p className="text-3xl font-bold text-primary">{adStats.completionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("admin.fullyWatched")}</p>
                        <p className="text-2xl font-semibold text-green-600">{adStats.completed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("admin.skipped")}</p>
                        <p className="text-2xl font-semibold text-orange-600">{adStats.skipped}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("admin.avgSkipCountdown")}</p>
                        <p className="text-2xl font-semibold">{adStats.avgSkipCountdown}s</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{t("admin.completionVsSkip")}</span>
                        <span className="text-sm text-muted-foreground">
                          {t("admin.total").replace("{count}", (adStats.completed + adStats.skipped).toString())}
                        </span>
                      </div>
                      <div className="w-full h-4 bg-secondary rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-600"
                          style={{
                            width: `${(adStats.completed / (adStats.completed + adStats.skipped || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="h-full bg-orange-600"
                          style={{
                            width: `${(adStats.skipped / (adStats.completed + adStats.skipped || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-green-600 rounded-sm"></span>
                          {t("admin.completed").replace("{count}", adStats.completed.toString())}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-orange-600 rounded-sm"></span>
                          {t("admin.skippedCount").replace("{count}", adStats.skipped.toString())}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t("admin.noAdAnalytics")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Preferences Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.preferencesOverview")}</CardTitle>
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
                    {t("admin.noPreferences")}
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
