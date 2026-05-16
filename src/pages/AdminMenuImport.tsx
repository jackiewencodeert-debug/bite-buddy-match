// Admin curation UI — bulk-add geverifieerde gerechten aan de curated-dish database.
// Zero AI: PDF / image -> on-device OCR -> regex-parser -> per-dish allergen pickers.
// Toegankelijk via /admin/import, server-side beschermd door is_admin() RLS.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Wand2, Save, Loader2, Trash2, Plus } from "lucide-react";
import { extractTextFromImage } from "@/services/ocrService";
import * as pdfjsLib from "pdfjs-dist";

// pdfjs needs a worker URL — bundled lazily
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ALLERGENS = [
  "gluten", "schaaldieren", "eieren", "vis", "pinda",
  "soja", "melk", "noten", "selderij", "mosterd",
  "sesam", "sulfiet", "lupine", "weekdieren",
] as const;

const DIETARY_TAGS = [
  "vegetarisch", "veganistisch", "glutenvrij", "lactosevrij", "halal", "koosjer",
] as const;

const CATEGORIES = ["voorgerecht", "hoofdgerecht", "bijgerecht", "dessert", "drank"];

const PRICE_RE = /€\s*\d+[,.]?\d*|\d+[,.]?\d*\s*€/;
const CATEGORY_HEADER_RE = /^(voorgerechten|hoofdgerechten|bijgerechten|desserts?|dranken|starters|mains|sides|drinks)\s*:?\s*$/i;

interface DraftDish {
  tempId: string;
  name: string;
  description: string;
  price_eur: string;
  category: string;
  allergens: string[];
  dietary_tags: string[];
  ingredients: string[];
  isSaving?: boolean;
  isSaved?: boolean;
}

interface RestaurantOption {
  id: string;
  name: string;
  city: string;
}

interface MenuOption {
  id: string;
  name: string;
  restaurant_id: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function parseDishesFromText(text: string): DraftDish[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const draft: DraftDish[] = [];

  for (const line of lines) {
    if (CATEGORY_HEADER_RE.test(line)) continue;
    const priceMatch = line.match(PRICE_RE);
    if (!priceMatch) continue;
    const price = priceMatch[0].replace(/[€\s]/g, "").replace(",", ".");
    let name = line.replace(PRICE_RE, "").trim().replace(/[-–—…\.]+$/g, "").trim();
    if (!name || name.length < 2) continue;
    draft.push({
      tempId: uid(),
      name,
      description: "",
      price_eur: price,
      category: "hoofdgerecht",
      allergens: [],
      dietary_tags: [],
      ingredients: [],
    });
  }
  return draft;
}

export default function AdminMenuImport() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [menuId, setMenuId] = useState<string>("");

  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantCity, setNewRestaurantCity] = useState("");
  const [newMenuName, setNewMenuName] = useState("");

  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<DraftDish[]>([]);
  const [extracting, setExtracting] = useState(false);

  // Auth check via Supabase RLS — server already blocks writes for non-admins,
  // but redirect non-admins client-side too so the UI never shows.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: ok } = await supabase.rpc("is_admin", { uid: user.id });
      if (!ok) {
        toast({ title: "Geen toegang", description: "Alleen admins mogen hier komen.", variant: "destructive" });
        navigate("/");
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
    })();
  }, [navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data: rs } = await supabase
        .from("restaurants")
        .select("id, name, city")
        .order("name", { ascending: true });
      setRestaurants(rs ?? []);
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!restaurantId) {
      setMenus([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("curated_menus")
        .select("id, name, restaurant_id")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      setMenus(data ?? []);
    })();
  }, [restaurantId]);

  const handleFile = async (file: File) => {
    setExtracting(true);
    try {
      if (file.type === "application/pdf") {
        const buf = await file.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
        let text = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const tc = await page.getTextContent();
          text += tc.items.map((it: any) => it.str).join(" ") + "\n";
        }
        setRawText(text);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          const result = await extractTextFromImage(dataUrl);
          setRawText(result.text);
          setExtracting(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        toast({ title: "Niet ondersteund", description: "Alleen PDF en afbeeldingen.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Extract mislukt", description: e.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const detectDishes = () => {
    const parsed = parseDishesFromText(rawText);
    if (parsed.length === 0) {
      toast({ title: "Geen gerechten gevonden", description: "Controleer dat regels eindigen met €..." });
      return;
    }
    setDrafts(parsed);
    toast({ title: `${parsed.length} gerechten gedetecteerd` });
  };

  const updateDraft = (tempId: string, patch: Partial<DraftDish>) => {
    setDrafts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, ...patch } : d)));
  };

  const removeDraft = (tempId: string) =>
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));

  const addEmpty = () =>
    setDrafts((prev) => [...prev, {
      tempId: uid(), name: "", description: "", price_eur: "",
      category: "hoofdgerecht", allergens: [], dietary_tags: [], ingredients: [],
    }]);

  // For each draft, ask ingredient_allergens table what allergens its description
  // likely contains, then pre-check the boxes. Admin still verifies before saving.
  const autoSuggestAll = async () => {
    for (const d of drafts) {
      if (!d.description.trim()) continue;
      const tokens = d.description.toLowerCase().split(/[\s,;]+/).filter((t) => t.length > 2);
      const orParts = tokens.slice(0, 30).map((t) => `ingredient_name.ilike.%${t}%`).join(",");
      if (!orParts) continue;
      const { data } = await supabase
        .from("ingredient_allergens")
        .select("ingredient_name, allergens")
        .or(orParts)
        .limit(30);
      const found = new Set<string>(d.allergens);
      (data ?? []).forEach((m: any) => (m.allergens ?? []).forEach((a: string) => found.add(a)));
      updateDraft(d.tempId, { allergens: Array.from(found) });
    }
    toast({ title: "Auto-suggest klaar", description: "Controleer de vinkjes en bewaar." });
  };

  const ensureRestaurant = async (): Promise<string | null> => {
    if (restaurantId) return restaurantId;
    if (!newRestaurantName || !newRestaurantCity) {
      toast({ title: "Kies of maak een restaurant", variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ name: newRestaurantName, city: newRestaurantCity, verified: true })
      .select("id")
      .single();
    if (error) { toast({ title: "Restaurant create faalde", description: error.message, variant: "destructive" }); return null; }
    setRestaurantId(data.id);
    return data.id;
  };

  const ensureMenu = async (rId: string): Promise<string | null> => {
    if (menuId) return menuId;
    const name = newMenuName || "Hoofdmenu";
    const { data, error } = await supabase
      .from("curated_menus")
      .insert({ restaurant_id: rId, name, source_type: "manual", active: true })
      .select("id")
      .single();
    if (error) { toast({ title: "Menu create faalde", description: error.message, variant: "destructive" }); return null; }
    setMenuId(data.id);
    return data.id;
  };

  const saveDish = async (d: DraftDish) => {
    if (!d.name.trim()) {
      toast({ title: "Naam vereist", variant: "destructive" });
      return;
    }
    updateDraft(d.tempId, { isSaving: true });
    const rId = await ensureRestaurant();
    if (!rId) { updateDraft(d.tempId, { isSaving: false }); return; }
    const mId = await ensureMenu(rId);
    if (!mId) { updateDraft(d.tempId, { isSaving: false }); return; }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("curated_dishes").insert({
      menu_id: mId,
      name: d.name.trim(),
      description: d.description.trim() || null,
      price_eur: d.price_eur ? Number(d.price_eur) : null,
      category: d.category,
      ingredients: d.ingredients,
      allergens: d.allergens,
      dietary_tags: d.dietary_tags,
      verified: true,
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    });
    if (error) {
      updateDraft(d.tempId, { isSaving: false });
      toast({ title: "Opslaan faalde", description: error.message, variant: "destructive" });
      return;
    }
    updateDraft(d.tempId, { isSaving: false, isSaved: true });
  };

  const saveAll = async () => {
    for (const d of drafts) {
      if (d.isSaved) continue;
      await saveDish(d);
    }
    toast({ title: "Klaar", description: `${drafts.filter((d) => d.isSaved).length} gerechten in DB.` });
  };

  if (!authChecked) {
    return <div className="p-8 text-center"><Loader2 className="inline animate-spin" /> Toegang controleren…</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>

        <h1 className="text-3xl font-bold">Menu importeren (admin)</h1>
        <p className="text-muted-foreground">
          Upload PDF of foto van een menu. De parser herkent regels met prijs en maakt drafts.
          Verifieer per gerecht de allergenen, sla op.
        </p>

        {/* Restaurant + menu selectie */}
        <Card className="p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Bestaand restaurant</Label>
              <Select value={restaurantId} onValueChange={(v) => { setRestaurantId(v); setMenuId(""); }}>
                <SelectTrigger><SelectValue placeholder="Kies restaurant" /></SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} — {r.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bestaand menu</Label>
              <Select value={menuId} onValueChange={setMenuId} disabled={!restaurantId}>
                <SelectTrigger><SelectValue placeholder="Kies menu (of laat leeg)" /></SelectTrigger>
                <SelectContent>
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name || "(naamloos)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!restaurantId && (
            <div className="grid md:grid-cols-3 gap-2 pt-2 border-t">
              <Input placeholder="Nieuw restaurant naam" value={newRestaurantName} onChange={(e) => setNewRestaurantName(e.target.value)} />
              <Input placeholder="Stad" value={newRestaurantCity} onChange={(e) => setNewRestaurantCity(e.target.value)} />
              <Input placeholder="Menu naam (optie)" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} />
            </div>
          )}
        </Card>

        {/* Upload */}
        <Card className="p-4 space-y-4">
          <Label>Bron-bestand</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              disabled={extracting}
            />
            {extracting && <Loader2 className="animate-spin" />}
          </div>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Geëxtraheerde tekst verschijnt hier. Je kunt 'm editen vóór 'Detect dishes'."
            rows={8}
          />
          <div className="flex gap-2">
            <Button onClick={detectDishes} disabled={!rawText.trim()}>
              <Upload className="mr-2 h-4 w-4" /> Detect dishes
            </Button>
            <Button variant="outline" onClick={addEmpty}>
              <Plus className="mr-2 h-4 w-4" /> Leeg gerecht
            </Button>
            {drafts.length > 0 && (
              <Button variant="outline" onClick={autoSuggestAll}>
                <Wand2 className="mr-2 h-4 w-4" /> Auto-suggest allergenen
              </Button>
            )}
          </div>
        </Card>

        {/* Drafts */}
        {drafts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{drafts.length} drafts</h2>
              <Button onClick={saveAll}><Save className="mr-2 h-4 w-4" /> Verifieer & sla alles op</Button>
            </div>
            {drafts.map((d) => (
              <Card key={d.tempId} className={`p-4 space-y-3 ${d.isSaved ? "opacity-60" : ""}`}>
                <div className="grid md:grid-cols-12 gap-2">
                  <Input className="md:col-span-5" placeholder="Naam" value={d.name} onChange={(e) => updateDraft(d.tempId, { name: e.target.value })} />
                  <Input className="md:col-span-2" placeholder="Prijs €" value={d.price_eur} onChange={(e) => updateDraft(d.tempId, { price_eur: e.target.value })} />
                  <Select value={d.category} onValueChange={(v) => updateDraft(d.tempId, { category: v })}>
                    <SelectTrigger className="md:col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="md:col-span-2 flex gap-1">
                    <Button size="sm" onClick={() => saveDish(d)} disabled={d.isSaving || d.isSaved}>
                      {d.isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : d.isSaved ? "✓" : <Save className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeDraft(d.tempId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Beschrijving (gebruikt voor auto-suggest)"
                  value={d.description}
                  onChange={(e) => updateDraft(d.tempId, { description: e.target.value })}
                  rows={2}
                />
                <div>
                  <Label className="text-xs">Allergenen (EU 14)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 mt-1">
                    {ALLERGENS.map((a) => (
                      <label key={a} className="flex items-center gap-1 text-sm">
                        <Checkbox
                          checked={d.allergens.includes(a)}
                          onCheckedChange={(checked) => updateDraft(d.tempId, {
                            allergens: checked ? [...d.allergens, a] : d.allergens.filter((x) => x !== a),
                          })}
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Dieet-tags</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                    {DIETARY_TAGS.map((t) => (
                      <label key={t} className="flex items-center gap-1 text-sm">
                        <Checkbox
                          checked={d.dietary_tags.includes(t)}
                          onCheckedChange={(checked) => updateDraft(d.tempId, {
                            dietary_tags: checked ? [...d.dietary_tags, t] : d.dietary_tags.filter((x) => x !== t),
                          })}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
