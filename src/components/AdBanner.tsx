import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdSenseAd } from "./AdSenseAd";

export const AdBanner = () => {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    checkShouldShowBanner();
  }, [location.pathname]);

  const checkShouldShowBanner = async () => {
    // Never show on business or admin pages
    if (
      location.pathname.startsWith("/business") ||
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/menu/") // Menu editor pages
    ) {
      setShowBanner(false);
      return;
    }

    // Check if user is logged in (not guest)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if business user
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      
      if (profile?.user_type === "eetgever") {
        setShowBanner(false);
        return;
      }

      // Check if admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (roles?.some(r => r.role === "admin")) {
        setShowBanner(false);
        return;
      }

      // Logged in regular user (not business, not admin) - show banner
      setShowBanner(true);
      return;
    }

    // Guest user - show banner
    const guestType = localStorage.getItem("userType");
    if (guestType === "gast") {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-lg mx-auto">
        <AdSenseAd 
          adSlot="7704507845" 
          adFormat="horizontal" 
          fullWidthResponsive={true}
          className="w-full"
        />
      </div>
    </div>
  );
};
