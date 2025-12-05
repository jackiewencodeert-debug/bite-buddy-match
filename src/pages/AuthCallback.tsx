import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment for token-based auth
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type") || searchParams.get("type");

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(sessionError.message);
            return;
          }
        } else {
          // Check for error in URL params
          const errorDescription = searchParams.get("error_description");
          if (errorDescription) {
            setError(errorDescription);
            return;
          }

          // Try to get existing session
          const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
          
          if (getSessionError) {
            console.error("Get session error:", getSessionError);
            setError(getSessionError.message);
            return;
          }

          if (!session) {
            // No session found, redirect to auth
            navigate("/auth");
            return;
          }
        }

        // Successfully authenticated, redirect to profile
        navigate("/profile", { replace: true });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Er is iets misgegaan");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Verificatie mislukt</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline"
          >
            Terug naar inloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Account wordt geverifieerd...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
