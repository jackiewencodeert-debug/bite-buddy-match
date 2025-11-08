import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Shield, Sparkles, Users, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <LanguageToggle />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t("index.title")}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {t("index.title")}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("index.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/scan">
              <Button size="lg" className="text-lg px-8 shadow-hover transition-all hover:scale-105">
                <Camera className="mr-2 h-5 w-5" />
                {t("index.scanMenu")}
              </Button>
            </Link>
            {user ? (
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 transition-all hover:scale-105"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                {t("profile.logout")}
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 transition-all hover:scale-105">
                  <Users className="mr-2 h-5 w-5" />
                  {t("auth.signIn")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Camera className="h-8 w-8 text-primary" />}
            title={t("index.feature1Title")}
            description={t("index.feature1Desc")}
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-success" />}
            title={t("index.feature2Title")}
            description={t("index.feature2Desc")}
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8 text-warning" />}
            title={t("index.feature3Title")}
            description={t("index.feature3Desc")}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t("index.howItWorksTitle")}
          </h2>
          
          <div className="space-y-8">
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
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-warm p-12 rounded-3xl shadow-hover">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("index.readyTitle")}
          </h2>
          <p className="text-lg text-white/90 mb-8">
            {t("index.readyDesc")}
          </p>
          <Link to="/scan">
            <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Camera className="mr-2 h-5 w-5" />
              {t("index.scanMenu")}
            </Button>
          </Link>
        </div>
      </section>
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
