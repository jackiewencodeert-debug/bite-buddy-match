import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdSenseAd } from "./AdSenseAd";

export const AdBanner = () => {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);

  const checkShouldShowBanner = async (pathname: string) => {
    // Never show on business, admin or menu pages
    if (
      pathname.startsWith("/business") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/menu/")
    ) {
      setShowBanner(false);
      return;
    }

    // If not logged in -> show banner (this fixes missing banner after logout)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowBanner(true);
      return;
    }

    // Logged-in: hide for business users
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile?.user_type === "eetgever") {
      setShowBanner(false);
      return;
    }

    // Logged-in: hide for admins
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles?.some((r) => r.role === "admin")) {
      setShowBanner(false);
      return;
    }

    // Logged-in regular user
    setShowBanner(true);
  };

  useEffect(() => {
    const pathname = location.pathname;
    checkShouldShowBanner(pathname);

    // Re-check when auth changes (e.g. logout) even if pathname doesn't change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Avoid calling Supabase directly inside the callback
      setTimeout(() => {
        checkShouldShowBanner(window.location.pathname);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 bg-background border-t border-border h-[7vh]">
      <div className="max-w-lg mx-auto h-full">
        <AdSenseAd
          adSlot="7704507845"
          adFormat="horizontal"
          fullWidthResponsive={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

