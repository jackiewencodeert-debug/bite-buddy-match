import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    nl: {
      title: "Algemene Voorwaarden",
      lastUpdated: "Laatst bijgewerkt: 7 januari 2025",
      intro: "Door BiteBuddyMatch te gebruiken, gaat u akkoord met deze voorwaarden. Lees deze zorgvuldig door.",
      sections: [
        {
          title: "1. Acceptatie van voorwaarden",
          content: "Door de BiteBuddyMatch app te downloaden, te installeren of te gebruiken, accepteert u deze Algemene Voorwaarden. Als u niet akkoord gaat, gebruik de app dan niet."
        },
        {
          title: "2. Beschrijving van de dienst",
          content: `BiteBuddyMatch biedt:
• Scannen en analyseren van menukaarten
• Detectie van allergenen in gerechten
• Matching van gerechten met uw voorkeuren
• Digitale menu's voor horecabedrijven`
        },
        {
          title: "3. Disclaimer - Belangrijke waarschuwing",
          content: `BELANGRIJK: BiteBuddyMatch is een hulpmiddel en geen medisch advies.

• Onze allergenendetectie is niet 100% accuraat
• Controleer ALTIJD bij het restaurant of de kok
• Bij ernstige allergieën: vraag direct aan de bereider
• Wij zijn NIET aansprakelijk voor allergische reacties
• Gebruik deze app op eigen risico`
        },
        {
          title: "4. Gebruikersverantwoordelijkheden",
          content: `Als gebruiker bent u verantwoordelijk voor:
• Het invoeren van correcte allergiegegevens
• Het verifiëren van informatie bij de horecagelegenheid
• Het beschermen van uw accountgegevens
• Correct gebruik van de app`
        },
        {
          title: "5. Intellectueel eigendom",
          content: "Alle content, logo's, en technologie van BiteBuddyMatch zijn eigendom van BiteBuddyMatch. Ongeoorloofd kopiëren of distribueren is verboden."
        },
        {
          title: "6. Beperking van aansprakelijkheid",
          content: `BiteBuddyMatch is NIET aansprakelijk voor:
• Onnauwkeurigheden in allergenendetectie
• Allergische reacties of gezondheidsproblemen
• Gegevens verstrekt door restaurants
• Schade door app-storingen of onderbrekingen
• Indirecte of gevolgschade`
        },
        {
          title: "7. Account beëindiging",
          content: "Wij behouden het recht om accounts te beëindigen die deze voorwaarden schenden, zonder voorafgaande kennisgeving."
        },
        {
          title: "8. Wijzigingen",
          content: "Wij kunnen deze voorwaarden op elk moment wijzigen. Voortgezet gebruik na wijzigingen betekent acceptatie van de nieuwe voorwaarden."
        },
        {
          title: "9. Toepasselijk recht",
          content: "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland."
        },
        {
          title: "10. Contact",
          content: "Voor vragen over deze voorwaarden: legal@bitebuddymatch.com"
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 7, 2025",
      intro: "By using BiteBuddyMatch, you agree to these terms. Please read them carefully.",
      sections: [
        {
          title: "1. Acceptance of terms",
          content: "By downloading, installing, or using the BiteBuddyMatch app, you accept these Terms of Service. If you do not agree, do not use the app."
        },
        {
          title: "2. Description of service",
          content: `BiteBuddyMatch provides:
• Scanning and analyzing menus
• Detection of allergens in dishes
• Matching dishes with your preferences
• Digital menus for hospitality businesses`
        },
        {
          title: "3. Disclaimer - Important warning",
          content: `IMPORTANT: BiteBuddyMatch is a tool and not medical advice.

• Our allergen detection is not 100% accurate
• ALWAYS verify with the restaurant or chef
• For severe allergies: ask the preparer directly
• We are NOT liable for allergic reactions
• Use this app at your own risk`
        },
        {
          title: "4. User responsibilities",
          content: `As a user, you are responsible for:
• Entering correct allergy information
• Verifying information with the establishment
• Protecting your account credentials
• Proper use of the app`
        },
        {
          title: "5. Intellectual property",
          content: "All content, logos, and technology of BiteBuddyMatch are property of BiteBuddyMatch. Unauthorized copying or distribution is prohibited."
        },
        {
          title: "6. Limitation of liability",
          content: `BiteBuddyMatch is NOT liable for:
• Inaccuracies in allergen detection
• Allergic reactions or health problems
• Data provided by restaurants
• Damage from app failures or interruptions
• Indirect or consequential damages`
        },
        {
          title: "7. Account termination",
          content: "We reserve the right to terminate accounts that violate these terms, without prior notice."
        },
        {
          title: "8. Changes",
          content: "We may change these terms at any time. Continued use after changes means acceptance of the new terms."
        },
        {
          title: "9. Governing law",
          content: "These terms are governed by Dutch law. Disputes will be submitted to the competent court in the Netherlands."
        },
        {
          title: "10. Contact",
          content: "For questions about these terms: legal@bitebuddymatch.com"
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

export default TermsOfService;
