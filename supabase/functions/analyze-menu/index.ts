import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const systemPrompt = `You are a menu analysis assistant. Analyze menu images and extract dish information in a structured format. Return only valid JSON.

Analyze ${isMultiple ? 'these images of different menu pages' : 'this image'} and determine if ${isMultiple ? 'they are' : 'it is'} restaurant menu(s). If yes, extract ALL dishes with the following information for each dish:
- name: dish name
- ingredients: array of ingredients (in Dutch if possible)
- allergens: array of allergens found (noten, gluten, lactose, schaaldieren, vis, eieren, soja, sulfiet)
- dietary_info: array of dietary tags (vegetarisch, veganistisch, halal, kosher)
- price: price if visible
- description: brief description if available

Return in this exact JSON format:
{
  "isMenu": true/false,
  "dishes": [
    {
      "name": "string",
      "ingredients": ["string"],
      "allergens": ["string"],
      "dietary_info": ["string"],
      "price": "string",
      "description": "string"
    }
  ]
}

${isMultiple ? 'Combine all dishes from all menu pages into one array. Do not duplicate dishes.' : ''}
If ${isMultiple ? 'none of the images are menus' : 'it\'s not a menu'}, return {"isMenu": false, "dishes": []}`;

    // Process images
    let allDishes: any[] = [];
    let foundMenu = false;

    for (const imageBase64 of images) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    url: imageBase64
                  }
                }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
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

      if (!content) {
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
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        continue;
      }

      if (parsedContent.isMenu) {
        foundMenu = true;
        allDishes = allDishes.concat(parsedContent.dishes || []);
      }
    }

    // Remove duplicate dishes based on name
    const uniqueDishes = allDishes.filter((dish, index, self) =>
      index === self.findIndex((d) => d.name.toLowerCase() === dish.name.toLowerCase())
    );

    return new Response(
      JSON.stringify({
        isMenu: foundMenu,
        dishes: uniqueDishes
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
