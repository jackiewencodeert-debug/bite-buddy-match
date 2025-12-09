import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple PDF text extractor - extracts readable text from PDF content
function extractTextFromPDF(pdfBytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(pdfBytes);
  
  // Extract text between BT (begin text) and ET (end text) markers
  const textBlocks: string[] = [];
  const btPattern = /BT[\s\S]*?ET/g;
  const matches = content.match(btPattern) || [];
  
  for (const block of matches) {
    // Extract text from Tj and TJ operators
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    let match;
    while ((match = tjPattern.exec(block)) !== null) {
      textBlocks.push(match[1]);
    }
    
    // Also try to extract from TJ arrays
    const tjArrayPattern = /\[([^\]]*)\]\s*TJ/g;
    while ((match = tjArrayPattern.exec(block)) !== null) {
      const arrayContent = match[1];
      const stringPattern = /\(([^)]*)\)/g;
      let stringMatch;
      while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
        textBlocks.push(stringMatch[1]);
      }
    }
  }
  
  // Also try to find stream content with readable text
  const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
  let streamMatch;
  while ((streamMatch = streamPattern.exec(content)) !== null) {
    const streamContent = streamMatch[1];
    // Look for readable strings in streams
    const readablePattern = /[A-Za-z0-9\s,.€$£¥\-:;()]{10,}/g;
    const readable = streamContent.match(readablePattern) || [];
    textBlocks.push(...readable.filter(r => r.trim().length > 0));
  }
  
  return textBlocks.join('\n').replace(/\\n/g, '\n').replace(/\\r/g, '');
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

    const systemPromptImage = `You are a menu analysis assistant. Analyze menu images and extract dish information in a structured format. Return only valid JSON.

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

    const systemPromptPDF = `You are a menu analysis assistant. Analyze menu text extracted from a PDF and extract dish information in a structured format. Return only valid JSON.

Analyze this text from a restaurant menu PDF. Extract ALL dishes with the following information for each dish:
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

If the text doesn't appear to be from a menu, return {"isMenu": false, "dishes": []}`;

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

      let response;
      
      if (itemType === 'pdf') {
        // Extract text from PDF
        const base64Data = itemData.replace(/^data:application\/pdf;base64,/, '');
        const pdfBytes = base64Decode(base64Data);
        const pdfText = extractTextFromPDF(pdfBytes);
        
        console.log("Extracted PDF text length:", pdfText.length);
        
        if (pdfText.length < 50) {
          console.log("PDF text too short, skipping");
          continue;
        }

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
                content: systemPromptPDF
              },
              {
                role: "user",
                content: `Here is the menu text extracted from a PDF:\n\n${pdfText.substring(0, 15000)}`
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
                content: systemPromptImage
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
