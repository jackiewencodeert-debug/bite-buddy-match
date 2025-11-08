import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft, X, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MenuResults } from "@/components/MenuResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Scan = () => {
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<"select" | "camera" | "upload">("select");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUserType();
  }, []);

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

  // Process image
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

      toast({
        title: "Menukaart analyseren...",
        description: "Even geduld, we scannen de ingrediënten.",
      });

      // If business user, generate QR code
      if (userType === "eetgever" && user) {
        const generatedQrCode = `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { error } = await supabase.from("menus").insert({
          business_user_id: user.id,
          qr_code: generatedQrCode,
          menu_image_url: capturedImage,
        });

        if (!error) {
          setQrCode(generatedQrCode);
        }
      }
      
      setTimeout(() => {
        setScanned(true);
      }, 1500);
    } catch (error) {
      console.error("Error processing scan:", error);
      toast({
        title: "Menukaart analyseren...",
        description: "Even geduld, we scannen de ingrediënten.",
      });
      
      setTimeout(() => {
        setScanned(true);
      }, 1500);
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
    setMode("select");
    setScanned(false);
    setQrCode(null);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </Link>

        {!scanned ? (
          <>
            {mode === "select" && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-4">Menu Scannen</h1>
                  <p className="text-lg text-muted-foreground">
                    Kies hoe je de menukaart wilt uploaden
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card 
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer"
                    onClick={() => setMode("camera")}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Camera</h3>
                    <p className="text-muted-foreground">
                      Scan direct met je camera
                    </p>
                  </Card>

                  <Card 
                    className="p-8 text-center hover:shadow-hover transition-all cursor-pointer"
                    onClick={() => {
                      setMode("upload");
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload</h3>
                    <p className="text-muted-foreground">
                      Upload een foto of PDF
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

                <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
                  <h4 className="font-semibold mb-2">💡 Tips voor beste resultaten:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Zorg voor goede verlichting</li>
                    <li>Houd de camera stabiel</li>
                    <li>Zorg dat de tekst goed leesbaar is</li>
                  </ul>
                </div>
              </div>
            )}

            {mode === "camera" && !capturedImage && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">Maak een foto</h1>
                  <p className="text-muted-foreground">
                    Positioneer de menukaart in beeld
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
                            Annuleren
                          </Button>
                          <Button
                            size="lg"
                            onClick={capturePhoto}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Foto Maken
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {capturedImage && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">Controleer je foto</h1>
                  <p className="text-muted-foreground">
                    Is de menukaart goed leesbaar?
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
                      Opnieuw
                    </Button>
                    <Button
                      size="lg"
                      onClick={processImage}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Scannen
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
                        Je QR-code is gegenereerd. Klanten kunnen deze scannen om het menu te vergelijken met hun allergieën.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">QR Code:</p>
                      <p className="font-mono font-semibold">{qrCode}</p>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={resetScan}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nieuw Menu Scannen
                      </Button>
                      <Link to={`/menu/${qrCode}`}>
                        <Button>
                          Bekijk QR-Code
                        </Button>
                      </Link>
                      <Link to="/business">
                        <Button variant="secondary">
                          Naar Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <MenuResults />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Scan;
