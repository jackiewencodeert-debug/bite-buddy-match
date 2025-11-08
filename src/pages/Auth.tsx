import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"eter" | "eetgever" | "gast">("eter");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGuestContinue = () => {
    localStorage.setItem("userType", "gast");
    toast({
      title: "Welkom als gast!",
      description: "Je kunt nu direct beginnen met scannen.",
    });
    navigate("/profile");
  };

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
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welkom terug!",
          description: "Je bent succesvol ingelogd.",
        });
        navigate("/profile");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Inloggen" : "Account Aanmaken"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Log in om je voorkeuren en scan-historie te bekijken"
              : "Maak een account om je voorkeuren op te slaan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={userType === "eter" ? "default" : "outline"}
                    onClick={() => setUserType("eter")}
                    disabled={loading}
                    className="w-full"
                  >
                    Eter
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "eetgever" ? "default" : "outline"}
                    onClick={() => setUserType("eetgever")}
                    disabled={loading}
                    className="w-full"
                  >
                    Bedrijf
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "gast" ? "default" : "outline"}
                    onClick={() => setUserType("gast")}
                    disabled={loading}
                    className="w-full"
                  >
                    Gast
                  </Button>
                </div>
                {userType === "gast" && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Als gast kun je direct beginnen zonder account. Je voorkeuren worden tijdelijk opgeslagen.
                    </p>
                    <Button
                      type="button"
                      onClick={handleGuestContinue}
                      className="w-full"
                      disabled={loading}
                    >
                      Doorgaan als Gast
                    </Button>
                  </div>
                )}
              </div>
            )}
            {(isLogin || (!isLogin && userType !== "gast")) && (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mailadres
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Wachtwoord
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : isLogin ? (
                    "Inloggen"
                  ) : (
                    "Account Aanmaken"
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
                ? "Nog geen account? Registreer hier"
                : "Al een account? Log hier in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
