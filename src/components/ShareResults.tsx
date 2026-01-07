import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareResultsProps {
  menuName: string;
  safeCount: number;
  cautionCount: number;
  avoidCount: number;
}

export const ShareResults = ({ menuName, safeCount, cautionCount, avoidCount }: ShareResultsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const getShareText = () => {
    return `🍽️ ${menuName}\n\n${t("share.results")}:\n✅ ${safeCount} ${t("results.safe")}\n⚠️ ${cautionCount} ${t("results.adjustable")}\n❌ ${avoidCount} ${t("results.containsAllergens")}\n\n${t("share.scannedWith")} BiteBuddyMatch`;
  };

  const handleShare = async () => {
    const shareText = getShareText();
    const shareUrl = window.location.href;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: menuName,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: t("share.shared"),
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          fallbackCopy(shareText + "\n\n" + shareUrl);
        }
      }
    } else {
      fallbackCopy(shareText + "\n\n" + shareUrl);
    }
  };

  const fallbackCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: t("share.copied"),
        description: t("share.copiedDesc"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("common.error"),
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          {t("share.copied")}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {t("share.share")}
        </>
      )}
    </Button>
  );
};
