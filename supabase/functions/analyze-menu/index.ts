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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, isMultiple } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    // Fetch learned patterns for enhanced allergen detection
    const learnedPatterns = await getLearnedPatterns();
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

const systemPrompt = `You are a menu analysis assistant. Analyze menu images/documents and extract dish information in a structured format. Return only valid JSON.

Analyze ${isMultiple ? 'these images/documents of different menu pages' : 'this image/document'} and determine if ${isMultiple ? 'they are' : 'it is'} restaurant menu(s). If yes, extract ALL dishes with the following information for each dish:
- name: dish name EXACTLY as it appears on the menu (required)
- name_translations: REQUIRED object with translations of the dish name in ALL 20 languages: { ${langList} }
- ingredients: array of ingredient objects, each with translations in ALL 20 languages: [{ "original": "kip", "nl": "Kip", "en": "Chicken", "fr": "Poulet", "es": "Pollo", "de": "Hähnchen", "it": "Pollo", "hu": "Csirke", "id": "Ayam", "tr": "Tavuk", "vi": "Gà", "th": "ไก่", "uk": "Курка", "pt": "Frango", "ru": "Курица", "hi": "मुर्गी", "pl": "Kurczak", "zh": "鸡肉", "ja": "鶏肉", "ko": "닭고기", "ar": "دجاج" }]
- allergens: array of allergen objects, each with translations in ALL 20 languages (same format as ingredients)
- dietary_info: array of dietary info objects, each with translations in ALL 20 languages (same format as ingredients)
- price: price if visible (include € symbol)
- description: brief description if available
- category: the section/category this dish belongs to (e.g., "Voorgerechten", "Hoofdgerechten", "Desserts", "Soepen", "Salades", "Drankjes", etc.)

IMPORTANT: ALL translation objects MUST include translations in ALL 20 languages: nl, en, fr, es, de, it, hu, id, tr, vi, th, uk, pt, ru, hi, pl, zh, ja, ko, ar.

Common allergens to detect (with their standard translations):
- noten/nuts, gluten, lactose, schaaldieren/shellfish, vis/fish, eieren/eggs, soja/soy, sulfiet/sulfite, selderij/celery, mosterd/mustard, sesam/sesame, weekdieren/mollusks, lupine

Common dietary preferences to detect:
- vegetarisch/vegetarian, veganistisch/vegan, halal, kosher

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
      "name": "Kippensoep",
      "name_translations": { "nl": "Kippensoep", "en": "Chicken soup", "fr": "Soupe au poulet", "es": "Sopa de pollo", "de": "Hühnersuppe", "it": "Zuppa di pollo", "hu": "Csirkeleves", "id": "Sup ayam", "tr": "Tavuk çorbası", "vi": "Súp gà", "th": "ซุปไก่", "uk": "Курячий суп", "pt": "Sopa de frango", "ru": "Куриный суп", "hi": "चिकन सूप", "pl": "Zupa z kurczaka", "zh": "鸡汤", "ja": "チキンスープ", "ko": "치킨 수프", "ar": "حساء الدجاج" },
      "ingredients": [
        { "original": "kip", "nl": "Kip", "en": "Chicken", "fr": "Poulet", "es": "Pollo", "de": "Hähnchen", "it": "Pollo", "hu": "Csirke", "id": "Ayam", "tr": "Tavuk", "vi": "Gà", "th": "ไก่", "uk": "Курка", "pt": "Frango", "ru": "Курица", "hi": "मुर्गी", "pl": "Kurczak", "zh": "鸡肉", "ja": "鶏肉", "ko": "닭고기", "ar": "دجاج" }
      ],
      "allergens": [],
      "dietary_info": [],
      "price": "€7,50",
      "description": "Huisgemaakte kippensoep met verse groenten",
      "category": "Voorgerechten"
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

    for (const item of images) {
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

      // For PDFs, we send them as documents to the vision model
      // Gemini can process PDF documents directly
      let response;
      
      if (itemType === 'pdf') {
        // Send PDF as inline document to Gemini
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        });
      } else {
        // Process as image
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        });
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

      console.log("AI response received, content length:", content?.length || 0);

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

    console.log("Final result: isMenu =", foundMenu, ", dishes =", uniqueDishes.length, ", categories =", allCategories.length);

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
