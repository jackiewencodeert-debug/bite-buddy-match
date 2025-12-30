import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, X, Save, Camera, Upload, Edit3, QrCode, RotateCcw, Settings, Trash2, Pencil, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { z } from "zod";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Validation schema for dish inputs
const dishSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  price: z.string().max(20, "Price must be less than 20 characters").regex(/^(€?\s?\d{1,6}([,.]\d{1,2})?)?$/, "Invalid price format").optional(),
  ingredients: z.array(z.string().trim().max(50, "Ingredient must be less than 50 characters")).min(1, "At least one ingredient required").max(30, "Maximum 30 ingredients allowed"),
  allergens: z.array(z.string().max(50)).max(20),
  dietary_info: z.array(z.string().max(50)).max(10),
});

const ingredientSchema = z.string().trim().min(1, "Ingredient cannot be empty").max(50, "Ingredient must be less than 50 characters");

interface Dish {
  id?: string;
  name: string;
  description: string;
  price: string;
  ingredients: string[];
  allergens: string[];
  dietary_info: string[];
}

const commonAllergens = [
  "noten", "gluten", "lactose", "schaaldieren", "vis", 
  "eieren", "soja", "sulfiet", "pinda's", "sesam"
];

const commonDietaryPreferences = [
  "vegetarisch", "veganistisch", "kosher", "halal"
];

// Descriptions and examples for allergens
const allergenDescriptions: Record<string, string> = {
  "noten": "Alle soorten noten zoals walnoten, hazelnoten, cashewnoten, pistachenoten, amandelen, pecannoten, macadamianoten",
  "gluten": "Eiwit in granen zoals tarwe, rogge, gerst, spelt. Voorbeelden: brood, pasta, koekjes, bier",
  "lactose": "Melksuiker in zuivelproducten zoals melk, kaas, yoghurt, roomijs, boter",
  "schaaldieren": "Kreeft, krab, garnalen, langoustines, rivierkreeft, mosselen, oesters",
  "vis": "Alle soorten vis zoals zalm, tonijn, kabeljauw, makreel, haring, sardines",
  "eieren": "Kippen- en andere eieren. Voorbeelden: mayonaise, cake, pasta, meringue",
  "soja": "Sojabonen en -producten zoals tofu, tempeh, sojasaus, edamame, miso",
  "sulfiet": "Conserveermiddel in wijn, gedroogd fruit, mosterd, garnalen, aardappelproducten",
  "pinda's": "Pinda's en pindaproducten zoals pindakaas, satésaus, pinda-olie",
  "sesam": "Sesamzaadjes, tahini, hummus, sesamolie, veel Aziatische gerechten"
};

// Descriptions and examples for dietary preferences
const dietaryDescriptions: Record<string, string> = {
  "vegetarisch": "Geen vlees of vis. Wel zuivel en eieren. Voorbeelden: groentecurry, pasta met kaas, omelet",
  "veganistisch": "Geen dierlijke producten. Geen vlees, vis, zuivel, eieren of honing. Voorbeelden: falafel, plantaardige curry",
  "halal": "Islamitisch toegestaan voedsel. Geen varkensvlees, halal geslacht vlees. Geen alcohol",
  "kosher": "Joods toegestaan voedsel. Scheiding vlees en zuivel, specifieke slachtmethoden",
  "glutenvrij": "Geen gluten. Geschikt voor mensen met coeliakie. Voorbeelden: rijst, aardappelen, quinoa",
  "lactosevrij": "Geen lactose (melksuiker). Geschikt bij lactose-intolerantie. Vaak wel lactosevrije zuivel"
};

const MenuEditor = () => {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menuName, setMenuName] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  // Scan mode states
  const [mode, setMode] = useState<"editor" | "scan" | "camera">("editor");
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [multipleImages, setMultipleImages] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newDish, setNewDish] = useState<Dish>({
    name: "",
    description: "",
    price: "",
    ingredients: [],
    allergens: [],
    dietary_info: []
  });
  const [newIngredient, setNewIngredient] = useState("");
  const [businessAllergens, setBusinessAllergens] = useState<string[]>([]);
  const [editingDish, setEditingDish] = useState<string | null>(null);

  useEffect(() => {
    loadMenuAndDishes();
    loadBusinessProfile();
    
    const method = searchParams.get('method');
    if (method === 'scan') {
      setMode("scan");
    }
    
    return () => {
      stopCamera();
    };
  }, [menuId]);

  const loadBusinessProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_allergen_warnings")
        .eq("id", user.id)
        .single();

      if (profile?.business_allergen_warnings) {
        setBusinessAllergens(profile.business_allergen_warnings);
      }
    } catch (error) {
      console.error("Error loading business profile:", error);
    }
  };

  const loadMenuAndDishes = async () => {
    try {
      // Load menu info
      const { data: menuData } = await supabase
        .from("menus")
        .select("*")
        .eq("id", menuId)
        .single();

      if (menuData) {
        const menuDataJson = menuData.menu_data as { name?: string } | null;
        setMenuName(menuDataJson?.name || "");
        setQrCode(menuData.qr_code);
      }

      // Load dishes
      const { data: dishesData } = await supabase
        .from("dishes")
        .select("*")
        .eq("menu_id", menuId);

      if (dishesData) {
        setDishes(dishesData);
      }
    } catch (error: any) {
      toast({
        title: t("editor.loadError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Camera functions
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
        title: t("common.error"),
        description: "Kon geen toegang krijgen tot de camera.",
        variant: "destructive",
      });
      setMode("editor");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (mode === "camera" && !cameraActive && !capturedImage) {
      startCamera();
    }
  }, [mode]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setMultipleImages(prev => [...prev, imageData]);
        stopCamera();
        setMode("scan");
        toast({
          title: "Foto toegevoegd!",
          description: `Totaal: ${multipleImages.length + 1} foto's`,
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      Array.from(files).forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (oversizedFiles.length > 0) {
        toast({
          title: t("scan.fileTooLarge"),
          description: t("scan.fileTooLargeDesc").replace("{files}", oversizedFiles.join(", ")),
          variant: "destructive",
        });
      }

      if (validFiles.length === 0) return;

      const readers = validFiles.map(file => {
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
        const fileCount = images.length;
        const isPdf = validFiles.some(f => f.type === 'application/pdf');
        toast({
          title: `${fileCount} ${isPdf ? t("scan.filesAdded") : (fileCount > 1 ? t("scan.photosAddedPlural") : t("scan.photoAdded"))}`,
          description: `${t("scan.total")}: ${multipleImages.length + fileCount}`,
        });
      });
    }
  };

  const removeImage = (index: number) => {
    setMultipleImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMenuImage = async (imageData: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create unique filename
      const fileName = `${user.id}/${menuId}-${Date.now()}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading menu image:', error);
      return null;
    }
  };

  const analyzeImages = async () => {
    if (multipleImages.length === 0) return;

    setAnalyzing(true);
    try {
      // Upload the first image to storage for later download with QR
      const menuImageUrl = await uploadMenuImage(multipleImages[0]);
      
      if (menuImageUrl) {
        // Update menu with image URL
        await supabase
          .from("menus")
          .update({ menu_image_url: menuImageUrl })
          .eq("id", menuId);
      }

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-menu', {
        body: { 
          images: multipleImages,
          isMultiple: multipleImages.length > 1
        }
      });

      if (analysisError) throw analysisError;

      if (!analysisData.isMenu) {
        toast({
          title: t("common.error"),
          description: "De afbeelding lijkt geen menu te zijn.",
          variant: "destructive",
        });
        return;
      }

      if (analysisData.dishes && analysisData.dishes.length > 0) {
        // Helper function to extract original value from translated item
        const extractOriginal = (item: any): string => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.original) return item.original;
          return String(item);
        };

        // Add analyzed dishes to database
        const dishesToInsert = analysisData.dishes.map((dish: any) => ({
          menu_id: menuId,
          name: dish.name,
          description: dish.description || '',
          price: dish.price || '',
          ingredients: (dish.ingredients || []).map(extractOriginal),
          allergens: [...new Set([...(dish.allergens || []).map(extractOriginal), ...businessAllergens])],
          dietary_info: (dish.dietary_info || []).map(extractOriginal),
        }));

        const { error: insertError } = await supabase
          .from("dishes")
          .insert(dishesToInsert);

        if (insertError) throw insertError;

        toast({
          title: t("common.success"),
          description: `${analysisData.dishes.length} gerechten toegevoegd!`,
        });

        // Reload dishes
        loadMenuAndDishes();
        setMultipleImages([]);
        setMode("editor");
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addIngredient = () => {
    const result = ingredientSchema.safeParse(newIngredient);
    if (!result.success) {
      toast({
        title: t("editor.validationError"),
        description: result.error.errors[0]?.message || t("editor.invalidIngredient"),
        variant: "destructive",
      });
      return;
    }
    
    if (newDish.ingredients.length >= 30) {
      toast({
        title: t("editor.validationError"),
        description: t("editor.maxIngredients"),
        variant: "destructive",
      });
      return;
    }
    
    setNewDish({
      ...newDish,
      ingredients: [...newDish.ingredients, result.data]
    });
    setNewIngredient("");
  };

  const removeIngredient = (index: number) => {
    setNewDish({
      ...newDish,
      ingredients: newDish.ingredients.filter((_, i) => i !== index)
    });
  };

  const toggleAllergen = (allergen: string) => {
    setNewDish({
      ...newDish,
      allergens: newDish.allergens.includes(allergen)
        ? newDish.allergens.filter(a => a !== allergen)
        : [...newDish.allergens, allergen]
    });
  };

  const toggleDietaryInfo = (preference: string) => {
    setNewDish({
      ...newDish,
      dietary_info: newDish.dietary_info.includes(preference)
        ? newDish.dietary_info.filter(p => p !== preference)
        : [...newDish.dietary_info, preference]
    });
  };

  const addDish = async () => {
    const validationResult = dishSchema.safeParse(newDish);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: t("editor.validationError"),
        description: firstError?.message || t("editor.incompleteDesc"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const validatedDish = validationResult.data;
      const allAllergens = [...new Set([...validatedDish.allergens, ...businessAllergens])];

      const { error } = await supabase.from("dishes").insert({
        menu_id: menuId,
        name: validatedDish.name,
        description: validatedDish.description || "",
        price: validatedDish.price || "",
        ingredients: validatedDish.ingredients,
        allergens: allAllergens,
        dietary_info: validatedDish.dietary_info
      });

      if (error) throw error;

      toast({
        title: t("editor.dishAdded"),
        description: t("editor.dishAddedDesc").replace("{name}", newDish.name),
      });

      setNewDish({
        name: "",
        description: "",
        price: "",
        ingredients: [],
        allergens: [],
        dietary_info: []
      });

      loadMenuAndDishes();
    } catch (error: any) {
      toast({
        title: t("editor.saveError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDish = async (dishId: string) => {
    try {
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", dishId);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("editor.dishDeleted"),
      });

      loadMenuAndDishes();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditDish = (dish: Dish) => {
    setNewDish({
      name: dish.name,
      description: dish.description || "",
      price: dish.price || "",
      ingredients: dish.ingredients || [],
      allergens: dish.allergens || [],
      dietary_info: dish.dietary_info || [],
    });
    setEditingDish(dish.id || null);
    // Scroll to the add dish form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    navigate("/business");
  };

  const handleCreateQR = () => {
    setShowQRDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Scan mode view
  if (mode === "scan") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <LanguageToggle />
        
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => setMode("editor")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">{t("scan.title")}</h1>
            <p className="text-muted-foreground">
              {multipleImages.length > 0 
                ? t("scan.photosAddedCount").replace("{count}", multipleImages.length.toString())
                : t("scan.addPhotos")
              }
            </p>
          </div>

          {multipleImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {multipleImages.map((image, index) => (
                <Card key={index} className="overflow-hidden relative group">
                  <img
                    src={image}
                    alt={`${t("scan.menuPage")} ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setMode("camera")}
                className="w-full"
              >
                <Camera className="mr-2 h-5 w-5" />
                {t("scan.camera")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-5 w-5" />
                {t("scan.upload")}
              </Button>
            </div>

            {multipleImages.length > 0 && (
              <Button
                size="lg"
                onClick={analyzeImages}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("scan.analyzing")}
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    {t("scan.scanButton")} ({t("scan.photosAddedCount").replace("{count}", multipleImages.length.toString())})
                  </>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => setMode("editor")}
            >
              {t("editor.skipToManual")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Camera mode view
  if (mode === "camera") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <LanguageToggle />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">{t("scan.makePhoto")}</h1>
            <p className="text-muted-foreground">{t("scan.position")}</p>
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
                      onClick={() => {
                        stopCamera();
                        setMode("scan");
                      }}
                      className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
                    >
                      <X className="mr-2 h-5 w-5" />
                      {t("common.cancel")}
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
      </div>
    );
  }

  // Editor mode view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("editor.backToDashboard")}
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{menuName || t("editor.title")}</h1>
          <p className="text-muted-foreground">
            {t("editor.subtitle")}
          </p>
        </div>

        {/* Scan menu button */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setMode("scan")}
            >
              <Camera className="mr-2 h-4 w-4" />
              {t("editor.scanToAdd")}
            </Button>
          </CardContent>
        </Card>

        {businessAllergens.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">⚠️ {t("editor.defaultAllergens")}</CardTitle>
              <CardDescription>
                {t("editor.defaultAllergensDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {businessAllergens.map((allergen) => (
                  <Badge key={allergen} variant="destructive">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("editor.addDish")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("editor.dishName")} *</Label>
                <Input
                  placeholder={t("editor.dishNamePlaceholder")}
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("editor.price")}</Label>
                <Input
                  placeholder="€12,50"
                  value={newDish.price}
                  onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("editor.description")}</Label>
              <Textarea
                placeholder={t("editor.descriptionPlaceholder")}
                value={newDish.description}
                onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("editor.ingredients")} *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("editor.addIngredient")}
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                />
                <Button type="button" onClick={addIngredient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newDish.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newDish.ingredients.map((ing, index) => (
                    <Badge key={index} variant="secondary">
                      {ing}
                      <button
                        onClick={() => removeIngredient(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("editor.dietaryPreferences")}</Label>
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonDietaryPreferences.map((preference) => (
                    <Tooltip key={preference}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 cursor-help">
                          <Checkbox
                            id={`dietary-${preference}`}
                            checked={newDish.dietary_info.includes(preference)}
                            onCheckedChange={() => toggleDietaryInfo(preference)}
                          />
                          <Label htmlFor={`dietary-${preference}`} className="cursor-pointer">
                            {preference}
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{dietaryDescriptions[preference] || preference}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            <div className="space-y-2">
              <Label>{t("editor.extraAllergens")}</Label>
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonAllergens.map((allergen) => (
                    <Tooltip key={allergen}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 cursor-help">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            checked={newDish.allergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                            disabled={businessAllergens.includes(allergen)}
                          />
                          <Label htmlFor={`allergen-${allergen}`} className="cursor-pointer">
                            {allergen}
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{allergenDescriptions[allergen] || allergen}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            <Button onClick={addDish} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("editor.saving")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("editor.addDishBtn")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {dishes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.addedDishes")} ({dishes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dishes.map((dish) => (
                <div key={dish.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                  <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{dish.name}</h3>
                        {dish.dietary_info && dish.dietary_info.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dish.dietary_info
                              .filter(pref => !(pref === "vegetarisch" && dish.dietary_info.includes("veganistisch")))
                              .map((pref, i) => (
                                <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                  {pref}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                      {dish.description && (
                        <p className="text-sm text-muted-foreground mt-1">{dish.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dish.ingredients.map((ing, i) => (
                          <Badge key={i} variant="outline">
                            {ing}
                          </Badge>
                        ))}
                      </div>
                      {dish.allergens && dish.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {dish.allergens.map((allergen, i) => (
                            <Badge key={i} variant="destructive">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {dish.price && (
                        <span className="font-semibold text-muted-foreground">
                          {dish.price}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => startEditDish(dish)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("editor.editDish")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteDish(dish.id!)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("editor.deleteDish")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Bottom action buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleFinish} 
            size="lg" 
            variant="outline"
            className="flex-1"
          >
            {t("editor.done")}
          </Button>
          <Button 
            onClick={handleCreateQR} 
            size="lg"
            className="flex-1"
          >
            <QrCode className="mr-2 h-5 w-5" />
            {t("editor.createQR")}
          </Button>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editor.qrCodeTitle")}</DialogTitle>
            <DialogDescription>
              {t("editor.qrCodeDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="bg-white p-4 rounded-lg">
              <QRCode 
                id="qr-code-svg"
                value={`https://www.bitebuddymatch.com/menu/${qrCode}`}
                size={200}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t("editor.qrCodeLink")}: https://www.bitebuddymatch.com/menu/{qrCode}
            </p>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://www.bitebuddymatch.com/menu/${qrCode}`);
                    toast({
                      title: t("common.success"),
                      description: t("editor.linkCopied"),
                    });
                  }}
                >
                  {t("editor.copyLink")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/menu/${qrCode}`)}
                >
                  {t("editor.viewMenu")}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const svg = document.querySelector('#qr-code-svg');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    img.onload = () => {
                      canvas.width = 200;
                      canvas.height = 200;
                      ctx?.drawImage(img, 0, 0);
                      
                      const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                      });
                      
                      // Add title
                      pdf.setFontSize(24);
                      pdf.text(menuName || 'Menu QR Code', 105, 40, { align: 'center' });
                      
                      // Add QR code image centered
                      const imgData = canvas.toDataURL('image/png');
                      pdf.addImage(imgData, 'PNG', 55, 60, 100, 100);
                      
                      // Add link below QR
                      pdf.setFontSize(10);
                      pdf.text(`https://www.bitebuddymatch.com/menu/${qrCode}`, 105, 175, { align: 'center' });
                      
                      // Add footer
                      pdf.setFontSize(8);
                      pdf.text('Powered by BiteBuddyMatch', 105, 280, { align: 'center' });
                      
                      pdf.save(`${menuName || 'menu'}-qr-code.pdf`);
                    };
                    
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("editor.downloadPDF")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuEditor;