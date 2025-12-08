import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Store, Search, TrendingUp, Calendar, ChevronDown, Eye, ScanLine, BarChart3 } from "lucide-react";
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

interface AccountStats {
  totalEters: number;
  totalEetgevers: number;
}

interface UsageDataPoint {
  label: string;
  registrations: number;
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
        .select("*", { count: "exact", head: true });
      setTotalScans(scanCount || 0);

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
      const [scansResult, profilesResult, menuScansResult] = await Promise.all([
        supabase.from("scans").select("created_at"),
        supabase.from("profiles").select("created_at"),
        supabase.from("menu_scans").select("scanned_at")
      ]);

      const scans = scansResult.data || [];
      const profiles = profilesResult.data || [];
      const menuScans = menuScansResult.data || [];

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
          const scansCount = countInRange(scans, startOfDay, endOfDay, 'created_at');
          const menuScansCount = countInRange(menuScans, startOfDay, endOfDay, 'scanned_at');
          
          dataPoints.push({ 
            label: day.toString(), 
            registrations: registrationsCount,
            scans: scansCount,
            menuScans: menuScansCount,
            total: registrationsCount + scansCount + menuScansCount
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
          const scansCount = countInRange(scans, startOfWeek, endOfWeek, 'created_at');
          const menuScansCount = countInRange(menuScans, startOfWeek, endOfWeek, 'scanned_at');
          
          dataPoints.push({ 
            label: `W${week}`, 
            registrations: registrationsCount,
            scans: scansCount,
            menuScans: menuScansCount,
            total: registrationsCount + scansCount + menuScansCount
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

  if (!isAdmin) {
    return null;
  }

  const chartConfig = {
    registrations: {
      label: t("admin.registrationsLabel"),
      color: "hsl(var(--primary))",
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
            {/* Account Statistics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
