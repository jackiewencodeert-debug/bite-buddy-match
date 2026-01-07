import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Accessibility = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    nl: {
      title: "Toegankelijkheidsverklaring",
      lastUpdated: "Laatst bijgewerkt: 7 januari 2025",
      intro: "BiteBuddyMatch streeft ernaar digitaal toegankelijk te zijn voor iedereen, inclusief mensen met een beperking. Wij volgen de Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA.",
      sections: [
        {
          title: "1. Onze Toezegging",
          content: `Wij zetten ons in voor toegankelijkheid door:

• Semantische HTML-structuur voor schermlezers
• Voldoende kleurcontrast voor leesbaarheid
• Toetsenbordnavigatie voor alle functies
• Alternatieve tekst voor afbeeldingen
• Responsief ontwerp voor alle apparaten
• Ondersteuning voor vergrotingssoftware`
        },
        {
          title: "2. Toegankelijkheidsfuncties",
          content: `Onze app bevat:

• Schakelbare taalondersteuning (20 talen)
• Duidelijke foutmeldingen en labels
• Consistente navigatiestructuur
• Leesbare lettergroottes
• Focus-indicatoren voor toetsenbordgebruikers`
        },
        {
          title: "3. Bekende Beperkingen",
          content: `Wij werken aan verbeteringen voor:

• Sommige complexe menu-afbeeldingen zijn niet volledig toegankelijk
• PDF-exports hebben beperkte toegankelijkheid
• Realtime camera-scanning vereist visuele interactie

Wij werken continu aan het verbeteren van deze gebieden.`
        },
        {
          title: "4. Feedback",
          content: `Wij verwelkomen uw feedback over toegankelijkheid. Als u problemen ondervindt of suggesties heeft, neem contact op:

Email: accessibility@bitebuddymatch.com

Wij streven ernaar binnen 5 werkdagen te reageren.`
        },
        {
          title: "5. Conformiteit",
          content: `Deze verklaring is opgesteld in overeenstemming met:

• EU Web Accessibility Directive (2016/2102)
• WCAG 2.1 niveau AA richtlijnen
• Nederlands Tijdelijk besluit digitale toegankelijkheid`
        }
      ]
    },
    en: {
      title: "Accessibility Statement",
      lastUpdated: "Last updated: January 7, 2025",
      intro: "BiteBuddyMatch is committed to ensuring digital accessibility for everyone, including people with disabilities. We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.",
      sections: [
        {
          title: "1. Our Commitment",
          content: `We are committed to accessibility through:

• Semantic HTML structure for screen readers
• Sufficient color contrast for readability
• Keyboard navigation for all features
• Alternative text for images
• Responsive design for all devices
• Support for magnification software`
        },
        {
          title: "2. Accessibility Features",
          content: `Our app includes:

• Switchable language support (20 languages)
• Clear error messages and labels
• Consistent navigation structure
• Readable font sizes
• Focus indicators for keyboard users`
        },
        {
          title: "3. Known Limitations",
          content: `We are working to improve:

• Some complex menu images are not fully accessible
• PDF exports have limited accessibility
• Real-time camera scanning requires visual interaction

We continuously work to improve these areas.`
        },
        {
          title: "4. Feedback",
          content: `We welcome your feedback on accessibility. If you experience issues or have suggestions, please contact:

Email: accessibility@bitebuddymatch.com

We aim to respond within 5 business days.`
        },
        {
          title: "5. Compliance",
          content: `This statement is prepared in accordance with:

• Americans with Disabilities Act (ADA)
• Section 508 of the Rehabilitation Act
• WCAG 2.1 Level AA guidelines`
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

export default Accessibility;
