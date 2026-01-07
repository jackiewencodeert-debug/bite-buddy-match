import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    nl: {
      title: "Cookiebeleid",
      lastUpdated: "Laatst bijgewerkt: 7 januari 2025",
      intro: "Dit cookiebeleid legt uit wat cookies zijn, hoe wij ze gebruiken en uw rechten om ze te beheren, in overeenstemming met de EU ePrivacy Richtlijn en AVG/GDPR.",
      sections: [
        {
          title: "1. Wat zijn cookies?",
          content: "Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u onze website bezoekt. Ze helpen ons om uw voorkeuren te onthouden en onze diensten te verbeteren."
        },
        {
          title: "2. Soorten cookies die wij gebruiken",
          content: `Strikt noodzakelijke cookies:
• Sessiecookies voor inloggen en authenticatie
• Taalvoorkeur cookie
• Cookie-toestemmingscookie

Analytische cookies (alleen met toestemming):
• Geanonimiseerde gebruiksstatistieken
• Foutregistratie voor app-verbetering

Wij gebruiken GEEN:
• Tracking cookies van derden
• Advertentiecookies
• Social media tracking pixels`
        },
        {
          title: "3. Cookies beheren",
          content: `U kunt cookies beheren via:
• De cookiebanner bij uw eerste bezoek
• Uw browserinstellingen
• Cookies verwijderen via browsergeschiedenis

Let op: Het uitschakelen van essentiële cookies kan de werking van de app beïnvloeden.`
        },
        {
          title: "4. Cookie-levensduur",
          content: `• Sessiecookies: Verwijderd bij sluiten browser
• Voorkeurscookies: 1 jaar
• Analytische cookies: 2 jaar`
        },
        {
          title: "5. Uw rechten (GDPR/AVG)",
          content: `Onder de AVG heeft u het recht om:
• Toestemming te weigeren voor niet-essentiële cookies
• Eerder gegeven toestemming in te trekken
• Te weten welke gegevens wij verzamelen
• Verwijdering van uw gegevens te verzoeken`
        },
        {
          title: "6. Contact",
          content: "Voor vragen over ons cookiebeleid: privacy@bitebuddymatch.com"
        }
      ]
    },
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last updated: January 7, 2025",
      intro: "This cookie policy explains what cookies are, how we use them, and your rights to manage them, in compliance with the EU ePrivacy Directive and GDPR.",
      sections: [
        {
          title: "1. What are cookies?",
          content: "Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve our services."
        },
        {
          title: "2. Types of cookies we use",
          content: `Strictly necessary cookies:
• Session cookies for login and authentication
• Language preference cookie
• Cookie consent cookie

Analytical cookies (with consent only):
• Anonymized usage statistics
• Error logging for app improvement

We do NOT use:
• Third-party tracking cookies
• Advertising cookies
• Social media tracking pixels`
        },
        {
          title: "3. Managing cookies",
          content: `You can manage cookies through:
• The cookie banner on your first visit
• Your browser settings
• Clearing cookies via browser history

Note: Disabling essential cookies may affect app functionality.`
        },
        {
          title: "4. Cookie duration",
          content: `• Session cookies: Deleted when browser closes
• Preference cookies: 1 year
• Analytical cookies: 2 years`
        },
        {
          title: "5. Your rights (GDPR)",
          content: `Under GDPR you have the right to:
• Refuse consent for non-essential cookies
• Withdraw previously given consent
• Know what data we collect
• Request deletion of your data`
        },
        {
          title: "6. Contact",
          content: "For questions about our cookie policy: privacy@bitebuddymatch.com"
        }
      ]
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'nl' ? 'Terug' : 'Back'}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>
        <p className="text-foreground mb-8">{t.intro}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-foreground mb-3">{section.title}</h2>
              <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
