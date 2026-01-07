import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRegion } from "@/hooks/useRegion";

export const RegionalFooter = () => {
  const { t } = useLanguage();
  const regionInfo = useRegion();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          {/* Main links - always shown */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>© 2025 BiteBuddyMatch</span>
            <span className="hidden sm:inline">•</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {t("footer.privacy")}
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              {t("footer.terms")}
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">
              {t("footer.disclaimer")}
            </Link>
          </div>

          {/* Region-specific links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {/* EU: GDPR Cookie Policy */}
            {regionInfo.requiresGDPR && (
              <Link to="/cookies" className="hover:text-primary transition-colors">
                {t("footer.cookiePolicy")}
              </Link>
            )}

            {/* California: CCPA */}
            {regionInfo.requiresCCPA && (
              <Link to="/ccpa" className="hover:text-primary transition-colors">
                {t("footer.ccpa")}
              </Link>
            )}

            {/* US/EU: Accessibility */}
            {regionInfo.requiresAccessibility && (
              <Link to="/accessibility" className="hover:text-primary transition-colors">
                {t("footer.accessibility")}
              </Link>
            )}

            {/* Brazil: LGPD notice in privacy policy */}
            {regionInfo.requiresLGPD && (
              <Link to="/privacy" className="hover:text-primary transition-colors">
                {t("footer.lgpd")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
