import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Store, Search, TrendingUp, Calendar, ChevronDown, Eye, ScanLine, BarChart3, MessageSquare, Check, X, ThumbsUp, AlertTriangle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AccountStats {
  totalEters: number;
  totalEetgevers: number;
}

interface UsageDataPoint {
  label: string;
  registrations: number;
  guestRegistrations: number;
  scans: number;
  menuScans: number;
  total: number;
}

interface UserProfile {
  id: string;
  email: string;
  user_type: "eter" | "eetgever";
  created_at: string;
}

interface AllergenFeedbackItem {
  id: string;
  dish_name: string;
  detected_allergens: string[];
  confirmed_allergens: string[];
  missed_allergens: string[];
  false_positives: string[];
  ingredients: string[];
  feedback_type: string;
  is_processed: boolean;
  created_at: string;
}

interface AllergenPattern {
  id: string;
  ingredient_pattern: string;
  allergen: string;
  confidence_score: number;
  feedback_count: number;
}

const Admin = () => {
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null);
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "eter" | "eetgever">("all");
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Extra stats
  const [totalScans, setTotalScans] = useState(0);
  const [totalMenus, setTotalMenus] = useState(0);
  const [totalMenuScans, setTotalMenuScans] = useState(0);
  const [totalGuestRegistrations, setTotalGuestRegistrations] = useState(0);

  // Allergen feedback
  const [feedbackItems, setFeedbackItems] = useState<AllergenFeedbackItem[]>([]);
  const [patterns, setPatterns] = useState<AllergenPattern[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "pending" | "processed">("pending");

  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const months = [
    t("admin.monthJan"), t("admin.monthFeb"), t("admin.monthMar"),
    t("admin.monthApr"), t("admin.monthMay"), t("admin.monthJun"),
    t("admin.monthJul"), t("admin.monthAug"), t("admin.monthSep"),
    t("admin.monthOct"), t("admin.monthNov"), t("admin.monthDec")
  ];

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsageData();
    }
  }, [isAdmin, viewMode, selectedMonth, selectedYear]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, userTypeFilter]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

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
      loadAccountStats();
      loadUsers();
      loadExtraStats();
      loadFeedback();
      loadPatterns();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/auth");
    }
  };

  const loadAccountStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_type");

      if (profiles) {
        const totalEters = profiles.filter(p => p.user_type === "eter").length;
        const totalEetgevers = profiles.filter(p => p.user_type === "eetgever").length;
        setAccountStats({ totalEters, totalEetgevers });
      }
    } catch (error) {
      console.error("Error loading account stats:", error);
    }
  };

  const loadExtraStats = async () => {
    try {
      const { count: scanCount } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .neq("scan_method", "guest_registration");
      setTotalScans(scanCount || 0);

      const { count: guestCount } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("scan_method", "guest_registration");
      setTotalGuestRegistrations(guestCount || 0);

      const { count: menuCount } = await supabase
        .from("menus")
        .select("*", { count: "exact", head: true });
      setTotalMenus(menuCount || 0);

      const { count: menuScanCount } = await supabase
        .from("menu_scans")
        .select("*", { count: "exact", head: true });
      setTotalMenuScans(menuScanCount || 0);
    } catch (error) {
      console.error("Error loading extra stats:", error);
    }
  };

  const loadUsageData = async () => {
    try {
      // Fetch all activity data
      const [scansResult, profilesResult, menuScansResult, guestScansResult] = await Promise.all([
        supabase.from("scans").select("created_at, scan_method").neq("scan_method", "guest_registration"),
        supabase.from("profiles").select("created_at"),
        supabase.from("menu_scans").select("scanned_at"),
        supabase.from("scans").select("created_at").eq("scan_method", "guest_registration")
      ]);

      const scans = scansResult.data || [];
      const profiles = profilesResult.data || [];
      const menuScans = menuScansResult.data || [];
      const guestScans = guestScansResult.data || [];

      const countInRange = (
        items: { created_at?: string; scanned_at?: string }[],
        start: Date,
        end: Date,
        dateField: 'created_at' | 'scanned_at'
      ) => {
        return items.filter(item => {
          const dateValue = dateField === 'created_at' ? item.created_at : item.scanned_at;
          if (!dateValue) return false;
          const date = new Date(dateValue);
          return date >= start && date < end;
        }).length;
      };

      if (viewMode === "month") {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dataPoints: UsageDataPoint[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const startOfDay = new Date(selectedYear, selectedMonth, day);
          const endOfDay = new Date(selectedYear, selectedMonth, day + 1);
          
          const registrationsCount = countInRange(profiles, startOfDay, endOfDay, 'created_at');
          const guestRegistrationsCount = countInRange(guestScans, startOfDay, endOfDay, 'created_at');
          const scansCount = countInRange(scans, startOfDay, endOfDay, 'created_at');
          const menuScansCount = countInRange(menuScans, startOfDay, endOfDay, 'scanned_at');
          
          dataPoints.push({ 
            label: day.toString(), 
            registrations: registrationsCount,
            guestRegistrations: guestRegistrationsCount,
            scans: scansCount,
            menuScans: menuScansCount,
            total: registrationsCount + guestRegistrationsCount + scansCount + menuScansCount
          });
        }
        
        setUsageData(dataPoints);
      } else {
        const dataPoints: UsageDataPoint[] = [];
        
        for (let week = 1; week <= 52; week++) {
          const startOfWeek = getDateOfISOWeek(week, selectedYear);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          
          const registrationsCount = countInRange(profiles, startOfWeek, endOfWeek, 'created_at');
          const guestRegistrationsCount = countInRange(guestScans, startOfWeek, endOfWeek, 'created_at');
          const scansCount = countInRange(scans, startOfWeek, endOfWeek, 'created_at');
          const menuScansCount = countInRange(menuScans, startOfWeek, endOfWeek, 'scanned_at');
          
          dataPoints.push({ 
            label: `W${week}`, 
            registrations: registrationsCount,
            guestRegistrations: guestRegistrationsCount,
            scans: scansCount,
            menuScans: menuScansCount,
            total: registrationsCount + guestRegistrationsCount + scansCount + menuScansCount
          });
        }
        
        setUsageData(dataPoints);
      }
    } catch (error) {
      console.error("Error loading usage data:", error);
    }
  };

  const getDateOfISOWeek = (week: number, year: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  };

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, user_type, created_at")
        .order("created_at", { ascending: false });

      if (profiles) {
        setUsers(profiles as UserProfile[]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query)
      );
    }
    
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(user => user.user_type === userTypeFilter);
    }
    
    setFilteredUsers(filtered);
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear];
  };

  const loadFeedback = async () => {
    try {
      const { data } = await supabase
        .from("allergen_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        setFeedbackItems(data as AllergenFeedbackItem[]);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  const loadPatterns = async () => {
    try {
      const { data } = await supabase
        .from("allergen_patterns")
        .select("*")
        .order("confidence_score", { ascending: false });
      
      if (data) {
        setPatterns(data as AllergenPattern[]);
      }
    } catch (error) {
      console.error("Error loading patterns:", error);
    }
  };

  const markFeedbackProcessed = async (id: string) => {
    try {
      await supabase
        .from("allergen_feedback")
        .update({ is_processed: true })
        .eq("id", id);
      
      loadFeedback();
      toast({
        title: t("admin.feedbackProcessed"),
        description: t("admin.feedbackProcessedDesc"),
      });
    } catch (error) {
      console.error("Error marking feedback:", error);
    }
  };

  const createPatternFromFeedback = async (feedback: AllergenFeedbackItem) => {
    try {
      // Create patterns from missed allergens
      for (const allergen of feedback.missed_allergens) {
        for (const ingredient of feedback.ingredients || []) {
          const existingPattern = patterns.find(
            p => p.ingredient_pattern.toLowerCase() === ingredient.toLowerCase() && 
                 p.allergen.toLowerCase() === allergen.toLowerCase()
          );
          
          if (existingPattern) {
            await supabase
              .from("allergen_patterns")
              .update({ 
                feedback_count: existingPattern.feedback_count + 1,
                confidence_score: Math.min(1, existingPattern.confidence_score + 0.1)
              })
              .eq("id", existingPattern.id);
          } else {
            await supabase
              .from("allergen_patterns")
              .insert({
                ingredient_pattern: ingredient.toLowerCase(),
                allergen: allergen.toLowerCase(),
                confidence_score: 0.5,
                feedback_count: 1
              });
          }
        }
      }
      
      await markFeedbackProcessed(feedback.id);
      loadPatterns();
      toast({
        title: t("admin.patternCreated"),
        description: t("admin.patternCreatedDesc"),
      });
    } catch (error) {
      console.error("Error creating pattern:", error);
    }
  };

  const deletePattern = async (id: string) => {
    try {
      await supabase
        .from("allergen_patterns")
        .delete()
        .eq("id", id);
      
      loadPatterns();
      toast({
        title: t("admin.patternDeleted"),
      });
    } catch (error) {
      console.error("Error deleting pattern:", error);
    }
  };

  const filteredFeedback = feedbackItems.filter(item => {
    if (feedbackFilter === "all") return true;
    if (feedbackFilter === "pending") return !item.is_processed;
    return item.is_processed;
  });

  if (!isAdmin) {
    return null;
  }

  const chartConfig = {
    registrations: {
      label: t("admin.registrationsLabel"),
      color: "hsl(var(--primary))",
    },
    guestRegistrations: {
      label: t("admin.guestRegistrationsLabel"),
      color: "hsl(38 92% 50%)",
    },
    scans: {
      label: t("admin.scansLabel"),
      color: "hsl(142 76% 36%)",
    },
    menuScans: {
      label: t("admin.menuScansLabel"),
      color: "hsl(217 91% 60%)",
    },
    total: {
      label: t("admin.totalLabel"),
      color: "hsl(var(--muted-foreground))",
    },
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <LanguageToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.logout")}
          </Button>
        </div>

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
            {/* Account Statistics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.eterAccounts")}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{accountStats?.totalEters || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.eterAccountsDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.eetgeverAccounts")}
                  </CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{accountStats?.totalEetgevers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.eetgeverAccountsDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.guestRegistrations")}
                  </CardTitle>
                  <Users className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalGuestRegistrations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.guestRegistrationsDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.totalMenus")}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalMenus}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.totalMenusDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("admin.totalQRScans")}
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalMenuScans}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.totalQRScansDesc")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t("admin.usageChart")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === "month" ? t("admin.usageChartDescMonth") : t("admin.usageChartDescYear")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "year")}>
                      <SelectTrigger className="w-[140px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">{t("admin.viewMonth")}</SelectItem>
                        <SelectItem value="year">{t("admin.viewYear")}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {viewMode === "month" && (
                      <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableYears().map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "hsl(var(--primary))" }}></div>
                    <span className="text-sm">{t("admin.registrationsLabel")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "hsl(38 92% 50%)" }}></div>
                    <span className="text-sm">{t("admin.guestRegistrationsLabel")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "hsl(142 76% 36%)" }}></div>
                    <span className="text-sm">{t("admin.scansLabel")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "hsl(217 91% 60%)" }}></div>
                    <span className="text-sm">{t("admin.menuScansLabel")}</span>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={usageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGuestRegistrations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMenuScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }}
                        interval={viewMode === "year" ? 3 : "preserveStartEnd"}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorRegistrations)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="guestRegistrations" 
                        stroke="hsl(38 92% 50%)" 
                        fillOpacity={1} 
                        fill="url(#colorGuestRegistrations)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="scans" 
                        stroke="hsl(142 76% 36%)" 
                        fillOpacity={1} 
                        fill="url(#colorScans)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="menuScans" 
                        stroke="hsl(217 91% 60%)" 
                        fillOpacity={1} 
                        fill="url(#colorMenuScans)" 
                        stackId="1"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Search & List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t("admin.userSearch")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userTypeFilter} onValueChange={(v) => setUserTypeFilter(v as "all" | "eter" | "eetgever")}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.filterAll")}</SelectItem>
                      <SelectItem value="eter">{t("admin.filterEter")}</SelectItem>
                      <SelectItem value="eetgever">{t("admin.filterEetgever")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.tableEmail")}</TableHead>
                        <TableHead>{t("admin.tableType")}</TableHead>
                        <TableHead>{t("admin.tableCreated")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            {t("admin.noUsersFound")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.slice(0, 50).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.user_type === "eetgever" 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-secondary text-secondary-foreground"
                              }`}>
                                {user.user_type === "eetgever" ? t("admin.filterEetgever") : t("admin.filterEter")}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filteredUsers.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {t("admin.showingFirst50").replace("{total}", filteredUsers.length.toString())}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Extra Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" />
                  {t("admin.extraStats")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <p className="text-3xl font-bold">{totalScans}</p>
                    <p className="text-sm text-muted-foreground">{t("admin.totalAppScans")}</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <p className="text-3xl font-bold">{accountStats ? accountStats.totalEters + accountStats.totalEetgevers : 0}</p>
                    <p className="text-sm text-muted-foreground">{t("admin.totalAccounts")}</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <p className="text-3xl font-bold">
                      {accountStats && (accountStats.totalEters + accountStats.totalEetgevers) > 0
                        ? ((accountStats.totalEetgevers / (accountStats.totalEters + accountStats.totalEetgevers)) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">{t("admin.businessRatio")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergen Feedback Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t("admin.allergenFeedback")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="feedback">
                  <TabsList className="mb-4">
                    <TabsTrigger value="feedback">{t("admin.feedbackTab")}</TabsTrigger>
                    <TabsTrigger value="patterns">{t("admin.patternsTab")}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="feedback">
                    <div className="flex gap-2 mb-4">
                      <Select value={feedbackFilter} onValueChange={(v) => setFeedbackFilter(v as "all" | "pending" | "processed")}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("admin.filterAll")}</SelectItem>
                          <SelectItem value="pending">{t("admin.filterPending")}</SelectItem>
                          <SelectItem value="processed">{t("admin.filterProcessed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {filteredFeedback.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">{t("admin.noFeedback")}</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredFeedback.map((item) => (
                          <div key={item.id} className={`border rounded-lg p-4 ${item.is_processed ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{item.dish_name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.created_at).toLocaleDateString()} - {item.feedback_type === "confirmation" ? t("admin.confirmed") : t("admin.correction")}
                                </p>
                              </div>
                              {!item.is_processed && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => createPatternFromFeedback(item)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {t("admin.approve")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markFeedbackProcessed(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {item.detected_allergens.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs text-muted-foreground">{t("admin.detectedAllergens")}: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.detected_allergens.map((a, i) => (
                                    <Badge key={i} variant="secondary">{a}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.missed_allergens.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs text-destructive">{t("admin.missedAllergens")}: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.missed_allergens.map((a, i) => (
                                    <Badge key={i} variant="destructive">{a}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.false_positives.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs text-warning">{t("admin.falsePositives")}: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.false_positives.map((a, i) => (
                                    <Badge key={i} variant="outline">{a}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">{t("admin.ingredients")}: </span>
                                <p className="text-sm">{item.ingredients.join(", ")}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="patterns">
                    {patterns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">{t("admin.noPatterns")}</p>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("admin.ingredient")}</TableHead>
                              <TableHead>{t("admin.allergen")}</TableHead>
                              <TableHead>{t("admin.confidence")}</TableHead>
                              <TableHead>{t("admin.feedbackCount")}</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patterns.map((pattern) => (
                              <TableRow key={pattern.id}>
                                <TableCell className="font-medium">{pattern.ingredient_pattern}</TableCell>
                                <TableCell>
                                  <Badge>{pattern.allergen}</Badge>
                                </TableCell>
                                <TableCell>{(pattern.confidence_score * 100).toFixed(0)}%</TableCell>
                                <TableCell>{pattern.feedback_count}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deletePattern(pattern.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
