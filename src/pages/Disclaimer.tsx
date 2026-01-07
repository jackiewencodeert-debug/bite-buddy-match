import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Disclaimer = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    nl: {
      title: "Disclaimer",
      lastUpdated: "Laatst bijgewerkt: 7 januari 2025",
      warning: "BELANGRIJKE WAARSCHUWING: BiteBuddyMatch is een hulpmiddel en GEEN vervanging voor medisch advies of professionele allergenencontrole.",
      sections: [
        {
          title: "1. Allergenen Disclaimer",
          content: `KRITIEKE INFORMATIE VOOR GEBRUIKERS MET ALLERGIEËN:

• Onze AI-gebaseerde allergenendetectie is NIET 100% accuraat
• Kruisbesmetting kan voorkomen en wordt niet gedetecteerd
• Menu-informatie kan verouderd of incorrect zijn
• Ingrediënten kunnen veranderen zonder voorafgaande kennisgeving

BIJ ERNSTIGE ALLERGIEËN:
Vraag ALTIJD rechtstreeks aan de kok of het personeel of een gerecht veilig is. Vertrouw nooit alleen op deze app voor levensbedreigende allergieën.`
        },
        {
          title: "2. Geen Medisch Advies",
          content: `Deze app verstrekt GEEN medisch advies. De informatie is uitsluitend bedoeld als algemene richtlijn.

• Raadpleeg een arts of diëtist voor medisch advies
• Volg de instructies van uw allergoloog
• Draag altijd uw EpiPen of medicatie bij u
• Informeer het restaurant over uw allergieën`
        },
        {
          title: "3. Beperking van Aansprakelijkheid",
          content: `BiteBuddyMatch is NIET aansprakelijk voor:

• Allergische reacties of gezondheidsproblemen
• Onjuiste of onvolledige allergeneninformatie
• Beslissingen genomen op basis van app-informatie
• Schade door app-storingen of fouten
• Informatie verstrekt door restaurants

Het gebruik van deze app is geheel op eigen risico.`
        },
        {
          title: "4. Restaurant Verantwoordelijkheid",
          content: `Restaurants die BiteBuddyMatch gebruiken zijn zelf verantwoordelijk voor:

• De juistheid van hun menu-informatie
• Correcte allergenen-declaratie volgens EU-wetgeving
• Het voorkomen van kruisbesmetting
• Training van personeel over allergenen`
        },
        {
          title: "5. Nauwkeurigheid van Informatie",
          content: `Wij streven naar nauwkeurigheid, maar kunnen niet garanderen dat:

• AI-herkenning altijd correct is
• Alle allergenen worden gedetecteerd
• Menu-foto's volledig leesbaar zijn
• Vertalingen altijd accuraat zijn`
        },
        {
          title: "6. Contact bij Noodgevallen",
          content: `Bij een allergische reactie:
• Bel direct 112 (EU) of lokaal noodnummer
• Gebruik uw EpiPen indien voorgeschreven
• Zoek onmiddellijk medische hulp`
        }
      ]
    },
    en: {
      title: "Disclaimer",
      lastUpdated: "Last updated: January 7, 2025",
      warning: "IMPORTANT WARNING: BiteBuddyMatch is a tool and NOT a substitute for medical advice or professional allergen verification.",
      sections: [
        {
          title: "1. Allergen Disclaimer",
          content: `CRITICAL INFORMATION FOR USERS WITH ALLERGIES:

• Our AI-based allergen detection is NOT 100% accurate
• Cross-contamination can occur and is not detected
• Menu information may be outdated or incorrect
• Ingredients may change without prior notice

FOR SEVERE ALLERGIES:
ALWAYS ask the chef or staff directly if a dish is safe. Never rely solely on this app for life-threatening allergies.`
        },
        {
          title: "2. No Medical Advice",
          content: `This app does NOT provide medical advice. Information is intended only as a general guideline.

• Consult a doctor or dietitian for medical advice
• Follow your allergist's instructions
• Always carry your EpiPen or medication
• Inform the restaurant about your allergies`
        },
        {
          title: "3. Limitation of Liability",
          content: `BiteBuddyMatch is NOT liable for:

• Allergic reactions or health problems
• Incorrect or incomplete allergen information
• Decisions made based on app information
• Damage from app failures or errors
• Information provided by restaurants

Use of this app is entirely at your own risk.`
        },
        {
          title: "4. Restaurant Responsibility",
          content: `Restaurants using BiteBuddyMatch are responsible for:

• The accuracy of their menu information
• Correct allergen declaration per EU legislation
• Preventing cross-contamination
• Staff training on allergens`
        },
        {
          title: "5. Accuracy of Information",
          content: `We strive for accuracy but cannot guarantee that:

• AI recognition is always correct
• All allergens are detected
• Menu photos are fully readable
• Translations are always accurate`
        },
        {
          title: "6. Emergency Contact",
          content: `In case of allergic reaction:
• Call 911 (US) or local emergency number immediately
• Use your EpiPen if prescribed
• Seek immediate medical attention`
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
        <p className="text-muted-foreground mb-6">{t.lastUpdated}</p>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {t.warning}
          </AlertDescription>
        </Alert>

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

export default Disclaimer;
