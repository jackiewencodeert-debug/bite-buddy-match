import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, QrCode, ArrowLeft, TrendingUp, Plus, Camera, Edit3, Eye, BarChart3, User, Download } from "lucide-react";
import QRCode from "react-qr-code";
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
interface MenuScanStats {
  allergie: string;
  count: number;
}
const BusinessDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);
  const [menuScanCounts, setMenuScanCounts] = useState<{
    [key: string]: number;
  }>({});
  const [stats, setStats] = useState<MenuScanStats[]>([]);
  const [topAllergies, setTopAllergies] = useState<MenuScanStats[]>([]);
  const [userType, setUserType] = useState<string>("");
  const {
    t
  } = useLanguage();

  // Dialog states
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showProfileDevDialog, setShowProfileDevDialog] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [creatingMenu, setCreatingMenu] = useState(false);
  useEffect(() => {
    checkUserTypeAndLoadData();
  }, []);
  const checkUserTypeAndLoadData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const {
        data: profile
      } = await supabase.from("profiles").select("user_type").eq("id", user.id).single();
      if (profile?.user_type !== "eetgever") {
        toast({
          title: t("business.noAccess"),
          description: t("business.businessOnly"),
          variant: "destructive"
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadMenusAndStats = async (userId: string) => {
    // Load menus
    const {
      data: menusData
    } = await supabase.from("menus").select("*").eq("business_user_id", userId).order("created_at", {
      ascending: false
    });
    setMenus(menusData || []);

    // Load scan statistics
    if (menusData && menusData.length > 0) {
      const menuIds = menusData.map(m => m.id);
      const {
        data: scansData
      } = await supabase.from("menu_scans").select("menu_id, allergies_checked, preferences_checked").in("menu_id", menuIds);
      if (scansData) {
        // Count scans per menu
        const scanCounts: {
          [key: string]: number;
        } = {};
        menuIds.forEach(id => {
          scanCounts[id] = 0;
        });
        scansData.forEach(scan => {
          scanCounts[scan.menu_id] = (scanCounts[scan.menu_id] || 0) + 1;
        });
        setMenuScanCounts(scanCounts);
        // Count allergies and preferences
        const allergyCount: {
          [key: string]: number;
        } = {};
        scansData.forEach(scan => {
          scan.allergies_checked?.forEach((allergy: string) => {
            allergyCount[allergy] = (allergyCount[allergy] || 0) + 1;
          });
          scan.preferences_checked?.forEach((pref: string) => {
            allergyCount[pref] = (allergyCount[pref] || 0) + 1;
          });
        });
        const statsArray = Object.entries(allergyCount).map(([allergie, count]) => ({
          allergie,
          count
        })).sort((a, b) => b.count - a.count);
        setStats(statsArray);
        setTopAllergies(statsArray.slice(0, 5));
      }
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const handleAddMenu = () => {
    setMenuName("");
    setShowNameDialog(true);
  };
  const handleStartMenu = async () => {
    if (!menuName.trim()) {
      toast({
        title: t("common.error"),
        description: t("business.enterMenuName"),
        variant: "destructive"
      });
      return;
    }
    setShowNameDialog(false);
    setShowMethodDialog(true);
  };
  const downloadQRCode = (menu: any) => {
    const menuData = menu.menu_data as { name?: string } | null;
    const menuName = menuData?.name || t("business.untitledMenu");
    
    // Create a temporary container for the QR code
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Render QR code to the temp container
    const qrUrl = `${window.location.origin}/menu/${menu.qr_code}`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '256');
    svg.setAttribute('height', '256');
    svg.setAttribute('viewBox', '0 0 256 256');
    tempDiv.appendChild(svg);
    
    // Use canvas to convert SVG to image
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create QR code image
    const qrContainer = document.createElement('div');
    document.body.appendChild(qrContainer);
    
    // Use react-qr-code's SVG output
    const qrSvg = document.querySelector(`[data-qr-menu-id="${menu.id}"]`) as SVGElement;
    
    if (qrSvg && ctx) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 256, 256);
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const qrSize = 80;
        const xPos = (pageWidth - qrSize) / 2;
        
        pdf.setFontSize(24);
        pdf.text(menuName, pageWidth / 2, 40, { align: 'center' });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', xPos, 60, qrSize, qrSize);
        
        pdf.setFontSize(12);
        pdf.text(t("business.scanToView"), pageWidth / 2, 155, { align: 'center' });
        
        pdf.save(`${menuName.replace(/[^a-zA-Z0-9]/g, '_')}_QR.pdf`);
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
    
    document.body.removeChild(tempDiv);
    document.body.removeChild(qrContainer);
  };

  const handleMethodSelect = async (method: "scan" | "manual") => {
    setCreatingMenu(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const generatedQrCode = `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create the menu in database
      const {
        data: menuData,
        error
      } = await supabase.from("menus").insert({
        business_user_id: user.id,
        qr_code: generatedQrCode,
        menu_data: {
          name: menuName.trim()
        }
      }).select('id').single();
      if (error) throw error;
      setShowMethodDialog(false);
      if (method === "scan") {
        // Navigate to scan page with menu context
        navigate(`/menu/${menuData.id}/edit?method=scan`);
      } else {
        // Navigate directly to editor for manual entry
        navigate(`/menu/${menuData.id}/edit?method=manual`);
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreatingMenu(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <LanguageToggle />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("business.title")}</h1>
          <p className="text-muted-foreground">
            {t("business.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowProfileDevDialog(true)}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </CardTitle>
              <CardDescription className="text-center text-base font-medium text-warning-foreground">{t("index.profile")}</CardDescription>
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
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/business/statistics")}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </CardTitle>
              <CardDescription className="text-center text-base font-medium text-warning-foreground">{t("business.statistics")}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {topAllergies.length > 0 && <Card>
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
                {topAllergies.map((item, index) => <div key={item.allergie} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-lg font-semibold">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{item.allergie}</span>
                    </div>
                    <Badge>{item.count}x</Badge>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

        {stats.length > 0 && <Card>
            <CardHeader>
              <CardTitle>{t("business.allAllergies")}</CardTitle>
              <CardDescription>
                {t("business.allAllergiesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {stats.map(item => <div key={item.allergie} className="flex items-center justify-between p-2 rounded border">
                    <span>{item.allergie}</span>
                    <Badge variant="secondary">{t("business.timesScanned").replace("{count}", item.count.toString())}</Badge>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

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
            {menus.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t("business.noMenus")}
                </p>
                <Button onClick={handleAddMenu}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("business.addMenu")}
                </Button>
              </div> : <div className="space-y-4">
                <div className="grid gap-4">
                  {menus.map(menu => {
                const menuData = menu.menu_data as {
                  name?: string;
                } | null;
                return <div key={menu.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {menuData?.name || t("business.untitledMenu")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t("business.createdOn").replace("{date}", new Date(menu.created_at).toLocaleDateString("nl-NL"))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span>{menuScanCounts[menu.id] || 0}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/menu/${menu.id}/edit`)}>
                              <Edit3 className="h-4 w-4 mr-1" />
                              {t("business.editMenu")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/menu/${menu.qr_code}`)}>
                              {t("business.viewQR")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadQRCode(menu)}>
                              <Download className="h-4 w-4 mr-1" />
                              {t("business.downloadQR")}
                            </Button>
                            {/* Hidden QR code for PDF generation */}
                            <div className="hidden">
                              <QRCode
                                data-qr-menu-id={menu.id}
                                value={`${window.location.origin}/menu/${menu.qr_code}`}
                                size={256}
                              />
                            </div>
                          </div>
                        </div>
                      </div>;
              })}
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleAddMenu} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("business.addMenu")}
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>

      </div>

      {/* Menu Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("business.newMenuTitle")}</DialogTitle>
            <DialogDescription>
              {t("business.newMenuDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="menuName">{t("business.menuNameLabel")}</Label>
              <Input id="menuName" placeholder={t("business.menuNamePlaceholder")} value={menuName} onChange={e => setMenuName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleStartMenu()} />
            </div>
            <Button onClick={handleStartMenu} className="w-full" disabled={!menuName.trim()}>
              {t("business.start")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Method Selection Dialog */}
      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("business.chooseMethod")}</DialogTitle>
            <DialogDescription>
              {t("business.chooseMethodDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Card className="p-6 cursor-pointer hover:shadow-hover transition-all border-2 hover:border-primary" onClick={() => !creatingMenu && handleMethodSelect("scan")}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("business.scanMenuMethod")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("business.scanMenuMethodDesc")}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 cursor-pointer hover:shadow-hover transition-all border-2 hover:border-primary" onClick={() => !creatingMenu && handleMethodSelect("manual")}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("business.manualMethod")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("business.manualMethodDesc")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          {creatingMenu && <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>}
        </DialogContent>
      </Dialog>

      {/* Profile In Development Dialog */}
      <Dialog open={showProfileDevDialog} onOpenChange={setShowProfileDevDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>In ontwikkeling</DialogTitle>
            <DialogDescription>
              Deze functie is nog in ontwikkeling en komt binnenkort beschikbaar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => setShowProfileDevDialog(false)}>
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

export default BusinessDashboard;