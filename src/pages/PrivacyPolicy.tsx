import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    nl: {
      title: "Privacybeleid",
      lastUpdated: "Laatst bijgewerkt: 7 januari 2025",
      intro: "BiteBuddyMatch respecteert uw privacy en zet zich in voor de bescherming van uw persoonlijke gegevens. Dit privacybeleid beschrijft hoe wij informatie verzamelen, gebruiken en beschermen.",
      sections: [
        {
          title: "1. Welke gegevens verzamelen wij",
          content: `Wij verzamelen de volgende gegevens:
• Accountgegevens: e-mailadres bij registratie
• Allergieën en voedselvoorkeuren die u invoert
• Gescande menukaarten en analyseresultaten
• Gebruiksstatistieken om de app te verbeteren`
        },
        {
          title: "2. Hoe gebruiken wij uw gegevens",
          content: `Uw gegevens worden gebruikt voor:
• Het matchen van menugerechten met uw allergieën
• Het personaliseren van uw app-ervaring
• Het verbeteren van onze allergenendetectie
• Het versturen van belangrijke app-updates`
        },
        {
          title: "3. Gegevensbescherming",
          content: `Wij beschermen uw gegevens door:
• Versleutelde gegevensopslag en -overdracht
• Beveiligde servers binnen de EU
• Beperkte toegang tot persoonlijke gegevens
• Regelmatige beveiligingsaudits`
        },
        {
          title: "4. Delen van gegevens",
          content: `Wij delen uw gegevens NIET met derden, behalve:
• Wanneer wettelijk vereist
• Met uw uitdrukkelijke toestemming
• Geanonimiseerd voor onderzoeksdoeleinden`
        },
        {
          title: "5. Uw rechten",
          content: `U heeft het recht om:
• Uw gegevens in te zien en te downloaden
• Uw gegevens te laten corrigeren of verwijderen
• Uw toestemming in te trekken
• Een klacht in te dienen bij de Autoriteit Persoonsgegevens`
        },
        {
          title: "6. Cookies en tracking",
          content: `Wij gebruiken:
• Functionele cookies voor app-werking
• Analytische cookies (geanonimiseerd)
• Geen tracking cookies van derden`
        },
        {
          title: "7. Contact",
          content: "Voor vragen over uw privacy kunt u contact opnemen via: privacy@bitebuddymatch.com"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 7, 2025",
      intro: "BiteBuddyMatch respects your privacy and is committed to protecting your personal data. This privacy policy describes how we collect, use, and protect information.",
      sections: [
        {
          title: "1. What data we collect",
          content: `We collect the following data:
• Account information: email address upon registration
• Allergies and food preferences you enter
• Scanned menus and analysis results
• Usage statistics to improve the app`
        },
        {
          title: "2. How we use your data",
          content: `Your data is used for:
• Matching menu dishes with your allergies
• Personalizing your app experience
• Improving our allergen detection
• Sending important app updates`
        },
        {
          title: "3. Data protection",
          content: `We protect your data through:
• Encrypted data storage and transmission
• Secure servers within the EU
• Limited access to personal data
• Regular security audits`
        },
        {
          title: "4. Data sharing",
          content: `We do NOT share your data with third parties, except:
• When legally required
• With your explicit consent
• Anonymized for research purposes`
        },
        {
          title: "5. Your rights",
          content: `You have the right to:
• View and download your data
• Have your data corrected or deleted
• Withdraw your consent
• File a complaint with the data protection authority`
        },
        {
          title: "6. Cookies and tracking",
          content: `We use:
• Functional cookies for app operation
• Analytical cookies (anonymized)
• No third-party tracking cookies`
        },
        {
          title: "7. Contact",
          content: "For privacy questions, contact us at: privacy@bitebuddymatch.com"
        }
      ]
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'nl' ? 'Terug' : 'Back'}
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>
        
        <p className="text-foreground mb-8">{t.intro}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
