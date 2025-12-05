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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MenuResults } from "@/components/MenuResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdMobService } from "@/services/admob";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const Scan = () => {
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<"select" | "camera" | "upload" | "multiple" | "error">("select");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [multipleImages, setMultipleImages] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const [showAd, setShowAd] = useState(false);
  const [pendingMode, setPendingMode] = useState<"camera" | "upload" | "multiple" | null>(null);
  const [adCountdown, setAdCountdown] = useState(5);
  const [analyzedDishes, setAnalyzedDishes] = useState<any[]>([]);
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
    
    // Check for payment success
    if (searchParams.get('payment') === 'success') {
      toast({
        title: "Betaling geslaagd!",
        description: "Je kunt nu je menu scannen.",
      });
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
    // Check if user is eter or gast
    const guestType = localStorage.getItem("userType");
    const isGuest = guestType === "gast";
    
    if (isGuest || userType === "eter" || userType === "") {
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
      // Business users skip the ad
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

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Kon geen toegang krijgen tot de camera. Controleer je permissies.",
        variant: "destructive",
      });
      setMode("select");
    }
  };

  // Stop camera
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
        setCapturedImage(imageData);
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

  // Handle multiple file uploads
  const handleMultipleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const readers = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(images => {
        setMultipleImages(prev => [...prev, ...images]);
        toast({
          title: `${images.length} foto${images.length > 1 ? "'s" : ""} toegevoegd`,
          description: `Totaal: ${multipleImages.length + images.length} foto's`,
        });
      });
    }
  };

  // Add camera photo to multiple images
  const addCameraPhotoToMultiple = () => {
    if (capturedImage) {
      setMultipleImages(prev => [...prev, capturedImage]);
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

  // Process image(s)
  const processImage = async () => {
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
      const imageCount = imagesToProcess.length;

      toast({
        title: "Analyseren...",
        description: `De AI analyseert ${imageCount} foto${imageCount > 1 ? "'s" : ""}. Dit kan even duren.`,
      });

      // Call the AI edge function to analyze the menu(s)
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-menu', {
        body: { 
          images: imagesToProcess,
          isMultiple: mode === "multiple"
        }
      });

      if (analysisError) {
        throw analysisError;
      }

      if (!analysisData.isMenu) {
        setErrorMessage("De afbeelding lijkt geen menu te zijn. Zorg ervoor dat de foto duidelijk en goed verlicht is.");
        setMode("error");
        return;
      }

      if (!analysisData.dishes || analysisData.dishes.length === 0) {
        setErrorMessage("Er konden geen gerechten worden gevonden op deze afbeelding. Probeer een duidelijkere foto te maken.");
        setMode("error");
        return;
      }

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

      // Process dishes and add IDs
      const processedDishes = analysisData.dishes.map((dish: any, index: number) => ({
        ...dish,
        id: `dish-${index}`,
      }));

      setAnalyzedDishes(processedDishes);
      setUserAllergies(allergies);
      setUserPreferences(preferences);

      // If business user, generate QR code and save to database
      if (userType === "eetgever" && user) {
        // Check if payment was completed
        if (searchParams.get('payment') !== 'success') {
          toast({
            title: "Betaling vereist",
            description: "Je moet eerst betalen om een menu toe te voegen.",
            variant: "destructive",
          });
          navigate("/business");
          return;
        }

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
        const dishesToInsert = processedDishes.map((dish: any) => ({
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
          description: `${processedDishes.length} gerechten gevonden en opgeslagen.`,
        });
      } else {
        toast({
          title: "Menu Geanalyseerd! ✓",
          description: `${processedDishes.length} gerechten gevonden en vergeleken met je voorkeuren.`,
        });
      }
      
      setScanned(true);
    } catch (error: any) {
      console.error("Error processing scan:", error);
      setErrorMessage(
        error.message.includes("Rate limit") 
          ? "Er zijn te veel verzoeken gedaan. Probeer het over een paar minuten opnieuw."
          : error.message.includes("Payment required")
          ? "Er zijn onvoldoende credits. Voeg credits toe aan je workspace."
          : "Er ging iets mis bij het analyseren. Controleer je internetverbinding en probeer het opnieuw."
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
    setErrorMessage("");
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <LanguageToggle />
      
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

                <div className="grid md:grid-cols-3 gap-6">
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
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer"
                    onClick={() => handleModeSelection("upload")}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("scan.upload")}</h3>
                    <p className="text-muted-foreground">
                      {t("scan.uploadDesc")}
                    </p>
                  </Card>

                  <Card 
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer border-primary/50"
                    onClick={() => handleModeSelection("multiple")}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("scan.multiple")}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t("scan.multipleDesc")}
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
                  accept="image/*"
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

            {mode === "camera" && !capturedImage && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">{t("scan.makePhoto")}</h1>
                  <p className="text-muted-foreground">
                    {t("scan.position")}
                  </p>
                </div>

                <Card className="overflow-hidden">
                  <div className="relative bg-black aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {cameraActive && (
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-center gap-4">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={resetScan}
                            className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
                          >
                            <X className="mr-2 h-5 w-5" />
                            {t("scan.cancel")}
                          </Button>
                          <Button
                            size="lg"
                            onClick={capturePhoto}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            {t("scan.takePhoto")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {capturedImage && mode !== "multiple" && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">{t("scan.checkPhoto")}</h1>
                  <p className="text-muted-foreground">
                    {t("scan.readable")}
                  </p>
                </div>

                <Card className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured menu"
                      className="w-full h-auto"
                    />
                  </div>
                  
                  <div className="p-6 flex justify-center gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={resetScan}
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      {t("scan.retry")}
                    </Button>
                    <Button
                      size="lg"
                      onClick={processImage}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      {t("scan.scanButton")}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {mode === "multiple" && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">{t("scan.multipleTitle")}</h1>
                  <p className="text-muted-foreground">
                    {multipleImages.length > 0 
                      ? t("scan.photosAdded").replace("{count}", multipleImages.length.toString()).replace("{s}", multipleImages.length > 1 ? "'s" : "")
                      : t("scan.addPhotos")
                    }
                  </p>
                </div>

                {multipleImages.length > 0 && (
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {multipleImages.map((image, index) => (
                      <Card key={index} className="overflow-hidden relative group">
                        <img
                          src={image}
                          alt={`Menu pagina ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImageFromMultiple(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-1 text-sm">
                          {t("scan.page")} {index + 1}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => multipleFileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {t("scan.addMore")}
                  </Button>

                  {multipleImages.length > 0 && (
                    <Button
                      size="lg"
                      onClick={processImage}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      {t("scan.scanMultiple").replace("{count}", multipleImages.length.toString()).replace("{s}", multipleImages.length > 1 ? "'s" : "")}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={resetScan}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("common.back")}
                  </Button>
                </div>
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
            ) : (
              <MenuResults 
                dishes={analyzedDishes}
                userAllergies={userAllergies}
                userPreferences={userPreferences}
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
            <AlertDialogTitle className="text-2xl text-center">Gesponsorde Boodschap</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-6 py-6">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🍕</div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    Upgrade naar Premium!
                  </h3>
                  <p className="text-base text-muted-foreground mb-4">
                    Geniet van onbeperkte scans zonder advertenties en krijg toegang tot exclusieve functies.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      ✓ Onbeperkte scans
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      ✓ Geen advertenties
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      ✓ Premium support
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button
                    onClick={handleAdClose}
                    disabled={adCountdown > 0}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {adCountdown > 0 
                      ? `Doorgaan in ${adCountdown}s...` 
                      : "Doorgaan naar Scan"
                    }
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Je wordt doorgestuurd naar de scan na deze boodschap
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
