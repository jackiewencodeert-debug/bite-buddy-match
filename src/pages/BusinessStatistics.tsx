import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Shield, Scale, FileText, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { translateAllergen } from "@/data/businessTranslations";

// EU 14 major allergens as defined in Regulation (EU) No 1169/2011
const EU_ALLERGENS = [
  "gluten", "schaaldieren", "eieren", "vis", "pinda's", 
  "soja", "lactose", "noten", "selderij", "mosterd", 
  "sesam", "sulfiet", "lupine", "weekdieren"
];

interface AllergenStat {
  allergen: string;
  count: number;
  isEuAllergen: boolean;
}

const BusinessStatistics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allergenStats, setAllergenStats] = useState<AllergenStat[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalMenus, setTotalMenus] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is business type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type !== "eetgever") {
        navigate("/business");
        return;
      }

      // Load menus
      const { data: menusData } = await supabase
        .from("menus")
        .select("id")
        .eq("business_user_id", user.id);

      setTotalMenus(menusData?.length || 0);

      if (menusData && menusData.length > 0) {
        const menuIds = menusData.map(m => m.id);
        
        // Load all scans for user's menus
        const { data: scansData } = await supabase
          .from("menu_scans")
          .select("*")
          .in("menu_id", menuIds);

        if (scansData) {
          setTotalScans(scansData.length);
          
          // Count unique users
          const uniqueUserIds = new Set(scansData.map(s => s.scanner_user_id).filter(Boolean));
          setUniqueUsers(uniqueUserIds.size);

          // Aggregate allergen statistics
          const allergenCounts: { [key: string]: number } = {};
          
          scansData.forEach(scan => {
            const allergies = scan.allergies_checked || [];
            allergies.forEach((allergen: string) => {
              const lowerAllergen = allergen.toLowerCase();
              allergenCounts[lowerAllergen] = (allergenCounts[lowerAllergen] || 0) + 1;
            });
          });

          // Convert to array and mark EU allergens
          const statsArray: AllergenStat[] = Object.entries(allergenCounts)
            .map(([allergen, count]) => ({
              allergen,
              count,
              isEuAllergen: EU_ALLERGENS.some(eu => allergen.includes(eu) || eu.includes(allergen))
            }))
            .sort((a, b) => b.count - a.count);

          setAllergenStats(statsArray);
        }
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const euAllergensCovered = EU_ALLERGENS.filter(eu => 
    allergenStats.some(stat => stat.allergen.includes(eu) || eu.includes(stat.allergen))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <LanguageToggle />
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("statistics.backToDashboard")}
        </Button>

        <div>
          <h1 className="text-3xl font-bold">{t("statistics.title")}</h1>
          <p className="text-muted-foreground">
            {t("statistics.subtitle")}
          </p>
        </div>

        {/* EU Compliance Info */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <CardTitle>{t("statistics.euCompliance")}</CardTitle>
            </div>
            <CardDescription>
              {t("statistics.euComplianceDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{t("statistics.regulation1169")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("statistics.regulation1169Desc")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{t("statistics.allergenLabeling")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("statistics.allergenLabelingDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">{totalMenus}</CardTitle>
              </div>
              <CardDescription>{t("statistics.totalMenus")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">{totalScans}</CardTitle>
              </div>
              <CardDescription>{t("statistics.totalComparisons")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">{uniqueUsers}</CardTitle>
              </div>
              <CardDescription>{t("statistics.uniqueUsers")}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* EU 14 Allergens */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle>{t("statistics.eu14Allergens")}</CardTitle>
              </div>
              <Badge variant="outline">
                {euAllergensCovered}/14 {t("statistics.detected")}
              </Badge>
            </div>
            <CardDescription>
              {t("statistics.eu14AllergensDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EU_ALLERGENS.map((allergen) => {
                const stat = allergenStats.find(s => 
                  s.allergen.includes(allergen) || allergen.includes(s.allergen)
                );
                const isDetected = !!stat;
                
                return (
                  <div 
                    key={allergen}
                    className={`p-2 rounded-lg border text-center ${
                      isDetected 
                        ? 'border-primary/50 bg-primary/10' 
                        : 'border-muted bg-muted/20'
                    }`}
                  >
                    <p className="font-medium capitalize">{translateAllergen(allergen, language)}</p>
                    {stat && (
                      <p className="text-xs text-muted-foreground">{stat.count}x</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Allergen Statistics */}
        {allergenStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("statistics.allAllergens")}</CardTitle>
              <CardDescription>
                {t("statistics.allAllergensDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allergenStats.map((stat) => (
                  <div 
                    key={stat.allergen} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{translateAllergen(stat.allergen, language)}</span>
                      {stat.isEuAllergen && (
                        <Badge variant="secondary" className="text-xs">EU-14</Badge>
                      )}
                    </div>
                    <Badge>{stat.count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {allergenStats.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {t("statistics.noData")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* App Guidelines */}
        <Card className="border-secondary/50 bg-secondary/5">
          <CardHeader>
            <CardTitle>{t("statistics.appGuidelines")}</CardTitle>
            <CardDescription>
              {t("statistics.appGuidelinesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">{t("statistics.guideline1")}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">{t("statistics.guideline2")}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">{t("statistics.guideline3")}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <p className="text-sm">{t("statistics.guideline4")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessStatistics;
