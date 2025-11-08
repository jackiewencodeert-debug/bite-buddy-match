import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        variant={language === "nl" ? "default" : "outline"}
        size="icon"
        className="rounded-full w-12 h-12 p-0 overflow-hidden"
        onClick={() => setLanguage("nl")}
        title="Nederlands"
      >
        <span className="text-2xl">🇳🇱</span>
      </Button>
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="icon"
        className="rounded-full w-12 h-12 p-0 overflow-hidden"
        onClick={() => setLanguage("en")}
        title="English"
      >
        <span className="text-2xl">🇬🇧</span>
      </Button>
    </div>
  );
};
