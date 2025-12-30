import { useLocation } from "react-router-dom";
import { BottomNavBar } from "./BottomNavBar";
import { AdBanner } from "./AdBanner";
import { TempBanner } from "./TempBanner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [showNavBar, setShowNavBar] = useState(true);

  useEffect(() => {
    checkShowNavBar();
    
    // Listen for auth state changes to update navbar visibility
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // User logged out, show navbar for guests immediately
        if (
          !location.pathname.startsWith("/business") &&
          !location.pathname.startsWith("/admin") &&
          !location.pathname.startsWith("/auth") &&
          !location.pathname.startsWith("/reset-password")
        ) {
          setShowNavBar(true);
        }
      } else if (session?.user) {
        // Re-check on other auth events with user data
        checkShowNavBarForUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const checkShowNavBarForUser = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    
    if (profile?.user_type === "eetgever") {
      setShowNavBar(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (roles?.some(r => r.role === "admin")) {
      setShowNavBar(false);
      return;
    }

    setShowNavBar(true);
  };

  const checkShowNavBar = async () => {
    // Hide on business and admin pages
    if (
      location.pathname.startsWith("/business") ||
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/auth") ||
      location.pathname.startsWith("/reset-password")
    ) {
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
        .single();
      
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

    setShowNavBar(true);
  };

  // Calculate extra padding for bottom nav (h-16 = 4rem) and ad banner (7vh)
  // Ad banner shows for guests AND logged-in regular users
  const bottomPadding = showNavBar ? "pb-[calc(4rem+7vh)]" : "";

  return (
    <div className={`min-h-screen ${bottomPadding}`}>
      <TempBanner />
      {children}
      {showNavBar && (
        <>
          <AdBanner />
          <BottomNavBar />
        </>
      )}
    </div>
  );
};
