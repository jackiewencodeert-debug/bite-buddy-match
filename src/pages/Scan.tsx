import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft, X, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { MenuResults } from "@/components/MenuResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Scan = () => {
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<"select" | "camera" | "upload">("select");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      // Log scan to database
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("scans").insert({
        user_id: user?.id || null,
        scan_method: mode,
      });

      // Simulate processing
      toast({
        title: "Menukaart analyseren...",
        description: "Even geduld, we scannen de ingrediënten.",
      });
      
      setTimeout(() => {
        setScanned(true);
      }, 1500);
    } catch (error) {
      console.error("Error logging scan:", error);
      // Continue anyway
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
          <MenuResults />
        )}
      </div>
    </div>
  );
};

export default Scan;
