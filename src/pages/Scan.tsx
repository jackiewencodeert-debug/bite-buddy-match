import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, Upload, ArrowLeft, X, RotateCcw } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MenuResults } from "@/components/MenuResults";
import { GuestMenuResults } from "@/components/GuestMenuResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdMobService } from "@/services/admob";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdSenseAd } from "@/components/AdSenseAd";
import { extractTextFromImage, parseImageData, OCRProgress } from "@/services/ocrService";
import { parseMenuFromText, enhanceDishAllergens } from "@/services/menuParserService";
import { canGuestScan, incrementScanCount, getScanLimitInfo, isGuestUser } from "@/services/rateLimitService";

const Scan = () => {
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<"select" | "camera" | "upload" | "multiple" | "error">("select");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [multipleImages, setMultipleImages] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [pendingMode, setPendingMode] = useState<"camera" | "upload" | "multiple" | null>(null);
  const [adCountdown, setAdCountdown] = useState(5);
  const [analyzedDishes, setAnalyzedDishes] = useState<any[]>([]);
  const [matchSummary, setMatchSummary] = useState<any>(undefined);
  const [menuTemplate, setMenuTemplate] = useState<{ categories?: string[]; style?: any }>({});
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    checkUserType();
    
    // Check if guest
    const guestType = localStorage.getItem("userType");
    setIsGuest(guestType === "gast");
    
    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      toast({
        title: "Betaling geslaagd!",
        description: "Je kunt nu je menu scannen.",
      });
    }

    // Handle mode from URL (from bottom nav bar)
    const urlMode = searchParams.get('mode');
    if (urlMode === 'camera') {
      handleModeSelection("camera");
    } else if (urlMode === 'upload') {
      handleModeSelection("multiple");
    }
  }, [searchParams]);

  // Ad countdown timer
  useEffect(() => {
    if (showAd && adCountdown > 0) {
      const timer = setTimeout(() => {
        setAdCountdown(adCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAd, adCountdown]);

  // Log ad shown event
  useEffect(() => {
    if (showAd) {
      logAdEvent('shown');
    }
  }, [showAd]);

  const logAdEvent = async (eventType: 'shown' | 'completed' | 'skipped', countdownValue?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("ad_analytics").insert({
        user_id: user?.id || null,
        ad_type: 'scan_interstitial',
        event_type: eventType,
        countdown_value: countdownValue,
      });
    } catch (error) {
      console.error("Error logging ad event:", error);
    }
  };

  const handleModeSelection = async (selectedMode: "camera" | "upload" | "multiple") => {
    // Check if user is actually logged in (authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is logged in (not guest), skip the ad and rate limit
    if (user) {
      proceedWithMode(selectedMode);
      return;
    }
    
    // Check rate limit for guests
    const guestType = localStorage.getItem("userType");
    const currentIsGuest = guestType === "gast";
    
    if (currentIsGuest) {
      // Check rate limit first
      if (!canGuestScan()) {
        const limitInfo = getScanLimitInfo();
        toast({
          title: "Dagelijkse limiet bereikt",
          description: `Je hebt ${limitInfo.limit} gratis scans per dag. Upgrade naar premium of wacht tot ${limitInfo.resetsAt}.`,
          variant: "destructive",
        });
        return;
      }
      
      // Log ad shown event
      await logAdEvent('shown');
      
      // Check if we're on native platform
      if (AdMobService.isNative()) {
        // Show native AdMob interstitial
        try {
          await AdMobService.showInterstitial();
          // Ad was shown (or skipped), log completion and proceed
          await logAdEvent('completed', 0);
          proceedWithMode(selectedMode);
        } catch (error) {
          console.error('AdMob error:', error);
          // Fallback to web dialog if AdMob fails
          setPendingMode(selectedMode);
          setShowAd(true);
          setAdCountdown(5);
        }
      } else {
        // Web platform: show custom dialog
        setPendingMode(selectedMode);
        setShowAd(true);
        setAdCountdown(5);
      }
    } else {
      // Not logged in and not guest - proceed without ad
      proceedWithMode(selectedMode);
    }
  };

  const proceedWithMode = (selectedMode: "camera" | "upload" | "multiple") => {
    setMode(selectedMode);
    if (selectedMode === "upload") {
      setTimeout(() => fileInputRef.current?.click(), 100);
    } else if (selectedMode === "multiple") {
      setTimeout(() => multipleFileInputRef.current?.click(), 100);
    }
  };

  const handleAdClose = () => {
    if (adCountdown === 0 && pendingMode) {
      // Log completed view
      logAdEvent('completed', 0);
      setShowAd(false);
      proceedWithMode(pendingMode);
      setPendingMode(null);
    }
  };

  const handleAdSkip = () => {
    // Log skipped event with remaining countdown
    logAdEvent('skipped', adCountdown);
    setShowAd(false);
    setMode("select");
    setPendingMode(null);
  };

  const checkUserType = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserType(profile.user_type);
      }
    }
  };

  // Native camera via Capacitor (werkt op iOS device én Simulator via Photos fallback)
  const startCamera = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: "Menu scannen",
        promptLabelPhoto: "Kies uit galerij",
        promptLabelPicture: "Maak foto",
        promptLabelCancel: "Annuleren",
      });

      if (!image.dataUrl) {
        setMode("select");
        return;
      }

      const imageItem = JSON.stringify({ data: image.dataUrl, type: "image" });
      setMultipleImages(prev => [...prev, imageItem]);
      setMode("multiple");
    } catch (error: any) {
      // User cancelled — geen toast, gewoon terug naar select
      const message = String(error?.message ?? error ?? "");
      if (message.toLowerCase().includes("cancel") || message.toLowerCase().includes("denied")) {
        setMode("select");
        return;
      }
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Kon geen foto maken. Controleer camera-/foto-permissies in Instellingen.",
        variant: "destructive",
      });
      setMode("select");
    }
  };

  // Geen actieve stream meer (native plugin sluit zichzelf) — behouden als no-op safety hook
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        // Store as JSON format consistent with file uploads
        const imageItem = JSON.stringify({ data: imageData, type: 'image' });
        setCapturedImage(imageItem);
        stopCamera();
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle multiple file uploads (images and PDFs)
  const handleMultipleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      Array.from(files).forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (te groot)`);
        } else if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          invalidFiles.push(`${file.name} (ongeldig type)`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "Bestanden overgeslagen",
          description: invalidFiles.join(", "),
          variant: "destructive",
        });
      }

      if (validFiles.length === 0) return;

      const readers = validFiles.map(file => {
        return new Promise<{ data: string; type: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              data: e.target?.result as string,
              type: file.type === 'application/pdf' ? 'pdf' : 'image'
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        const newItems = results.map(r => JSON.stringify(r));
        setMultipleImages(prev => [...prev, ...newItems]);
        const imageCount = results.filter(r => r.type === 'image').length;
        const pdfCount = results.filter(r => r.type === 'pdf').length;
        let description = `Totaal: ${multipleImages.length + results.length} bestanden`;
        toast({
          title: `${imageCount > 0 ? `${imageCount} foto${imageCount > 1 ? "'s" : ""}` : ""}${imageCount > 0 && pdfCount > 0 ? " en " : ""}${pdfCount > 0 ? `${pdfCount} PDF${pdfCount > 1 ? "'s" : ""}` : ""} toegevoegd`,
          description,
        });
      });
    }
  };

  // Add camera photo to multiple images
  const addCameraPhotoToMultiple = () => {
    if (capturedImage) {
      // Store as JSON format consistent with file uploads
      const imageItem = JSON.stringify({ data: capturedImage, type: 'image' });
      setMultipleImages(prev => [...prev, imageItem]);
      toast({
        title: "Foto toegevoegd!",
        description: `Totaal: ${multipleImages.length + 1} foto's`,
      });
      setCapturedImage(null);
      setCameraActive(false);
      stopCamera();
    }
  };

  // Remove image from multiple images
  const removeImageFromMultiple = (index: number) => {
    setMultipleImages(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Foto verwijderd",
      description: `Nog ${multipleImages.length - 1} foto's over`,
    });
  };

  // Process image(s) using local OCR and parsing (no credits!)
  const processImage = async () => {
    const { dismiss } = toast({
      title: t("scan.analyzing") || "Analyseren...",
      description: t("scan.ocrProcessing") || "Tekst wordt geëxtraheerd uit je menu...",
      duration: 120000,
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only log scan to database if user is logged in
      if (user) {
        await supabase.from("scans").insert({
          user_id: user.id,
          scan_method: mode,
        });
      }

      const imagesToProcess = mode === "multiple" ? multipleImages : [capturedImage];
      
      // Extract image data from JSON format
      const imageDataList = imagesToProcess
        .filter((item): item is string => item !== null)
        .map(item => {
          const parsed = parseImageData(item);
          return parsed.data;
        });

      if (imageDataList.length === 0) {
        dismiss();
        setErrorMessage("Geen afbeeldingen om te verwerken.");
        setMode("error");
        return;
      }

      // Step 1: OCR - Extract text from images locally (FREE!)
      let combinedText = '';
      for (let i = 0; i < imageDataList.length; i++) {
        toast({
          title: `OCR bezig... (${i + 1}/${imageDataList.length})`,
          description: "Tekst wordt uit de afbeelding gehaald...",
          duration: 30000,
        });
        
        const result = await extractTextFromImage(imageDataList[i]);
        combinedText += `\n--- Pagina ${i + 1} ---\n${result.text}`;
      }

      // Step 2: Parse menu from OCR text locally (FREE!) - now uses learned patterns
      const parsedMenu = await parseMenuFromText(combinedText);

      if (!parsedMenu.isMenu || parsedMenu.dishes.length === 0) {
        dismiss();
        setErrorMessage("De afbeelding lijkt geen menu te zijn of er konden geen gerechten worden gevonden. Zorg ervoor dat de foto duidelijk en goed verlicht is.");
        setMode("error");
        return;
      }

      // Enhance dishes with additional allergen detection
      const enhancedDishes = parsedMenu.dishes.map(dish => enhanceDishAllergens(dish));

      // Step 3: Match against curated DB for verified allergens (zero-AI)
      let matchSummary: any = undefined;
      let mergedDishes = enhancedDishes;
      try {
        const { data: matchData, error: matchErr } = await supabase.functions.invoke('match-menu', {
          body: {
            dishes: enhancedDishes.map((d: any) => ({
              name: d.name,
              description: d.description,
              raw_text: d.name,
            })),
          },
        });
        if (!matchErr && matchData?.results) {
          matchSummary = matchData.summary;
          mergedDishes = enhancedDishes.map((d: any, i: number) => {
            const m = matchData.results[i] || {};
            return {
              ...d,
              source: m.source,
              confidence: m.confidence,
              similarity: m.similarity,
              matched_ingredients: m.matched_ingredients,
              // If DB has verified allergens, prefer those over locally-parsed ones
              allergens: m.source === 'verified' && m.allergens?.length ? m.allergens : d.allergens,
            };
          });
        }
      } catch (e) {
        console.warn('match-menu unavailable, using local parser only:', e);
      }
      setMatchSummary(matchSummary);

      // Telemetry: one event per scan with aggregate counts (guest OR logged-in).
      // Voedt cold-start analyse + curatie-prioritering. Falen mag niet de scan-flow breken.
      if (matchSummary) {
        try {
          await (supabase as any).from('dish_match_events').insert({
            user_id: user?.id ?? null,
            total_count: matchSummary.total,
            verified_count: matchSummary.verified,
            ingredient_inferred_count: matchSummary.ingredient_inferred,
            unknown_count: matchSummary.unknown,
            dishes: mergedDishes.map((d: any) => ({
              name: d.name,
              source: d.source ?? 'unknown',
              confidence: d.similarity ?? null,
            })),
          });
        } catch (telemetryErr) {
          console.warn('Telemetry insert failed (non-fatal):', telemetryErr);
        }
      }

      dismiss();

      // Get user allergies and preferences
      let allergies: string[] = [];
      let preferences: string[] = [];

      if (user) {
        const { data: prefs } = await supabase
          .from("preferences")
          .select("*")
          .eq("user_id", user.id);

        if (prefs) {
          allergies = prefs
            .filter(p => p.preference_type === "allergie")
            .map(p => p.preference_value);
          preferences = prefs
            .filter(p => p.preference_type === "dieet")
            .map(p => p.preference_value);
        }
      } else {
        // Guest user - get from localStorage
        const guestPrefs = localStorage.getItem("guestPreferences");
        if (guestPrefs) {
          const prefs = JSON.parse(guestPrefs);
          allergies = prefs.allergies || [];
          preferences = prefs.preferences || [];
        }
      }

      setAnalyzedDishes(mergedDishes);
      setUserAllergies(allergies);
      setUserPreferences(preferences);
      
      // Store menu template info
      setMenuTemplate({
        categories: parsedMenu.categories || [],
        style: {}
      });

      // If business user, generate QR code and save to database
      if (userType === "eetgever" && user) {
        const generatedQrCode = `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert menu and get the ID back
        const { data: menuData, error: menuError } = await supabase
          .from("menus")
          .insert({
            business_user_id: user.id,
            qr_code: generatedQrCode,
            menu_image_url: capturedImage,
          })
          .select('id')
          .single();

        if (menuError) {
          throw menuError;
        }

        // Insert all dishes with the menu_id
        const dishesToInsert = enhancedDishes.map((dish: any) => ({
          menu_id: menuData.id,
          name: dish.name,
          description: dish.description || '',
          price: dish.price || '',
          ingredients: dish.ingredients || [],
          allergens: dish.allergens || [],
          dietary_info: dish.dietary_info || [],
        }));

        const { error: dishesError } = await supabase
          .from("dishes")
          .insert(dishesToInsert);

        if (dishesError) {
          console.error("Error saving dishes:", dishesError);
        }

        setQrCode(generatedQrCode);
        toast({
          title: "QR Code Gegenereerd! ✓",
          description: `${enhancedDishes.length} gerechten gevonden en opgeslagen.`,
        });
      } else {
        toast({
          title: "Menu Geanalyseerd! ✓",
          description: `${enhancedDishes.length} gerechten gevonden en vergeleken met je voorkeuren.`,
        });
      }
      
      // Increment scan count for rate limiting (guests only)
      if (isGuestUser()) {
        incrementScanCount();
        const remaining = getScanLimitInfo().remaining;
        if (remaining <= 2 && remaining > 0) {
          toast({
            title: `Nog ${remaining} gratis scan${remaining === 1 ? '' : 's'} over vandaag`,
            description: "Maak een account aan voor onbeperkte scans!",
          });
        }
      }
      
      setScanned(true);
    } catch (error: any) {
      console.error("Error processing scan:", error);
      dismiss();
      setErrorMessage(
        "Er ging iets mis bij het analyseren. Zorg dat de foto goed leesbaar is en probeer het opnieuw."
      );
      setMode("error");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera when mode changes to camera
  useEffect(() => {
    if (mode === "camera" && !cameraActive && !capturedImage) {
      startCamera();
    }
  }, [mode]);

  const resetScan = () => {
    setCapturedImage(null);
    setMultipleImages([]);
    setMode("select");
    setScanned(false);
    setQrCode(null);
    setAnalyzedDishes([]);
    setUserAllergies([]);
    setUserPreferences([]);
    setMenuTemplate({});
    setErrorMessage("");
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="flex items-center gap-2 fixed top-4 right-4 z-50">
        <ThemeToggle />
        <LanguageToggle fixed={false} />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("scan.back")}
          </Button>
        </Link>

        {!scanned ? (
          <>
            {mode === "select" && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-4">{t("scan.title")}</h1>
                  <p className="text-lg text-muted-foreground">
                    {t("scan.subtitle")}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card 
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer"
                    onClick={() => handleModeSelection("camera")}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("scan.camera")}</h3>
                    <p className="text-muted-foreground">
                      {t("scan.cameraDesc")}
                    </p>
                  </Card>

                  <Card 
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer border-primary/50"
                    onClick={() => handleModeSelection("multiple")}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("scan.upload")}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t("scan.uploadCombineDesc")}
                    </p>
                  </Card>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <input
                  ref={multipleFileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                />

                <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
                  <h4 className="font-semibold mb-2">{t("scan.tipsTitle")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{t("scan.tip1")}</li>
                    <li>{t("scan.tip2")}</li>
                    <li>{t("scan.tip3")}</li>
                  </ul>
                </div>
              </div>
            )}

            {mode === "camera" && (
              <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                <p className="text-white text-lg">Camera wordt geopend…</p>
              </div>
            )}

{/* Old single image view removed - now using multiple images view */}

            {mode === "multiple" && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">
                    {multipleImages.length > 0 ? t("scan.checkPhoto") : t("scan.multipleTitle")}
                  </h1>
                  <p className="text-muted-foreground">
                    {multipleImages.length > 0 
                      ? t("scan.photosCount").replace("{count}", String(multipleImages.length))
                      : t("scan.addPhotos")
                    }
                  </p>
                </div>

                {/* Display images in dynamic grid based on count */}
                {multipleImages.length > 0 && (
                  <div className={`mb-6 grid gap-4 ${
                    multipleImages.length === 1 
                      ? 'grid-cols-1' 
                      : 'grid-cols-2'
                  }`}>
                    {multipleImages.map((item, index) => {
                      let itemData: string;
                      let itemType: string;
                      try {
                        const parsed = JSON.parse(item);
                        itemData = parsed.data;
                        itemType = parsed.type;
                      } catch {
                        itemData = item;
                        itemType = 'image';
                      }

                      return (
                        <Card key={index} className="overflow-hidden relative group">
                          {itemType === 'pdf' ? (
                            <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center">
                              <svg className="h-16 w-16 text-primary mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h2v5h-2v-5zm5 0h2v5h-2v-5z"/>
                              </svg>
                              <span className="text-sm text-muted-foreground">PDF {index + 1}</span>
                            </div>
                          ) : (
                            <img
                              src={itemData}
                              alt={`Menu foto ${index + 1}`}
                              className={`w-full object-cover ${
                                multipleImages.length === 1 ? 'h-auto' : 'aspect-square'
                              }`}
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImageFromMultiple(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 text-sm font-medium">
                            {t("scan.photoLabel")} {index + 1}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <input
                  ref={multipleFileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                />

                {/* Buttons: Add photo (if < 4) + Scan side by side */}
                {multipleImages.length > 0 && (
                  <div className="flex gap-4">
                    {multipleImages.length < 4 && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          setMode("camera");
                        }}
                        className="flex-1"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        {t("scan.addPhoto")}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={processImage}
                      className={`bg-primary hover:bg-primary/90 ${multipleImages.length >= 4 ? 'w-full' : 'flex-1'}`}
                    >
                      {t("scan.scanButton")}
                    </Button>
                  </div>
                )}

                {/* If no images yet, show message to take photo */}
                {multipleImages.length === 0 && (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">{t("scan.takePhotoFirst")}</p>
                    <Button
                      size="lg"
                      onClick={() => setMode("camera")}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      {t("scan.takePhoto")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {mode === "error" && (
              <div className="max-w-2xl mx-auto">
                <Card className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                      <X className="h-10 w-10 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-3">{t("scan.errorTitle")}</h2>
                      <p className="text-muted-foreground mb-6">
                        {errorMessage}
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-6 text-left">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        {t("scan.suggestionsTitle").replace("💡 ", "")}
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t("scan.suggestion1")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t("scan.suggestion2")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t("scan.suggestion3")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t("scan.suggestion4")}</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      size="lg"
                      onClick={resetScan}
                      className="w-full sm:w-auto"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      {t("scan.tryAgain")}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {userType === "eetgever" && qrCode ? (
              <div className="max-w-2xl mx-auto">
                <Card className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Menu succesvol gescand!</h2>
                      <p className="text-muted-foreground">
                        Voeg nu je gerechten en ingrediënten toe voor een gedetailleerd menu.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={resetScan}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nieuw Menu Scannen
                      </Button>
                      <Button onClick={async () => {
                        const { data: menuData } = await supabase
                          .from("menus")
                          .select("id")
                          .eq("qr_code", qrCode)
                          .single();
                        
                        if (menuData) {
                          navigate(`/menu/${menuData.id}/edit`);
                        }
                      }}>
                        Gerechten Toevoegen
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : isGuest ? (
              <GuestMenuResults 
                dishes={analyzedDishes}
                categories={menuTemplate.categories}
                menuStyle={menuTemplate.style}
              />
            ) : (
              <MenuResults
                dishes={analyzedDishes}
                userAllergies={userAllergies}
                userPreferences={userPreferences}
                menuStyle={menuTemplate.style}
                matchSummary={matchSummary}
              />
            )}
          </>
        )}
      </div>

      <AlertDialog open={showAd} onOpenChange={(open) => {
        if (!open && adCountdown > 0) {
          handleAdSkip();
        }
        setShowAd(open);
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center">{t("ad.sponsoredMessage")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-6 py-6">
                {/* Google AdSense Ad Container */}
                <div className="min-h-[250px] bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
                  <AdSenseAd 
                    adSlot="7704507845" 
                    adFormat="auto" 
                    fullWidthResponsive={true}
                    className="w-full"
                  />
                </div>
                
                <div className="text-center">
                  <Button
                    onClick={handleAdClose}
                    disabled={adCountdown > 0}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {adCountdown > 0 
                      ? t("ad.continueIn").replace("{seconds}", String(adCountdown))
                      : t("ad.continueToScan")
                    }
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("ad.redirectMessage")}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Scan;
