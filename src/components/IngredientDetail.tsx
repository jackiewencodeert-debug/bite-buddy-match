import { useState } from "react";
import { Info, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IngredientDetailProps {
  ingredient: string;
  matchedAllergens: string[];
  allAllergens: string[];
  userAllergies: string[];
}

export const IngredientDetail = ({ 
  ingredient, 
  matchedAllergens, 
  allAllergens,
  userAllergies 
}: IngredientDetailProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const isRisky = matchedAllergens.length > 0;
  const hasWarning = allAllergens.some(a => 
    ingredient.toLowerCase().includes(a.toLowerCase())
  );

  return (
    <>
      <Badge
        variant="secondary"
        className={`text-xs cursor-pointer transition-all hover:scale-105 ${
          isRisky 
            ? "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30" 
            : hasWarning
            ? "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
            : "hover:bg-secondary/80"
        }`}
        onClick={() => setOpen(true)}
      >
        {ingredient}
        {(isRisky || hasWarning) && <Info className="h-3 w-3 ml-1" />}
      </Badge>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isRisky && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {ingredient}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isRisky ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t("ingredientDetail.warning")}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("ingredientDetail.containsAllergen")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchedAllergens.map((allergen) => (
                    <Badge key={allergen} variant="destructive">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : hasWarning ? (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <h4 className="font-semibold text-warning mb-2">
                  {t("ingredientDetail.caution")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("ingredientDetail.mayContain")}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h4 className="font-semibold text-success mb-2">
                  {t("ingredientDetail.safe")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("ingredientDetail.noAllergens")}
                </p>
              </div>
            )}

            {userAllergies.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">{t("ingredientDetail.yourAllergies")}</h4>
                <div className="flex flex-wrap gap-2">
                  {userAllergies.map((allergy) => (
                    <Badge 
                      key={allergy} 
                      variant="outline"
                      className={matchedAllergens.includes(allergy) ? "border-destructive text-destructive" : ""}
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
