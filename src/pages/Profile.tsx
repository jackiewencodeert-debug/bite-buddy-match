import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Shield, Plus, X, Camera, Home, QrCode } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { translateAllergen } from "@/data/businessTranslations";

const allergies = [
  { id: "noten", label: "allergy.noten" },
  { id: "gluten", label: "allergy.gluten" },
  { id: "lactose", label: "allergy.lactose" },
  { id: "schaaldieren", label: "allergy.schaaldieren" },
  { id: "vis", label: "allergy.vis" },
  { id: "eieren", label: "allergy.eieren" },
  { id: "soja", label: "allergy.soja" },
  { id: "sulfiet", label: "allergy.sulfiet" },
];

const preferences = [
  { id: "vegetarisch", label: "preference.vegetarisch" },
  { id: "veganistisch", label: "preference.veganistisch" },
  { id: "halal", label: "preference.halal" },
  { id: "kosher", label: "preference.kosher" },
];

// Validation schema for custom allergies
const customAllergySchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Allergie naam moet minimaal 2 tekens zijn" })
    .max(50, { message: "Allergie naam mag maximaal 50 tekens zijn" })
    .regex(/^[a-zA-Z0-9\s\-]+$/, { message: "Alleen letters, cijfers, spaties en koppeltekens toegestaan" }),
  characteristics: z.string()
    .trim()
    .min(2, { message: "Kenmerken moeten minimaal 2 tekens zijn" })
    .max(200, { message: "Kenmerken mogen maximaal 200 tekens zijn" })
});

interface CustomAllergy {
  id?: string;
  name: string;
  characteristics: string[];
}

const Profile = () => {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<CustomAllergy[]>([]);
  const [businessAllergenWarnings, setBusinessAllergenWarnings] = useState<string[]>([]);
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergyChars, setNewAllergyChars] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAllergyPicker, setShowAllergyPicker] = useState(false);
  // QR Settings for business users
  const [qrColor, setQrColor] = useState<string>("black");
  const [qrTextAbove, setQrTextAbove] = useState<string>("");
  const [qrTextBelow, setQrTextBelow] = useState<string>("");
  const [qrPosition, setQrPosition] = useState<string>("bottom-right");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // If there is an authenticated session, ALWAYS treat the user as logged in.
      // This prevents stale guest localStorage from overriding real accounts.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Clear guest flags that could hijack the profile view
        localStorage.removeItem("userType");
        localStorage.removeItem("guestExpiry");
        localStorage.removeItem("guestPreferences");

        setIsGuest(false);

        const user = session.user;

        // Load user profile to check user_type, business warnings, and QR settings
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, business_allergen_warnings, qr_color, qr_text_above, qr_text_below, qr_position")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserType(profile.user_type);
          if (profile.user_type === "eetgever") {
            if (profile.business_allergen_warnings) {
              setBusinessAllergenWarnings(profile.business_allergen_warnings);
            }
            // Load QR settings
            setQrColor((profile as any).qr_color || "black");
            setQrTextAbove((profile as any).qr_text_above || "");
            setQrTextBelow((profile as any).qr_text_below || "");
            setQrPosition((profile as any).qr_position || "bottom-right");
          }
        }

        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (roles?.some((r) => r.role === "admin")) {
          setIsAdmin(true);
        }

        // Load existing preferences
        const { data: prefs } = await supabase
          .from("preferences")
          .select("*")
          .eq("user_id", user.id);

        if (prefs) {
          const allergiesList = prefs
            .filter((p) => p.preference_type === "allergie" && !p.characteristics)
            .map((p) => p.preference_value);
          const prefsList = prefs
            .filter((p) => p.preference_type === "dieet")
            .map((p) => p.preference_value);
          const customList = prefs
            .filter((p) => p.preference_type === "allergie" && p.characteristics)
            .map((p) => ({
              id: p.id,
              name: p.preference_value,
              characteristics: p.characteristics || [],
            }));

          setSelectedAllergies(allergiesList);
          setSelectedPreferences(prefsList);
          setCustomAllergies(customList);
        }

        return;
      }

      // No authenticated session -> allow guest profile
      const guestType = localStorage.getItem("userType");
      if (guestType === "gast") {
        setIsGuest(true);
        setUserType("gast");

        const guestPrefs = localStorage.getItem("guestPreferences");
        if (guestPrefs) {
          const prefs = JSON.parse(guestPrefs);
          setSelectedAllergies(prefs.allergies || []);
          setSelectedPreferences(prefs.preferences || []);
          setCustomAllergies(prefs.customAllergies || []);
        }

        return;
      }

      // Neither guest nor logged in
      navigate("/auth");
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomAllergy = () => {
    try {
      // Validate input
      customAllergySchema.parse({
        name: newAllergyName,
        characteristics: newAllergyChars
      });

      // Split characteristics by comma and trim
      const charArray = newAllergyChars
        .split(",")
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);

      if (charArray.length === 0) {
        toast({
          title: "Ongeldig",
          description: "Voeg minimaal 1 kenmerk toe (gescheiden door komma's)",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicates
      if (customAllergies.some(a => a.name.toLowerCase() === newAllergyName.toLowerCase())) {
        toast({
          title: "Allergie bestaat al",
          description: "Je hebt deze allergie al toegevoegd",
          variant: "destructive",
        });
        return;
      }

      setCustomAllergies([...customAllergies, {
        name: newAllergyName,
        characteristics: charArray
      }]);

      setNewAllergyName("");
      setNewAllergyChars("");

      toast({
        title: "Allergie toegevoegd!",
        description: `${newAllergyName} is toegevoegd aan je lijst`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validatiefout",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const removeCustomAllergy = (name: string) => {
    setCustomAllergies(customAllergies.filter(a => a.name !== name));
  };

  const handleSave = async () => {
    // Only validate allergies/preferences for non-business users
    if (userType !== "eetgever") {
      const hasAllergy = selectedAllergies.length > 0 || customAllergies.length > 0;
      const hasPreference = selectedPreferences.length > 0;
      
      if (!hasAllergy && !hasPreference) {
        toast({
          title: t("profile.validationError"),
          description: t("profile.selectAtLeastOne"),
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Handle guest save
      if (isGuest) {
        const guestPrefs = {
          allergies: selectedAllergies,
          preferences: selectedPreferences,
          customAllergies: customAllergies
        };
        localStorage.setItem("guestPreferences", JSON.stringify(guestPrefs));
        
      toast({
        title: "Profiel opgeslagen! ✓",
        description: "Je voorkeuren zijn tijdelijk opgeslagen.",
      });
      setSaving(false);
      setShowSuccessDialog(true);
      return;
      }

      // Handle logged in user save
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing preferences
      await supabase
        .from("preferences")
        .delete()
        .eq("user_id", user.id);

      // Insert standard allergies
      const allergyInserts = selectedAllergies.map(allergy => ({
        user_id: user.id,
        preference_type: "allergie",
        preference_value: allergy,
        characteristics: null
      }));

      // Insert custom allergies with characteristics
      const customAllergyInserts = customAllergies.map(allergy => ({
        user_id: user.id,
        preference_type: "allergie",
        preference_value: allergy.name,
        characteristics: allergy.characteristics
      }));

      // Insert dietary preferences
      const prefInserts = selectedPreferences.map(pref => ({
        user_id: user.id,
        preference_type: "dieet",
        preference_value: pref,
        characteristics: null
      }));

      const allInserts = [...allergyInserts, ...customAllergyInserts, ...prefInserts];
      
      if (allInserts.length > 0) {
        const { error } = await supabase
          .from("preferences")
          .insert(allInserts);

        if (error) throw error;
      }

      // Update business settings if user is a business
      if (userType === "eetgever") {
        await supabase
          .from("profiles")
          .update({ 
            business_allergen_warnings: businessAllergenWarnings,
            qr_color: qrColor,
            qr_text_above: qrTextAbove,
            qr_text_below: qrTextBelow,
            qr_position: qrPosition
          })
          .eq("id", user.id);
      }

      toast({
        title: "Profiel opgeslagen! ✓",
        description: "Je voorkeuren zijn succesvol bijgewerkt.",
      });
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const togglePreference = (id: string) => {
    setSelectedPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleBusinessAllergen = (allergen: string) => {
    setBusinessAllergenWarnings(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const handleLogout = async () => {
    // Always clear all session-related localStorage items
    localStorage.removeItem("userType");
    localStorage.removeItem("guestPreferences");
    localStorage.removeItem("guestExpiry");
    
    if (isGuest) {
      toast({
        title: "Sessie beëindigd",
        description: "Je gastvoorkeuren zijn gewist.",
      });
    } else {
      await supabase.auth.signOut();
      toast({
        title: "Uitgelogd",
        description: "Je bent succesvol uitgelogd.",
      });
    }
    
    // Navigate to home - Index will auto-login as guest
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Profiel laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <LanguageToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link to={userType === "eetgever" && !isGuest ? "/business" : "/"}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          
          <div className="flex gap-2">
            {userType === "eetgever" && !isGuest && (
              <Link to="/business">
                <Button variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  {t("profile.businessDashboard")}
                </Button>
              </Link>
            )}
            
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  {t("profile.adminDashboard")}
                </Button>
              </Link>
            )}

            {/* Hide logout button for business users - they have logout on Index page */}
            {userType !== "eetgever" && (
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                {t("profile.logout")}
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">{t("profile.title")}</h1>
            <p className="text-lg text-muted-foreground">
              {userType === "eetgever" 
                ? t("profile.businessSubtitle")
                : t("profile.subtitle")
              }
            </p>
          </div>

          <div className="space-y-6">
            {userType !== "eetgever" && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  {t("profile.allergies")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("profile.allergiesDesc")}
                </p>
                
                {/* Standard 8 allergies - always visible */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={allergy.id}
                        checked={selectedAllergies.includes(allergy.id)}
                        onCheckedChange={() => toggleAllergy(allergy.id)}
                      />
                      <Label
                        htmlFor={allergy.id}
                        className="text-base cursor-pointer flex-1"
                      >
                        {t(allergy.label)}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Display custom allergies as badges */}
                {customAllergies.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <Label className="text-sm font-medium">{t("profile.yourAllergies")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {customAllergies.map((allergy) => (
                        <Badge
                          key={allergy.name}
                          variant="secondary"
                          className="px-3 py-2 text-sm flex items-center gap-2"
                        >
                          <span className="font-medium">{allergy.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({allergy.characteristics.join(", ")})
                          </span>
                          <button
                            onClick={() => removeCustomAllergy(allergy.name)}
                            className="ml-1 hover:text-destructive"
                            aria-label={`Verwijder ${allergy.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add custom allergy button */}
                {!showAllergyPicker && (
                  <button
                    onClick={() => setShowAllergyPicker(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-primary font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    {t("profile.addAllergyButton")}
                  </button>
                )}

                {/* Expandable custom allergy input section */}
                {showAllergyPicker && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                    <div>
                      <Label htmlFor="allergyName" className="text-sm font-medium">
                        {t("profile.allergyName")}
                      </Label>
                      <Input
                        id="allergyName"
                        placeholder={t("profile.allergyNamePlaceholder")}
                        value={newAllergyName}
                        onChange={(e) => setNewAllergyName(e.target.value)}
                        maxLength={50}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="allergyChars" className="text-sm font-medium">
                        {t("profile.characteristics")}
                      </Label>
                      <Input
                        id="allergyChars"
                        placeholder={t("profile.characteristicsPlaceholder")}
                        value={newAllergyChars}
                        onChange={(e) => setNewAllergyChars(e.target.value)}
                        maxLength={200}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("profile.characteristicsHelp")}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          addCustomAllergy();
                          if (newAllergyName && newAllergyChars) {
                            setShowAllergyPicker(false);
                          }
                        }}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("profile.addAllergy")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAllergyPicker(false);
                          setNewAllergyName("");
                          setNewAllergyChars("");
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {userType === "eetgever" && !isGuest && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-primary" />
                  {t("profile.qrSettings")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("profile.qrSettingsDesc")}
                </p>
                
                {/* QR Color Selection */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      {t("profile.qrColor")}
                    </Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setQrColor("black")}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          qrColor === "black" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="w-8 h-8 bg-black rounded"></div>
                        <span className="font-medium">{t("profile.qrBlack")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrColor("white")}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          qrColor === "white" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-border rounded"></div>
                        <span className="font-medium">{t("profile.qrWhite")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Text Above QR */}
                  <div>
                    <Label htmlFor="qrTextAbove" className="text-base font-medium mb-2 block">
                      {t("profile.qrTextAbove")}
                    </Label>
                    <Input
                      id="qrTextAbove"
                      placeholder={t("profile.qrTextAbovePlaceholder")}
                      value={qrTextAbove}
                      onChange={(e) => setQrTextAbove(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* Text Below QR */}
                  <div>
                    <Label htmlFor="qrTextBelow" className="text-base font-medium mb-2 block">
                      {t("profile.qrTextBelow")}
                    </Label>
                    <Input
                      id="qrTextBelow"
                      placeholder={t("profile.qrTextBelowPlaceholder")}
                      value={qrTextBelow}
                      onChange={(e) => setQrTextBelow(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* Preview with real QR code */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm font-medium mb-3 block">{t("profile.qrPreview")}</Label>
                    <div 
                      className="flex flex-col items-center gap-3 p-6 rounded-lg"
                      style={{ backgroundColor: qrColor === "white" ? "#1a1a1a" : "#f5f5f5" }}
                    >
                      {qrTextAbove && (
                        <p 
                          className="text-base font-medium text-center"
                          style={{ color: qrColor === "white" ? "#FFFFFF" : "#000000" }}
                        >
                          {qrTextAbove}
                        </p>
                      )}
                      <QRCode
                        value="https://example.com/menu/preview"
                        size={120}
                        bgColor="transparent"
                        fgColor={qrColor === "white" ? "#FFFFFF" : "#000000"}
                      />
                      {qrTextBelow && (
                        <p 
                          className="text-base font-medium text-center"
                          style={{ color: qrColor === "white" ? "#FFFFFF" : "#000000" }}
                        >
                          {qrTextBelow}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* QR Position Selection */}
                  <div className="mt-6">
                    <Label className="text-base font-medium mb-3 block">
                      {t("profile.qrPosition")}
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("profile.qrPositionDesc")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "top-left", label: t("profile.topLeft") },
                        { id: "top-right", label: t("profile.topRight") },
                        { id: "bottom-left", label: t("profile.bottomLeft") },
                        { id: "bottom-right", label: t("profile.bottomRight") },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setQrPosition(pos.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            qrPosition === pos.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {userType !== "eetgever" && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  {t("profile.preferences")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("profile.preferencesDesc")}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {preferences.map((preference) => (
                    <div key={preference.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={preference.id}
                        checked={selectedPreferences.includes(preference.id)}
                        onCheckedChange={() => togglePreference(preference.id)}
                      />
                      <Label
                        htmlFor={preference.id}
                        className="text-base cursor-pointer flex-1"
                      >
                        {t(preference.label)}
                      </Label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {userType !== "eetgever" && (
              <Card className="p-6 bg-gradient-hero border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💡</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {isGuest ? "Je voorkeuren worden tijdelijk opgeslagen" : "Je voorkeuren worden opgeslagen"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isGuest
                        ? "Als gast worden je voorkeuren alleen voor deze sessie opgeslagen. Maak een account om je voorkeuren permanent op te slaan."
                        : "Na het opslaan worden al je scans automatisch gecontroleerd tegen deze voorkeuren. Je kunt ze altijd aanpassen als je wilt."}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleSave}
                disabled={saving}
                className="px-12 text-lg shadow-hover hover:scale-105 transition-all"
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.saved")}</AlertDialogTitle>
            {userType !== "eetgever" && (
              <AlertDialogDescription>
                {isGuest ? t("profile.savedGuestDesc") : t("profile.savedDesc")}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {userType === "eetgever" ? (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/business");
                }}
              >
                OK
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              <Button
                size="lg"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/");
                }}
                className="w-full"
              >
                <Home className="mr-2 h-5 w-5" />
                {t("common.back")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/scan");
                }}
                className="w-full"
              >
                <Camera className="mr-2 h-5 w-5" />
                {t("index.scanMenu")}
              </Button>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
