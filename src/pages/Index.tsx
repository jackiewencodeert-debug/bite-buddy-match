import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Shield, Sparkles, Users, LogOut, Building2, User, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if guest user
    const guestType = localStorage.getItem("userType");
    const guestExpiry = localStorage.getItem("guestExpiry");
    
    if (guestType === "gast" && guestExpiry && Date.now() < parseInt(guestExpiry)) {
      setIsGuest(true);
    } else if (guestExpiry && Date.now() > parseInt(guestExpiry)) {
      // Clear expired guest data
      localStorage.removeItem("userType");
      localStorage.removeItem("guestExpiry");
      localStorage.removeItem("guestPreferences");
      setIsGuest(false);
    }

    // Check current session
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            checkUserType(session.user.id),
            checkAdminRole(session.user.id),
          ]);
        } else {
          // Auto-login as guest if no session and not already a guest
          const currentGuestType = localStorage.getItem("userType");
          if (!currentGuestType) {
            await autoLoginAsGuest();
          }
        }
      } catch (error) {
        console.error("Error initializing user session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        try {
          await Promise.all([
            checkUserType(session.user.id),
            checkAdminRole(session.user.id),
          ]);
        } catch (error) {
          console.error("Error checking user role/type:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset business and admin state when user logs out
        setIsBusiness(false);
        setIsAdmin(false);

        // Auto-login as guest after logout if not already a guest
        if (event === "SIGNED_OUT") {
          const currentGuestType = localStorage.getItem("userType");
          if (!currentGuestType) {
            await autoLoginAsGuest();
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserType = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    
    setIsBusiness(profile?.user_type === "eetgever");
  };

  const checkAdminRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    setIsAdmin(roles?.some(r => r.role === "admin") ?? false);
  };

  const autoLoginAsGuest = async () => {
    localStorage.setItem("userType", "gast");
    // Set guest expiry time (12 hours from now)
    const expiryTime = Date.now() + 12 * 60 * 60 * 1000;
    localStorage.setItem("guestExpiry", expiryTime.toString());
    
    // Log guest registration to database for admin analytics
    try {
      await supabase.from("scans").insert({
        user_id: null,
        scan_method: "guest_registration"
      });
    } catch (error) {
      console.error("Error logging guest registration:", error);
    }
    
    setIsGuest(true);
  };

  const isLoggedIn = user || isGuest;

  const handleLogout = async () => {
    // Clear all session-related localStorage items
    localStorage.removeItem("userType");
    localStorage.removeItem("guestExpiry");
    localStorage.removeItem("guestPreferences");
    
    // Reset all state synchronously BEFORE signOut
    setIsGuest(false);
    setIsBusiness(false);
    setIsAdmin(false);
    setUser(null);
    
    await supabase.auth.signOut();
    
    // Force auto-login as guest immediately
    await autoLoginAsGuest();
    
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>{isBusiness ? "BiteBuddyMatch" : t("index.title")}</span>
            </div>
            <LanguageToggle fixed={false} />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {isBusiness ? t("index.businessTitle") : t("index.title")}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isBusiness ? t("index.businessSubtitle") : t("index.subtitle")}
          </p>

           <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
             {isLoading ? (
               isGuest ? (
                 <Link to="/scan">
                   <Button size="lg" className="text-lg px-8 shadow-hover transition-all hover:scale-105">
                     <Camera className="mr-2 h-5 w-5" />
                     {t("index.scanMenu")}
                   </Button>
                 </Link>
               ) : (
                 <div className="h-12 w-48 bg-muted/50 rounded-lg animate-pulse" />
               )
             ) : isLoggedIn ? (
               <>
                 {isAdmin && (
                   <Link to="/admin">
                     <Button size="lg" variant="outline" className="text-lg px-8 transition-all hover:scale-105 border-primary text-primary">
                       <ShieldCheck className="mr-2 h-5 w-5" />
                       {t("profile.adminDashboard")}
                     </Button>
                   </Link>
                 )}
                 {isBusiness && (
                   <>
                     <Link to="/business">
                       <Button size="lg" className="text-lg px-8 shadow-hover transition-all hover:scale-105">
                         <Building2 className="mr-2 h-5 w-5" />
                         {t("index.businessDashboard")}
                       </Button>
                     </Link>
                     <Button
                       size="lg"
                       variant="outline"
                       className="text-lg px-8 transition-all hover:scale-105"
                       onClick={handleLogout}
                     >
                       <LogOut className="mr-2 h-5 w-5" />
                       {t("profile.logout")}
                     </Button>
                   </>
                 )}
                 {!isBusiness && !isAdmin && !isGuest && (
                   <Button
                     size="lg"
                     variant="outline"
                     className="text-lg px-8 transition-all hover:scale-105"
                     onClick={handleLogout}
                   >
                     <LogOut className="mr-2 h-5 w-5" />
                     {t("profile.logout")}
                   </Button>
                 )}
                 {isGuest && (
                   <Link to="/scan">
                     <Button size="lg" className="text-lg px-8 shadow-hover transition-all hover:scale-105">
                       <Camera className="mr-2 h-5 w-5" />
                       {t("index.scanMenu")}
                     </Button>
                   </Link>
                 )}
               </>
             ) : (
               <Link to="/auth">
                 <Button size="lg" variant="outline" className="text-lg px-8 transition-all hover:scale-105">
                   <Users className="mr-2 h-5 w-5" />
                   {t("auth.signIn")}
                 </Button>
               </Link>
             )}
           </div>

          {/* How It Works - Direct onder Scan Menu */}
          {!isBusiness && !isAdmin && (
            <div className="mt-12 text-left max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">
                {t("index.howItWorksTitle")}
              </h2>
              
              <div className="space-y-6">
                <Step
                  number="1"
                  title={t("index.step1Title")}
                  description={t("index.step1Desc")}
                />
                <Step
                  number="2"
                  title={t("index.step2Title")}
                  description={t("index.step2Desc")}
                />
                <Step
                  number="3"
                  title={t("index.step3Title")}
                  description={t("index.step3Desc")}
                />
              </div>
            </div>
          )}

          {/* Business How It Works */}
          {isBusiness && (
            <div className="mt-12 text-left max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">
                {t("index.howItWorksTitle")}
              </h2>
              
              <div className="space-y-6">
                <Step
                  number="1"
                  title={t("index.businessStep1Title")}
                  description={t("index.businessStep1Desc")}
                />
                <Step
                  number="2"
                  title={t("index.businessStep2Title")}
                  description={t("index.businessStep2Desc")}
                />
                <Step
                  number="3"
                  title={t("index.businessStep3Title")}
                  description={t("index.businessStep3Desc")}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Camera className="h-8 w-8 text-primary" />}
            title={isBusiness ? t("index.businessFeature1Title") : t("index.feature1Title")}
            description={isBusiness ? t("index.businessFeature1Desc") : t("index.feature1Desc")}
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-success" />}
            title={isBusiness ? t("index.businessFeature2Title") : t("index.feature2Title")}
            description={isBusiness ? t("index.businessFeature2Desc") : t("index.feature2Desc")}
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8 text-warning" />}
            title={isBusiness ? t("index.businessFeature3Title") : t("index.feature3Title")}
            description={isBusiness ? t("index.businessFeature3Desc") : t("index.feature3Desc")}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-warm p-12 rounded-3xl shadow-hover">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isLoggedIn 
              ? (isBusiness ? t("index.businessReadyTitle") : t("index.readyTitle"))
              : t("index.readyTitleLoggedOut")}
          </h2>
          <p className="text-lg text-white/90 mb-8">
            {isLoggedIn ? t("index.readyDesc") : t("index.readyDescLoggedOut")}
          </p>
          {isLoggedIn && isBusiness && (
            <Link to="/business">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Building2 className="mr-2 h-5 w-5" />
                {t("index.businessDashboard")}
              </Button>
            </Link>
          )}
          {isLoggedIn && !isBusiness && !isAdmin && (
            <Link to="/scan">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Camera className="mr-2 h-5 w-5" />
                {t("index.scanMenu")}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* App Guidelines - Only for non-business users */}
      {!isBusiness && (
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-3xl mx-auto">
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
        </section>
      )}
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card p-8 rounded-2xl border border-border shadow-soft hover:shadow-hover transition-all hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const Step = ({ number, title, description }: { number: string; title: string; description: string }) => {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-soft">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default Index;
