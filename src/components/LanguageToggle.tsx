import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const languages = [
  { code: "nl", flag: "🇳🇱", name: "Nederlands" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "hu", flag: "🇭🇺", name: "Magyar" },
  { code: "id", flag: "🇮🇩", name: "Indonesia" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
  { code: "th", flag: "🇹🇭", name: "ไทย" },
  { code: "uk", flag: "🇺🇦", name: "Українська" },
  { code: "pt", flag: "🇵🇹", name: "Português" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
] as const;

interface LanguageToggleProps {
  fixed?: boolean;
}

export const LanguageToggle = ({ fixed = true }: LanguageToggleProps) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef} 
      className={`z-50 ${fixed ? "fixed top-4 right-4" : "relative"}`}
    >
      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-3 py-2 h-auto gap-1 bg-background/80 backdrop-blur-sm border-border hover:bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xl">{currentLang.flag}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-background border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                language === lang.code ? "bg-primary/10" : ""
              }`}
              onClick={() => {
                setLanguage(lang.code as any);
                setIsOpen(false);
              }}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
