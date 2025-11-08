import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "nl" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  nl: {
    // Index page
    "index.title": "Vind je perfecte maaltijd",
    "index.subtitle": "Match je allergieën en voorkeuren met restaurants",
    "index.scanMenu": "Scan Menu",
    "index.myProfile": "Mijn Profiel",
    "index.signIn": "Inloggen",
    
    // Scan page
    "scan.title": "Menu Scannen",
    "scan.subtitle": "Kies hoe je de menukaart wilt uploaden",
    "scan.camera": "Camera",
    "scan.cameraDesc": "Scan direct met je camera",
    "scan.upload": "Upload",
    "scan.uploadDesc": "Upload een foto of PDF",
    "scan.multiple": "Meerdere Foto's",
    "scan.multipleDesc": "Combineer verschillende pagina's",
    "scan.analyzing": "Analyseren...",
    "scan.analyzingDesc": "De AI analyseert je menu. Dit kan even duren.",
    "scan.analyzingMultiple": "De AI analyseert {count} foto{s}. Dit kan even duren.",
    "scan.checkPhoto": "Controleer je foto",
    "scan.readable": "Is de menukaart goed leesbaar?",
    "scan.retry": "Opnieuw",
    "scan.scanButton": "Scannen",
    "scan.back": "Terug",
    "scan.tipsTitle": "💡 Tips voor beste resultaten:",
    "scan.tip1": "Zorg voor goede verlichting",
    "scan.tip2": "Houd de camera stabiel",
    "scan.tip3": "Zorg dat de tekst goed leesbaar is",
    "scan.makePhoto": "Maak een foto",
    "scan.position": "Positioneer de menukaart in beeld",
    "scan.cancel": "Annuleren",
    "scan.takePhoto": "Foto Maken",
    "scan.multipleTitle": "Meerdere Foto's",
    "scan.photosAdded": "{count} foto{s} toegevoegd",
    "scan.addPhotos": "Voeg foto's van verschillende menupagina's toe",
    "scan.addMore": "Meer Foto's Toevoegen",
    "scan.scanMultiple": "Scan {count} Foto{s}",
    "scan.page": "Pagina",
    "scan.errorTitle": "Oeps, dat ging niet goed",
    "scan.tryAgain": "Probeer Opnieuw",
    "scan.suggestionsTitle": "💡 Suggesties voor betere resultaten:",
    "scan.suggestion1": "Zorg voor goede verlichting zonder schaduwen",
    "scan.suggestion2": "Houd de camera stabiel en recht boven het menu",
    "scan.suggestion3": "Zorg dat de tekst scherp en goed leesbaar is",
    "scan.suggestion4": "Fotografeer het hele menu of een duidelijk deel ervan",
    
    // Menu Results
    "results.title": "Menu Resultaten",
    "results.found": "{count} gerechten gevonden - Gebaseerd op jouw voorkeuren en allergieën",
    "results.contains": "⚠️ Bevat:",
    "results.safe": "Veilig",
    "results.adjustable": "Aanpasbaar",
    "results.containsAllergens": "Bevat Allergenen",
    "results.dishes": "gerechten",
    
    // Profile page
    "profile.title": "Mijn Profiel",
    "profile.subtitle": "Stel je allergieën en voorkeuren in voor gepersonaliseerde matches",
    "profile.businessSubtitle": "Beheer je bedrijfsinstellingen",
    "profile.allergies": "🚫 Allergieën",
    "profile.allergiesDesc": "Selecteer alle allergieën waar we rekening mee moeten houden",
    "profile.addCustom": "Eigen allergie toevoegen",
    "profile.customDesc": "Voeg een allergie toe die niet in de lijst staat, inclusief ingrediënten die we moeten detecteren",
    "profile.allergyName": "Allergie naam",
    "profile.allergyNamePlaceholder": "Bijv: Sesam",
    "profile.characteristics": "Kenmerken (gescheiden door komma's)",
    "profile.characteristicsPlaceholder": "Bijv: sesamzaad, sesam olie, tahini",
    "profile.characteristicsHelp": "Deze ingrediënten worden gedetecteerd op menukaarten",
    "profile.addAllergy": "Allergie Toevoegen",
    "profile.yourAllergies": "Jouw allergieën:",
    "profile.preferences": "❤️ Dieetvoorkeuren",
    "profile.preferencesDesc": "Selecteer je dieetwensen",
    "profile.save": "Opslaan",
    "profile.saving": "Opslaan...",
    "profile.logout": "Uitloggen",
    "profile.businessDashboard": "Bedrijf Dashboard",
    "profile.adminDashboard": "Admin Dashboard",
    "profile.saved": "Profiel opgeslagen! ✓",
    "profile.savedDesc": "Je voorkeuren zijn succesvol bijgewerkt.",
    "profile.savedGuestDesc": "Je voorkeuren zijn tijdelijk opgeslagen.",
    
    // Auth page
    "auth.welcome": "Welkom bij Bite Buddy",
    "auth.subtitle": "Match je allergieën met perfecte maaltijden",
    "auth.userType": "Ik ben een...",
    "auth.diner": "Eter",
    "auth.dinerDesc": "Ik zoek veilige restaurants",
    "auth.business": "Eetgever",
    "auth.businessDesc": "Ik heb een restaurant",
    "auth.signUp": "Aanmelden",
    "auth.signIn": "Inloggen",
    "auth.continueAsGuest": "Doorgaan als Gast",
    "auth.email": "Email",
    "auth.password": "Wachtwoord",
    "auth.alreadyAccount": "Heb je al een account?",
    "auth.noAccount": "Nog geen account?",
    "auth.signUpLink": "Aanmelden",
    "auth.signInLink": "Inloggen",
    
    // Common
    "common.loading": "Laden...",
    "common.error": "Fout",
    "common.success": "Gelukt",
    "common.back": "Terug",
    "common.close": "Sluiten",
    "common.save": "Opslaan",
    "common.cancel": "Annuleren",
    "common.delete": "Verwijderen",
    "common.edit": "Bewerken",
    "common.add": "Toevoegen",
  },
  en: {
    // Index page
    "index.title": "Find your perfect meal",
    "index.subtitle": "Match your allergies and preferences with restaurants",
    "index.scanMenu": "Scan Menu",
    "index.myProfile": "My Profile",
    "index.signIn": "Sign In",
    
    // Scan page
    "scan.title": "Scan Menu",
    "scan.subtitle": "Choose how to upload the menu",
    "scan.camera": "Camera",
    "scan.cameraDesc": "Scan directly with your camera",
    "scan.upload": "Upload",
    "scan.uploadDesc": "Upload a photo or PDF",
    "scan.multiple": "Multiple Photos",
    "scan.multipleDesc": "Combine different pages",
    "scan.analyzing": "Analyzing...",
    "scan.analyzingDesc": "AI is analyzing your menu. This may take a moment.",
    "scan.analyzingMultiple": "AI is analyzing {count} photo{s}. This may take a moment.",
    "scan.checkPhoto": "Check your photo",
    "scan.readable": "Is the menu clearly readable?",
    "scan.retry": "Retry",
    "scan.scanButton": "Scan",
    "scan.back": "Back",
    "scan.tipsTitle": "💡 Tips for best results:",
    "scan.tip1": "Ensure good lighting",
    "scan.tip2": "Hold the camera steady",
    "scan.tip3": "Make sure text is clearly readable",
    "scan.makePhoto": "Take a photo",
    "scan.position": "Position the menu in view",
    "scan.cancel": "Cancel",
    "scan.takePhoto": "Take Photo",
    "scan.multipleTitle": "Multiple Photos",
    "scan.photosAdded": "{count} photo{s} added",
    "scan.addPhotos": "Add photos of different menu pages",
    "scan.addMore": "Add More Photos",
    "scan.scanMultiple": "Scan {count} Photo{s}",
    "scan.page": "Page",
    "scan.errorTitle": "Oops, something went wrong",
    "scan.tryAgain": "Try Again",
    "scan.suggestionsTitle": "💡 Suggestions for better results:",
    "scan.suggestion1": "Ensure good lighting without shadows",
    "scan.suggestion2": "Hold the camera steady and directly above the menu",
    "scan.suggestion3": "Make sure the text is sharp and clearly readable",
    "scan.suggestion4": "Photograph the entire menu or a clear portion of it",
    
    // Menu Results
    "results.title": "Menu Results",
    "results.found": "{count} dishes found - Based on your preferences and allergies",
    "results.contains": "⚠️ Contains:",
    "results.safe": "Safe",
    "results.adjustable": "Adjustable",
    "results.containsAllergens": "Contains Allergens",
    "results.dishes": "dishes",
    
    // Profile page
    "profile.title": "My Profile",
    "profile.subtitle": "Set your allergies and preferences for personalized matches",
    "profile.businessSubtitle": "Manage your business settings",
    "profile.allergies": "🚫 Allergies",
    "profile.allergiesDesc": "Select all allergies we should consider",
    "profile.addCustom": "Add custom allergy",
    "profile.customDesc": "Add an allergy not in the list, including ingredients we should detect",
    "profile.allergyName": "Allergy name",
    "profile.allergyNamePlaceholder": "E.g: Sesame",
    "profile.characteristics": "Characteristics (comma separated)",
    "profile.characteristicsPlaceholder": "E.g: sesame seeds, sesame oil, tahini",
    "profile.characteristicsHelp": "These ingredients will be detected on menus",
    "profile.addAllergy": "Add Allergy",
    "profile.yourAllergies": "Your allergies:",
    "profile.preferences": "❤️ Dietary Preferences",
    "profile.preferencesDesc": "Select your dietary preferences",
    "profile.save": "Save",
    "profile.saving": "Saving...",
    "profile.logout": "Logout",
    "profile.businessDashboard": "Business Dashboard",
    "profile.adminDashboard": "Admin Dashboard",
    "profile.saved": "Profile saved! ✓",
    "profile.savedDesc": "Your preferences have been updated successfully.",
    "profile.savedGuestDesc": "Your preferences have been temporarily saved.",
    
    // Auth page
    "auth.welcome": "Welcome to Bite Buddy",
    "auth.subtitle": "Match your allergies with perfect meals",
    "auth.userType": "I am a...",
    "auth.diner": "Diner",
    "auth.dinerDesc": "I'm looking for safe restaurants",
    "auth.business": "Restaurant",
    "auth.businessDesc": "I have a restaurant",
    "auth.signUp": "Sign Up",
    "auth.signIn": "Sign In",
    "auth.continueAsGuest": "Continue as Guest",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.alreadyAccount": "Already have an account?",
    "auth.noAccount": "Don't have an account?",
    "auth.signUpLink": "Sign Up",
    "auth.signInLink": "Sign In",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.back": "Back",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "nl") ? saved : "nl";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
