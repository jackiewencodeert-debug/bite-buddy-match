import { WifiOff, Check, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface OfflineIndicatorProps {
  isOffline: boolean;
  isCached: boolean;
  onSaveOffline?: () => Promise<void>;
  showSaveButton?: boolean;
}

export const OfflineIndicator = ({ 
  isOffline, 
  isCached, 
  onSaveOffline,
  showSaveButton = true 
}: OfflineIndicatorProps) => {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveOffline) return;
    setSaving(true);
    try {
      await onSaveOffline();
    } finally {
      setSaving(false);
    }
  };

  if (isOffline) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
          <WifiOff className="h-3 w-3 mr-1" />
          {t("offline.offlineMode")}
        </Badge>
        {isCached && (
          <span className="text-xs text-muted-foreground">
            {t("offline.usingCached")}
          </span>
        )}
      </div>
    );
  }

  if (showSaveButton && !isCached && onSaveOffline) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSave}
        disabled={saving}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {saving ? t("offline.saving") : t("offline.saveOffline")}
      </Button>
    );
  }

  if (isCached) {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        <Check className="h-3 w-3 mr-1" />
        {t("offline.availableOffline")}
      </Badge>
    );
  }

  return null;
};
