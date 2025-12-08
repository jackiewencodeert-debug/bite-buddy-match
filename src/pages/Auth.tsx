import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const authSchema = z.object({
  email: z.string().trim().email("Ongeldig e-mailadres").max(255, "E-mail is te lang"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 tekens bevatten").max(128, "Wachtwoord is te lang"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"eter" | "eetgever" | "gast">("eter");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({
        title: "E-mail vereist",
        description: "Vul eerst je e-mailadres in om je wachtwoord te resetten.",
        variant: "destructive",
      });
      setShowResetDialog(false);
      return;
    }

    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: "Ongeldig e-mailadres",
        description: "Vul een geldig e-mailadres in.",
        variant: "destructive",
      });
      setShowResetDialog(false);
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      toast({
        title: "E-mail verzonden!",
        description: "Check je inbox voor de link om je wachtwoord te resetten.",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
      setShowResetDialog(false);
    }
  };

  const handleGuestContinue = () => {
    localStorage.setItem("userType", "gast");
    // Set guest expiry time (24 hours from now)
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("guestExpiry", expiryTime.toString());
    
    // Log guest registration to database
    logGuestRegistration();
    
    toast({
      title: t("auth.guestWelcome"),
      description: t("auth.guestWelcomeDesc"),
    });
    navigate("/profile");
  };

  const logGuestRegistration = async () => {
    try {
      await supabase.from("scans").insert({
        user_id: null,
        scan_method: "guest_registration",
      });
    } catch (error) {
      console.error("Error logging guest registration:", error);
    }
  };

  // Check and clear expired guest data
  useEffect(() => {
    const guestExpiry = localStorage.getItem("guestExpiry");
    if (guestExpiry && Date.now() > parseInt(guestExpiry)) {
      localStorage.removeItem("userType");
      localStorage.removeItem("guestExpiry");
      localStorage.removeItem("guestPreferences");
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/profile");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs with zod
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Validatiefout",
        description: Object.values(fieldErrors).join(". "),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check user type and redirect accordingly
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        toast({
          title: "Welkom terug!",
          description: "Je bent succesvol ingelogd.",
        });

        // Redirect business users to business dashboard
        if (profile?.user_type === "eetgever") {
          navigate("/business");
        } else {
          navigate("/profile");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              user_type: userType,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account aangemaakt!",
          description: "Check je e-mail om je account te bevestigen.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Er is iets misgegaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <LanguageToggle />
      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("scan.back")}
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("auth.welcome")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("auth.userType")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={userType === "eter" ? "default" : "outline"}
                    onClick={() => setUserType("eter")}
                    disabled={loading}
                    className="w-full flex flex-col h-auto py-4"
                  >
                    <span className="font-semibold">{t("auth.diner")}</span>
                    <span className="text-xs mt-1 opacity-80">{t("auth.dinerDesc")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "eetgever" ? "default" : "outline"}
                    onClick={() => setUserType("eetgever")}
                    disabled={loading}
                    className="w-full flex flex-col h-auto py-4"
                  >
                    <span className="font-semibold">{t("auth.business")}</span>
                    <span className="text-xs mt-1 opacity-80">{t("auth.businessDesc")}</span>
                  </Button>
                </div>
              </div>
            )}
            {(isLogin || (!isLogin && userType !== "gast")) && (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t("auth.email")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    required
                    disabled={loading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    {t("auth.password")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    required
                    disabled={loading}
                    minLength={6}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowResetDialog(true)}
                      className="text-sm text-primary hover:underline"
                      disabled={loading}
                    >
                      Wachtwoord vergeten?
                    </button>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : isLogin ? (
                    t("auth.signIn")
                  ) : (
                    t("auth.signUp")
                  )}
                </Button>
              </>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? `${t("auth.noAccount")} ${t("auth.signUpLink")}`
                : `${t("auth.alreadyAccount")} ${t("auth.signInLink")}`}
            </button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wachtwoord resetten</AlertDialogTitle>
            <AlertDialogDescription>
              Wil je een nieuw wachtwoord aanmaken? We sturen een e-mail naar {email || "het opgegeven adres"} met een link om je wachtwoord te resetten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>Nee</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={resetLoading}>
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verzenden...
                </>
              ) : (
                "Ja"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
