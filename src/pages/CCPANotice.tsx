import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CCPANotice = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "California Privacy Notice (CCPA)",
      lastUpdated: "Last updated: January 7, 2025",
      intro: "This notice is provided pursuant to the California Consumer Privacy Act (CCPA) and applies to California residents.",
      sections: [
        {
          title: "1. Information We Collect",
          content: `Categories of personal information we collect:
• Identifiers: Email address, device identifiers
• Personal information: Allergy and dietary preferences
• Internet activity: App usage data, menu scan history
• Geolocation: General location for language preferences

We collect this information directly from you when you use our app.`
        },
        {
          title: "2. How We Use Your Information",
          content: `We use your information to:
• Provide and improve our allergy-matching services
• Personalize your menu recommendations
• Analyze app usage to improve functionality
• Communicate important updates

We do NOT sell your personal information.`
        },
        {
          title: "3. Your California Rights",
          content: `As a California resident, you have the right to:

Right to Know: Request disclosure of personal information collected, used, and shared.

Right to Delete: Request deletion of your personal information.

Right to Opt-Out: We do not sell personal information, so this right does not apply.

Right to Non-Discrimination: We will not discriminate against you for exercising your rights.`
        },
        {
          title: "4. Exercising Your Rights",
          content: `To exercise your rights, you may:
• Email us at: privacy@bitebuddymatch.com
• Delete your account through app settings
• Request a copy of your data

We will respond to verifiable requests within 45 days.`
        },
        {
          title: "5. Do Not Sell My Information",
          content: "BiteBuddyMatch does not sell personal information to third parties. We do not share your allergy data or preferences with advertisers or data brokers."
        },
        {
          title: "6. Contact for California Residents",
          content: "California residents may contact us at: privacy@bitebuddymatch.com\n\nSubject line: 'California Privacy Request'"
        }
      ]
    }
  };

  const t = content.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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

export default CCPANotice;
