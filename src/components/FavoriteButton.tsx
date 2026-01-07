import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface FavoriteButtonProps {
  dishId: string;
  menuId: string;
  dishName: string;
}

export const FavoriteButton = ({ dishId, menuId, dishName }: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAuth();
  }, [dishId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      checkFavorite(user.id);
    } else {
      // Check localStorage for guest favorites
      const guestFavorites = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      setIsFavorite(guestFavorites.includes(dishId));
    }
  };

  const checkFavorite = async (uid: string) => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", uid)
      .eq("dish_id", dishId)
      .maybeSingle();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    setLoading(true);
    
    try {
      if (userId) {
        // Logged in user
        if (isFavorite) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", userId)
            .eq("dish_id", dishId);
          
          setIsFavorite(false);
          toast({
            title: t("favorites.removed"),
            description: dishName,
          });
        } else {
          await supabase
            .from("favorites")
            .insert({
              user_id: userId,
              dish_id: dishId,
              menu_id: menuId,
            });
          
          setIsFavorite(true);
          toast({
            title: t("favorites.added"),
            description: dishName,
          });
        }
      } else {
        // Guest user - use localStorage
        const guestFavorites = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
        
        if (isFavorite) {
          const updated = guestFavorites.filter((id: string) => id !== dishId);
          localStorage.setItem("guestFavorites", JSON.stringify(updated));
          setIsFavorite(false);
          toast({
            title: t("favorites.removed"),
            description: dishName,
          });
        } else {
          guestFavorites.push(dishId);
          localStorage.setItem("guestFavorites", JSON.stringify(guestFavorites));
          setIsFavorite(true);
          toast({
            title: t("favorites.added"),
            description: dishName,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={`h-8 w-8 transition-all ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
      aria-label={isFavorite ? t("favorites.remove") : t("favorites.add")}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
};
