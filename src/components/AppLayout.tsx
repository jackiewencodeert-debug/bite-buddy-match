import { useLocation } from "react-router-dom";
import { BottomNavBar } from "./BottomNavBar";
import { AdBanner } from "./AdBanner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [showNavBar, setShowNavBar] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Determine navbar visibility based on current path and user type
  const checkShowNavBar = async () => {
    // Prevent multiple simultaneous checks
    if (isChecking) return;
    setIsChecking(true);

    try {
      // Hide on specific pages
      const hiddenPaths = ["/business", "/admin", "/auth", "/reset-password"];
      const shouldHideForPath = hiddenPaths.some(path => location.pathname.startsWith(path));
      
      if (shouldHideForPath) {
        setShowNavBar(false);
        return;
      }

      // Check if user is business or admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.user_type === "eetgever") {
          setShowNavBar(false);
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        if (roles?.some(r => r.role === "admin")) {
          setShowNavBar(false);
          return;
        }
      }

      // Default: show navbar for regular users and guests
      setShowNavBar(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Run check on mount and whenever path changes
  useEffect(() => {
    checkShowNavBar();
  }, [location.pathname, location.key]); // location.key changes on every navigation including back/forward

  // Also listen to popstate for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // Small delay to ensure location has updated
      setTimeout(() => {
        checkShowNavBar();
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Re-check navbar visibility on auth changes
      setTimeout(() => {
        checkShowNavBar();
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  // Calculate extra padding for bottom nav (h-16 = 4rem) and ad banner (7vh)
  const bottomPadding = showNavBar ? "pb-[calc(4rem+7vh)]" : "";

  return (
    <div className={`min-h-screen ${bottomPadding}`}>
      {children}
      {/* AdBanner manages its own visibility logic */}
      <AdBanner />
      {showNavBar && <BottomNavBar />}
    </div>
  );
};
