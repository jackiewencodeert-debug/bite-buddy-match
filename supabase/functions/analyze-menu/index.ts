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

    const systemPrompt = `You are a menu analysis assistant. Analyze menu images/documents and extract dish information in a structured format. Return only valid JSON.

Analyze ${isMultiple ? 'these images/documents of different menu pages' : 'this image/document'} and determine if ${isMultiple ? 'they are' : 'it is'} restaurant menu(s). If yes, extract ALL dishes with the following information for each dish:
- name: dish name (required)
- ingredients: array of ingredients mentioned or that can be inferred from the dish description (in Dutch if possible)
- allergens: array of allergens found or inferred (common ones: noten, gluten, lactose, schaaldieren, vis, eieren, soja, sulfiet, selderij, mosterd, sesam, weekdieren, lupine)
- dietary_info: array of dietary tags if indicated (vegetarisch, veganistisch, halal, kosher) - look for v., vgn., or similar indicators
- price: price if visible (include € symbol)
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

    // Process files (images and PDFs)
    let allDishes: any[] = [];
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
                    text: "Please analyze this menu PDF document and extract all dishes with their ingredients, allergens, prices, and dietary information."
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
      }
    }

    // Remove duplicate dishes based on name
    const uniqueDishes = allDishes.filter((dish, index, self) =>
      index === self.findIndex((d) => d.name.toLowerCase() === dish.name.toLowerCase())
    );

    console.log("Final result: isMenu =", foundMenu, ", dishes =", uniqueDishes.length);

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
