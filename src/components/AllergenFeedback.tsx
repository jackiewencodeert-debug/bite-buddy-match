import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, ThumbsUp, AlertTriangle, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Dish {
  id: string;
  name: string;
  ingredients: string[];
  allergens?: string[];
}

interface AllergenFeedbackProps {
  dish: Dish;
  userAllergies?: string[];
}

const commonAllergens = [
  "noten", "gluten", "lactose", "schaaldieren", "vis", 
  "eieren", "soja", "sulfiet", "selderij", "mosterd", 
  "sesam", "weekdieren", "lupine", "pinda"
];

export const AllergenFeedback = ({ dish, userAllergies = [] }: AllergenFeedbackProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"confirm" | "correct">("confirm");
  const [missedAllergens, setMissedAllergens] = useState<string[]>([]);
  const [falsePositives, setFalsePositives] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("allergen_feedback").insert({
        user_id: user?.id || null,
        dish_name: dish.name,
        detected_allergens: dish.allergens || [],
        confirmed_allergens: feedbackType === "confirm" ? (dish.allergens || []) : [],
        missed_allergens: missedAllergens,
        false_positives: falsePositives,
        ingredients: dish.ingredients,
        feedback_type: feedbackType === "confirm" ? "confirmation" : "correction",
      });

      toast({
        title: t("feedback.thankYou"),
        description: t("feedback.thankYouDesc"),
      });

      setIsOpen(false);
      setMissedAllergens([]);
      setFalsePositives([]);
      setFeedbackType("confirm");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: t("feedback.error"),
        description: t("feedback.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMissedAllergen = (allergen: string) => {
    setMissedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const toggleFalsePositive = (allergen: string) => {
    setFalsePositives(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim() && !missedAllergens.includes(customAllergen.toLowerCase())) {
      setMissedAllergens(prev => [...prev, customAllergen.toLowerCase().trim()]);
      setCustomAllergen("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
          <MessageSquare className="h-3 w-3" />
          {t("feedback.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("feedback.title")}
          </DialogTitle>
          <DialogDescription>
            {t("feedback.description").replace("{dish}", dish.name)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current detected allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div>
              <Label className="text-sm font-medium">{t("feedback.detectedAllergens")}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {dish.allergens.map((allergen, idx) => (
                  <Badge key={idx} variant="secondary">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Feedback type selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("feedback.areCorrect")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={feedbackType === "confirm" ? "default" : "outline"}
                onClick={() => setFeedbackType("confirm")}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                {t("feedback.yesCorrect")}
              </Button>
              <Button
                type="button"
                variant={feedbackType === "correct" ? "default" : "outline"}
                onClick={() => setFeedbackType("correct")}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("feedback.noAdjust")}
              </Button>
            </div>
          </div>

          {/* Correction form */}
          {feedbackType === "correct" && (
            <>
              {/* False positives */}
              {dish.allergens && dish.allergens.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t("feedback.falsePositives")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {dish.allergens.map((allergen, idx) => (
                      <Badge
                        key={idx}
                        variant={falsePositives.includes(allergen) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFalsePositive(allergen)}
                      >
                        {allergen}
                        {falsePositives.includes(allergen) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missed allergens */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("feedback.missedAllergens")}
                </Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {commonAllergens
                    .filter(a => !dish.allergens?.includes(a))
                    .map((allergen, idx) => (
                      <Badge
                        key={idx}
                        variant={missedAllergens.includes(allergen) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleMissedAllergen(allergen)}
                      >
                        {missedAllergens.includes(allergen) && <Plus className="h-3 w-3 mr-1" />}
                        {allergen}
                      </Badge>
                    ))}
                </div>
                
                {/* Custom allergen input */}
                <div className="flex gap-2">
                  <Input
                    placeholder={t("feedback.otherAllergen")}
                    value={customAllergen}
                    onChange={(e) => setCustomAllergen(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllergen())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addCustomAllergen}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Show added missed allergens */}
                {missedAllergens.filter(a => !commonAllergens.includes(a)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {missedAllergens
                      .filter(a => !commonAllergens.includes(a))
                      .map((allergen, idx) => (
                        <Badge
                          key={idx}
                          variant="default"
                          className="cursor-pointer"
                          onClick={() => toggleMissedAllergen(allergen)}
                        >
                          {allergen}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit button */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="w-full"
          >
            {submitting ? t("feedback.submitting") : t("feedback.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
