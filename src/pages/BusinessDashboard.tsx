import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, QrCode, ArrowLeft, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

interface MenuScanStats {
  allergie: string;
  count: number;
}

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);
  const [stats, setStats] = useState<MenuScanStats[]>([]);
  const [topAllergies, setTopAllergies] = useState<MenuScanStats[]>([]);
  const [userType, setUserType] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    checkUserTypeAndLoadData();
  }, []);

  const checkUserTypeAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type !== "eetgever") {
        toast({
          title: t("business.noAccess"),
          description: t("business.businessOnly"),
          variant: "destructive",
        });
        navigate("/profile");
        return;
      }

      setUserType(profile.user_type);
      await loadMenusAndStats(user.id);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMenusAndStats = async (userId: string) => {
    // Load menus
    const { data: menusData } = await supabase
      .from("menus")
      .select("*")
      .eq("business_user_id", userId)
      .order("created_at", { ascending: false });

    setMenus(menusData || []);

    // Load scan statistics
    if (menusData && menusData.length > 0) {
      const menuIds = menusData.map(m => m.id);
      
      const { data: scansData } = await supabase
        .from("menu_scans")
        .select("allergies_checked, preferences_checked")
        .in("menu_id", menuIds);

      if (scansData) {
        // Count allergies and preferences
        const allergyCount: { [key: string]: number } = {};
        
        scansData.forEach(scan => {
          scan.allergies_checked?.forEach((allergy: string) => {
            allergyCount[allergy] = (allergyCount[allergy] || 0) + 1;
          });
          scan.preferences_checked?.forEach((pref: string) => {
            allergyCount[pref] = (allergyCount[pref] || 0) + 1;
          });
        });

        const statsArray = Object.entries(allergyCount)
          .map(([allergie, count]) => ({ allergie, count }))
          .sort((a, b) => b.count - a.count);

        setStats(statsArray);
        setTopAllergies(statsArray.slice(0, 5));
      }
    }
  };

  const handleStartPayment = async () => {
    setProcessingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: t("business.notLoggedIn"),
          description: t("business.loginToContinue"),
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-menu-payment", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: t("business.paymentError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("business.backToProfile")}
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            {t("profile.logout")}
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("business.title")}</h1>
          <p className="text-muted-foreground">
            {t("business.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{menus.length}</CardTitle>
              <CardDescription>{t("business.totalMenus")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {stats.reduce((acc, s) => acc + s.count, 0)}
              </CardTitle>
              <CardDescription>{t("business.totalScans")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{stats.length}</CardTitle>
              <CardDescription>{t("business.uniqueAllergies")}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {topAllergies.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>{t("business.topAllergies")}</CardTitle>
              </div>
              <CardDescription>
                {t("business.topAllergiesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAllergies.map((item, index) => (
                  <div key={item.allergie} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-lg font-semibold">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{item.allergie}</span>
                    </div>
                    <Badge>{item.count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("business.allAllergies")}</CardTitle>
              <CardDescription>
                {t("business.allAllergiesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {stats.map((item) => (
                  <div key={item.allergie} className="flex items-center justify-between p-2 rounded border">
                    <span>{item.allergie}</span>
                    <Badge variant="secondary">{t("business.timesScanned").replace("{count}", item.count.toString())}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <CardTitle>{t("business.myMenus")}</CardTitle>
            </div>
            <CardDescription>
              {t("business.myMenusDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {menus.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t("business.noMenus")}
                </p>
                <Button onClick={() => navigate("/scan")}>
                  {t("business.scanFirstMenu")}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {menus.map((menu) => (
                  <div key={menu.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("business.createdOn").replace("{date}", new Date(menu.created_at).toLocaleDateString("nl-NL"))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("business.qrCode").replace("{code}", menu.qr_code)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/menu/${menu.qr_code}`)}
                      >
                        {t("business.viewQR")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("business.addNewMenu")}</CardTitle>
            <CardDescription>
              {t("business.addNewMenuDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleStartPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("business.processingPayment")}
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-5 w-5" />
                  {t("business.payAndScan")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDashboard;