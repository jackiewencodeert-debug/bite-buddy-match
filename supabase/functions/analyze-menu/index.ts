import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch learned allergen patterns from database
async function getLearnedPatterns(): Promise<Map<string, string[]>> {
  const patterns = new Map<string, string[]>();
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.log("Supabase credentials not available, using default patterns");
      return patterns;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("allergen_patterns")
      .select("ingredient_pattern, allergen, confidence_score")
      .gte("confidence_score", 0.6)
      .order("confidence_score", { ascending: false });
    
    if (error) {
      console.error("Error fetching patterns:", error);
      return patterns;
    }
    
    if (data) {
      data.forEach((row: any) => {
        const existing = patterns.get(row.ingredient_pattern) || [];
        existing.push(row.allergen);
        patterns.set(row.ingredient_pattern, existing);
      });
    }
    
    console.log("Loaded", patterns.size, "learned allergen patterns");
  } catch (e) {
    console.error("Error loading patterns:", e);
  }
  
  return patterns;
}

// Helper function to create a timeout promise
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 25000; // 25 seconds max

  try {
    const { images, isMultiple } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    // Fetch learned patterns for enhanced allergen detection (with timeout)
    let learnedPatterns = new Map<string, string[]>();
    try {
      const patternsPromise = getLearnedPatterns();
      learnedPatterns = await Promise.race([patternsPromise, createTimeout(3000)]);
    } catch (e) {
      console.log("Skipping patterns due to timeout or error");
    }
    
    const patternsHint = learnedPatterns.size > 0 
      ? `\n\nAdditional learned allergen patterns to consider:\n${Array.from(learnedPatterns.entries()).map(([ingredient, allergens]) => `- "${ingredient}" often contains: ${allergens.join(", ")}`).join("\n")}`
      : "";

const allLanguages = {
  nl: "Dutch", en: "English", fr: "French", es: "Spanish", de: "German",
  it: "Italian", hu: "Hungarian", id: "Indonesian", tr: "Turkish", vi: "Vietnamese",
  th: "Thai", uk: "Ukrainian", pt: "Portuguese", ru: "Russian", hi: "Hindi",
  pl: "Polish", zh: "Chinese", ja: "Japanese", ko: "Korean", ar: "Arabic"
};

const langKeys = Object.keys(allLanguages);
const langList = langKeys.map(k => `"${k}": "${allLanguages[k as keyof typeof allLanguages]} translation"`).join(", ");

const systemPrompt = `You are an expert menu analysis assistant specializing in food ingredient identification and allergen detection. Analyze menu images/documents and extract dish information in a structured format. Return only valid JSON.

CRITICAL INSTRUCTIONS FOR INGREDIENT AND ALLERGEN DETECTION:

1. ALWAYS INFER INGREDIENTS from the dish name and description, even if not explicitly listed:
   - "Zuurdesembrood" (Sourdough bread) → MUST include ingredients: ["zuurdesem", "tarwemeel", "water", "zout"] and allergen: ["gluten"]
   - "Pasta carbonara" → MUST include: ["pasta", "ei", "spek", "parmezaanse kaas", "peper"] and allergens: ["gluten", "eieren", "lactose"]
   - "Kippensoep" → MUST include: ["kip", "bouillon", "wortel", "selderij", "ui"]
   - "Caesar salade" → MUST include: ["romaine sla", "parmezaanse kaas", "croutons", "caesar dressing", "ansjovis"] and allergens: ["gluten", "lactose", "vis"]
   - "Biefstuk" → MUST include: ["rundvlees", "kruiden"]
   - "Pizza margherita" → MUST include: ["pizzadeeg", "tomatensaus", "mozzarella", "basilicum"] and allergens: ["gluten", "lactose"]

2. BREAD AND BAKERY PRODUCTS - These ALWAYS contain gluten unless explicitly labeled gluten-free:
   - Any bread (brood, zuurdesembrood, focaccia, ciabatta, baguette, toast, etc.) → gluten
   - Croissants, broodjes, bolletjes → gluten, lactose
   - Cake, taart, gebak → gluten, often also eieren, lactose

3. COMMON ALLERGEN MAPPINGS - Apply these automatically:
   - Anything with flour/wheat/tarwe/meel/rogge/gerst/spelt → gluten
   - Anything with milk/cheese/cream/boter/zuivel → lactose
   - Anything with egg/ei/mayonaise/aioli → eieren
   - Anything with soy sauce/sojasaus/tofu/tempeh → soja
   - Any bread, pasta, couscous, bulgur, noodles → gluten
   - Wine/wijn, dried fruits/gedroogd fruit → sulfiet

4. EVEN IF THE MENU SHOWS NO INGREDIENTS, you MUST:
   - Infer typical ingredients based on dish name and culinary knowledge
   - Add appropriate allergens based on inferred ingredients
   - Never leave ingredients array empty for recognizable dishes

Analyze ${isMultiple ? 'these images/documents of different menu pages' : 'this image/document'} and determine if ${isMultiple ? 'they are' : 'it is'} restaurant menu(s). If yes, extract ALL dishes with the following information for each dish:
- name: dish name EXACTLY as it appears on the menu (required)
- name_translations: REQUIRED object with translations of the dish name in ALL 20 languages: { ${langList} }
- ingredients: array of ingredient objects, each with translations in ALL 20 languages: [{ "original": "kip", "nl": "Kip", "en": "Chicken", "fr": "Poulet", "es": "Pollo", "de": "Hähnchen", "it": "Pollo", "hu": "Csirke", "id": "Ayam", "tr": "Tavuk", "vi": "Gà", "th": "ไก่", "uk": "Курка", "pt": "Frango", "ru": "Курица", "hi": "मुर्गी", "pl": "Kurczak", "zh": "鸡肉", "ja": "鶏肉", "ko": "닭고기", "ar": "دجاج" }]
  IMPORTANT: Always infer and include typical ingredients based on dish name/description!
- allergens: array of allergen objects, each with translations in ALL 20 languages (same format as ingredients)
  IMPORTANT: Always detect allergens based on inferred ingredients! Common allergens: noten, gluten, lactose, schaaldieren, vis, eieren, soja, sulfiet, pinda's, sesam, selderij, mosterd, weekdieren, lupine
- dietary_info: array of dietary info objects, each with translations in ALL 20 languages (same format as ingredients)
- price: price if visible (include € symbol)
- description: brief description if available
- category: the section/category this dish belongs to (e.g., "Voorgerechten", "Hoofdgerechten", "Desserts", "Soepen", "Salades", "Drankjes", etc.)

IMPORTANT: ALL translation objects MUST include translations in ALL 20 languages: nl, en, fr, es, de, it, hu, id, tr, vi, th, uk, pt, ru, hi, pl, zh, ja, ko, ar.

Also extract menu template information:
- categories: array of all menu section names/categories found on the menu in order
- style: object with visual styling hints:
  - primaryColor: dominant color of the menu (hex format like #FF5500)
  - secondaryColor: secondary/accent color (hex format)
  - fontStyle: general font style description (e.g., "elegant", "modern", "rustic", "casual")

Return in this exact JSON format (ALL 20 language translations are REQUIRED):
{
  "isMenu": true/false,
  "dishes": [
    {
      "name": "Zuurdesembrood",
      "name_translations": { "nl": "Zuurdesembrood", "en": "Sourdough bread", "fr": "Pain au levain", "es": "Pan de masa madre", "de": "Sauerteigbrot", "it": "Pane a lievitazione naturale", "hu": "Kovászos kenyér", "id": "Roti sourdough", "tr": "Ekşi mayalı ekmek", "vi": "Bánh mì men chua", "th": "ขนมปังซาวร์โดว์", "uk": "Хліб на заквасці", "pt": "Pão de fermentação natural", "ru": "Хлеб на закваске", "hi": "खट्टी खमीर की रोटी", "pl": "Chleb na zakwasie", "zh": "酸面包", "ja": "サワードウブレッド", "ko": "사워도우 빵", "ar": "خبز العجين المخمر" },
      "ingredients": [
        { "original": "zuurdesem", "nl": "Zuurdesem", "en": "Sourdough starter", "fr": "Levain", "es": "Masa madre", "de": "Sauerteig", "it": "Lievito madre", "hu": "Kovász", "id": "Starter sourdough", "tr": "Ekşi maya", "vi": "Men chua", "th": "แป้งเปรี้ยว", "uk": "Закваска", "pt": "Fermento natural", "ru": "Закваска", "hi": "खट्टी खमीर", "pl": "Zakwas", "zh": "酸面种", "ja": "サワードウスターター", "ko": "사워도우 스타터", "ar": "خميرة العجين المخمر" },
        { "original": "tarwemeel", "nl": "Tarwemeel", "en": "Wheat flour", "fr": "Farine de blé", "es": "Harina de trigo", "de": "Weizenmehl", "it": "Farina di grano", "hu": "Búzaliszt", "id": "Tepung terigu", "tr": "Buğday unu", "vi": "Bột mì", "th": "แป้งสาลี", "uk": "Пшеничне борошно", "pt": "Farinha de trigo", "ru": "Пшеничная мука", "hi": "गेहूं का आटा", "pl": "Mąka pszenna", "zh": "小麦面粉", "ja": "小麦粉", "ko": "밀가루", "ar": "دقيق القمح" }
      ],
      "allergens": [
        { "original": "gluten", "nl": "Gluten", "en": "Gluten", "fr": "Gluten", "es": "Gluten", "de": "Gluten", "it": "Glutine", "hu": "Glutén", "id": "Gluten", "tr": "Gluten", "vi": "Gluten", "th": "กลูเตน", "uk": "Глютен", "pt": "Glúten", "ru": "Глютен", "hi": "ग्लूटेन", "pl": "Gluten", "zh": "麸质", "ja": "グルテン", "ko": "글루텐", "ar": "الغلوتين" }
      ],
      "dietary_info": [],
      "price": "€4,50",
      "description": "Huisgebakken zuurdesembrood",
      "category": "Broodjes"
    }
  ],
  "template": {
    "categories": ["Voorgerechten", "Hoofdgerechten"],
    "style": {
      "primaryColor": "#2D3748",
      "secondaryColor": "#718096",
      "fontStyle": "elegant"
    }
  }
}

${isMultiple ? 'Combine all dishes from all menu pages into one array. Do not duplicate dishes. Merge categories from all pages.' : ''}
If ${isMultiple ? 'none of the images are menus' : 'it\'s not a menu'}, return {"isMenu": false, "dishes": [], "template": null}${patternsHint}`;

    // Process files (images and PDFs)
    let allDishes: any[] = [];
    let allCategories: string[] = [];
    let templateStyle: any = null;
    let foundMenu = false;

    // Only process the first image/PDF to stay within time limit
    // For multiple files, we'll process only what we can in the time limit
    const itemsToProcess = images.slice(0, 1); // Process only first item for speed

    for (const item of itemsToProcess) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME - 5000) {
        console.log("Running low on time, stopping processing");
        break;
      }

      // Parse the item - could be JSON string with type info or legacy base64 image
      let itemData: string;
      let itemType: string;
      
      try {
        const parsed = JSON.parse(item);
        itemData = parsed.data;
        itemType = parsed.type;
      } catch {
        // Legacy format - assume it's an image base64
        itemData = item;
        itemType = 'image';
      }

      console.log("Processing item type:", itemType);

      // Calculate remaining time for this request (leave 2s buffer for response)
      const remainingTime = MAX_EXECUTION_TIME - (Date.now() - startTime) - 2000;
      const aiTimeout = Math.min(remainingTime, 20000); // Max 20 seconds for AI call

      if (aiTimeout < 5000) {
        console.log("Not enough time remaining for AI call");
        break;
      }

      // For PDFs, we send them as documents to the vision model
      // Gemini can process PDF documents directly
      let response;
      
      try {
        if (itemType === 'pdf') {
          // Send PDF as inline document to Gemini
          response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Please analyze this menu PDF document and extract all dishes with their ingredients, allergens, prices, dietary information, and categories. Also extract the menu template styling."
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: itemData
                      }
                    }
                  ]
                }
              ]
            }),
          }, aiTimeout);
        } else {
          // Process as image
          response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: {
                        url: itemData
                      }
                    }
                  ]
                }
              ]
            }),
          }, aiTimeout);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          console.error("AI request timed out after", aiTimeout, "ms");
          return new Response(
            JSON.stringify({ error: "Menu analysis timed out. Please try with a smaller image or PDF." }),
            { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      console.log("AI response received, content length:", content?.length || 0, "elapsed:", Date.now() - startTime, "ms");

      if (!content) {
        console.log("No content in AI response");
        continue;
      }

      // Parse the JSON response - handle markdown code blocks
      let parsedContent;
      try {
        let jsonContent = content.trim();
        // Remove markdown code blocks if present
        if (jsonContent.startsWith("```json")) {
          jsonContent = jsonContent.replace(/^```json\s*/, "").replace(/\s*```\s*$/, "");
        } else if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
        }
        parsedContent = JSON.parse(jsonContent);
        console.log("Parsed dishes count:", parsedContent.dishes?.length || 0);
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        continue;
      }

      if (parsedContent.isMenu) {
        foundMenu = true;
        allDishes = allDishes.concat(parsedContent.dishes || []);
        
        // Collect categories
        if (parsedContent.template?.categories) {
          allCategories = [...new Set([...allCategories, ...parsedContent.template.categories])];
        }
        
        // Use first valid template style found
        if (!templateStyle && parsedContent.template?.style) {
          templateStyle = parsedContent.template.style;
        }
      }
    }

    // Remove duplicate dishes based on name
    const uniqueDishes = allDishes.filter((dish, index, self) =>
      index === self.findIndex((d) => d.name.toLowerCase() === dish.name.toLowerCase())
    );

    const totalElapsed = Date.now() - startTime;
    console.log("Final result: isMenu =", foundMenu, ", dishes =", uniqueDishes.length, ", categories =", allCategories.length, ", totalTime =", totalElapsed, "ms");

    return new Response(
      JSON.stringify({
        isMenu: foundMenu,
        dishes: uniqueDishes,
        template: foundMenu ? {
          categories: allCategories,
          style: templateStyle
        } : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in analyze-menu function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
