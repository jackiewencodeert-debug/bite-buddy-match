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
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }, timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 28000; // hard cap < 30s (incl. processing + response)

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
      learnedPatterns = await Promise.race([patternsPromise, createTimeout(2000)]);
    } catch (_e) {
      console.log("Skipping patterns due to timeout or error");
    }

    const patternsHint = learnedPatterns.size > 0
      ? `\n\nExtra learned allergen patterns to consider:\n${Array.from(learnedPatterns.entries()).map(([ingredient, allergens]) => `- "${ingredient}" often contains: ${allergens.join(", ")}`).join("\n")}`
      : "";

    const allLanguages = {
      nl: "Dutch",
      en: "English",
      fr: "French",
      es: "Spanish",
      de: "German",
      it: "Italian",
      hu: "Hungarian",
      id: "Indonesian",
      tr: "Turkish",
      vi: "Vietnamese",
      th: "Thai",
      uk: "Ukrainian",
      pt: "Portuguese",
      ru: "Russian",
      hi: "Hindi",
      pl: "Polish",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
    };

    const langKeys = Object.keys(allLanguages);

    const systemPrompt = `You are an expert restaurant menu extraction assistant. Return ONLY valid JSON (no markdown).

Hard requirements:
- SPEED: you MUST respond quickly; keep output concise.
- Infer ingredients from dish name + description (culinary knowledge). Never leave ingredients empty for recognizable dishes.
- Infer allergens from ingredients. Bread/pasta/noodles/flour/wheat/tarwe/meel/spelt/rogge/gerst => gluten.
- If something is explicitly gluten-free / lactose-free, do NOT add that allergen.

Translations (CRITICAL):
- Provide name_translations for ALL ${langKeys.length} languages: ${langKeys.join(", ")}.
- Provide translations dictionaries for ingredients, allergens, and dietary_info for ALL ${langKeys.length} languages.
- Do NOT repeat translation objects inside each dish; dishes must contain plain string arrays.
- Only include unique terms that actually appear in dishes.

Limits:
- Extract at most 25 dishes.
- Ingredients: max 120 unique terms across the whole response.
- Allergens: max 30 unique terms across the whole response.
- Dietary info: max 30 unique terms across the whole response.

Return JSON exactly in this shape:
{
  "isMenu": true|false,
  "dishes": [{
    "name": string,
    "name_translations": { ${langKeys.map((k) => `"${k}": string`).join(", ")} },
    "ingredients": string[],
    "allergens": string[],
    "dietary_info": string[],
    "price": string|null,
    "description": string|null,
    "category": string|null
  }],
  "translations": {
    "ingredients": { "<original>": { ${langKeys.map((k) => `"${k}": string`).join(", ")} } },
    "allergens": { "<original>": { ${langKeys.map((k) => `"${k}": string`).join(", ")} } },
    "dietary_info": { "<original>": { ${langKeys.map((k) => `"${k}": string`).join(", ")} } }
  } | null,
  "template": { "categories": string[], "style": { "primaryColor": string, "secondaryColor": string, "fontStyle": string } } | null
}

${patternsHint}`;

    // Process files (images and PDFs)
    let allDishes: any[] = [];
    let allCategories: string[] = [];
    let templateStyle: any = null;
    let foundMenu = false;

    // Only process the first item to stay within the 30s cap
    const itemsToProcess = images.slice(0, 1);

    for (const item of itemsToProcess) {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME - 4000) {
        console.log("Running low on time, stopping processing");
        break;
      }

      // Parse the item - could be JSON string with type info or legacy dataURL
      let itemData: string;
      let itemType: string;

      try {
        const parsed = JSON.parse(item);
        itemData = parsed.data;
        itemType = parsed.type;
      } catch {
        itemData = item;
        itemType = "image";
      }

      // Backward compatible auto-detect (MenuEditor used to send PDFs without type)
      if (typeof itemData === "string" && itemData.startsWith("data:application/pdf")) {
        itemType = "pdf";
      }

      console.log("Processing item type:", itemType);
      console.log("Payload bytes (approx):", typeof itemData === "string" ? itemData.length : 0);

      // Calculate remaining time for this request (leave 1.5s buffer for response)
      const remainingTime = MAX_EXECUTION_TIME - (Date.now() - startTime) - 1500;
      const aiTimeout = Math.min(remainingTime, 24000);
      console.log("AI timeout ms:", aiTimeout, "remaining ms:", remainingTime);

      if (aiTimeout < 6000) {
        console.log("Not enough time remaining for AI call");
        break;
      }

      let response: Response;

      try {
        // NOTE: We always send as image_url with a data URL; PDFs are passed as data:application/pdf;base64,...
        response = await fetchWithTimeout(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: itemType === "pdf"
                        ? "Analyze this menu PDF and extract dishes + ingredients + allergens + prices + categories + translations."
                        : "Analyze this menu image and extract dishes + ingredients + allergens + prices + categories + translations.",
                    },
                    {
                      type: "image_url",
                      image_url: { url: itemData },
                    },
                  ],
                },
              ],
            }),
          },
          aiTimeout,
        );
      } catch (error: any) {
        if (error.name === "AbortError" || error.message?.includes("timeout")) {
          console.error("AI request timed out after", aiTimeout, "ms");
          return new Response(
            JSON.stringify({ error: "Menu analyse duurde te lang (timeout). Probeer met een duidelijkere foto of een kleiner PDF-bestand." }),
            { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      console.log(
        "AI response received, content length:",
        content?.length || 0,
        "elapsed:",
        Date.now() - startTime,
        "ms",
      );

      if (!content) {
        console.log("No content in AI response");
        continue;
      }

      // Parse the JSON response - handle accidental markdown code blocks
      let parsedContent;
      try {
        let jsonContent = content.trim();
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

        if (parsedContent.template?.categories) {
          allCategories = [...new Set([...allCategories, ...parsedContent.template.categories])];
        }

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
