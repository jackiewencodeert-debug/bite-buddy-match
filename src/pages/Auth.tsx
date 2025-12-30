import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
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

// Validation schema - error messages are handled via translations in component
const createAuthSchema = (t: (key: string) => string) => z.object({
  email: z.string().trim().email(t("auth.invalidEmail")).max(255, t("auth.emailTooLong")),
  password: z.string().min(6, t("auth.passwordTooShort")).max(128, t("auth.passwordTooLong")),
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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({
        title: t("auth.resetEmailRequired"),
        description: t("auth.resetEmailRequiredDesc"),
        variant: "destructive",
      });
      setShowResetDialog(false);
      return;
    }

    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: t("auth.resetInvalidEmail"),
        description: t("auth.resetInvalidEmailDesc"),
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
        title: t("auth.resetEmailSent"),
        description: t("auth.resetEmailSentDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("auth.resetError"),
        description: error.message || t("auth.resetErrorDesc"),
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
    // Check if user is already logged in and redirect appropriately
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is admin first
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminRole) {
        navigate("/admin");
        return;
      }

      // Check user type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();

      if (profile?.user_type === "eetgever") {
        navigate("/business");
      } else {
        // Regular user (eter) - check if preferences exist
        const { data: preferences } = await supabase
          .from("preferences")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (!preferences || preferences.length === 0) {
          navigate("/profile");
        } else {
          navigate("/");
        }
      }
    };

    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs with zod
    const authSchema = createAuthSchema(t);
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: t("auth.validationError"),
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

        // Check if user is admin first
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        toast({
          title: t("auth.loginSuccess"),
          description: t("auth.loginSuccessDesc"),
        });

        // Redirect admins to admin dashboard
        if (adminRole) {
          navigate("/admin");
          return;
        }

        // Check user type and redirect accordingly
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        // Redirect business users to business dashboard
        if (profile?.user_type === "eetgever") {
          navigate("/business");
        } else {
          // Check if user has any preferences set
          const { data: preferences } = await supabase
            .from("preferences")
            .select("id")
            .eq("user_id", data.user.id)
            .limit(1);

          // If no preferences, go to profile to set them
          if (!preferences || preferences.length === 0) {
            navigate("/profile");
          } else {
            // User has preferences, go to main page
            navigate("/");
          }
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
          title: t("auth.signUpSuccess"),
          description: t("auth.signUpSuccessDesc"),
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || t("auth.genericError"),
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
                    placeholder={t("auth.emailPlaceholder")}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      required
                      disabled={loading}
                      minLength={6}
                      className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                      {t("auth.forgotPassword")}
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
            <AlertDialogTitle>{t("auth.resetPasswordTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {email 
                ? t("auth.resetPasswordDesc").replace("{email}", email)
                : t("auth.resetPasswordDescNoEmail")
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>{t("auth.resetNo")}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={resetLoading}>
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.resetSending")}
                </>
              ) : (
                t("auth.resetYes")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
