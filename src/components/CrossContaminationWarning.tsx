import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CrossContaminationWarningProps {
  risks: string[];
  userAllergies: string[];
}

export const CrossContaminationWarning = ({ risks, userAllergies }: CrossContaminationWarningProps) => {
  const { t } = useLanguage();

  if (!risks || risks.length === 0) {
    return null;
  }

  // Check if any risks match user allergies
  const matchedRisks = risks.filter(risk => 
    userAllergies.some(allergy => 
      risk.toLowerCase().includes(allergy.toLowerCase()) ||
      allergy.toLowerCase().includes(risk.toLowerCase())
    )
  );

  const hasUserRisk = matchedRisks.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-help ${
              hasUserRisk 
                ? "bg-orange-500/20 text-orange-600 border-orange-500/30" 
                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
            }`}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t("crossContamination.label")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{t("crossContamination.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("crossContamination.description")}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {risks.map((risk) => (
                <Badge 
                  key={risk} 
                  variant="secondary" 
                  className={`text-xs ${
                    matchedRisks.includes(risk) 
                      ? "bg-orange-500/20 text-orange-600" 
                      : ""
                  }`}
                >
                  {risk}
                </Badge>
              ))}
            </div>
            {hasUserRisk && (
              <p className="text-xs text-orange-600 font-medium pt-1">
                ⚠️ {t("crossContamination.matchesYourAllergy")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
