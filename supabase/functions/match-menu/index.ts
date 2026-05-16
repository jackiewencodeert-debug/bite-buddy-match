// Zero-AI menu matcher.
// Input: pre-parsed dish list from client (after local OCR + rule-based parsing).
// Output: per-dish allergen verdict from curated DB (verified) or ingredient inference,
//         else 'unknown' so the UI can warn the user.
//
// No external API calls. No AI gateway. Only Postgres lookups.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NL_STOPWORDS = new Set([
  "met", "en", "van", "een", "het", "de", "op", "in", "aan", "door", "voor", "uit",
  "bij", "om", "tot", "of", "als", "dat", "die", "deze", "onze", "onder", "over",
  "naar", "tegen", "binnen", "buiten", "tussen", "achter", "tijdens",
  "the", "and", "with", "of", "or", "in", "on", "at", "to"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;:()€$£\d]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !NL_STOPWORDS.has(t));
}

function generateNgrams(tokens: string[], maxN = 3): string[] {
  const ngrams: string[] = [];
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(" "));
    }
  }
  return ngrams;
}

async function findDishMatch(supabase: any, text: string) {
  const { data, error } = await supabase.rpc("fuzzy_dish_match", {
    search_text: text,
    threshold: 0.4,
  });
  if (error) {
    console.error("fuzzy_dish_match error:", error);
    return null;
  }
  if (data && data.length > 0) {
    const best = data[0];
    return {
      source: "verified",
      dish_name: best.name,
      description: best.description,
      allergens: best.allergens || [],
      ingredients: best.ingredients || [],
      confidence: best.similarity_score >= 0.7 ? "high" : "medium",
      similarity: best.similarity_score,
    };
  }
  return null;
}

async function inferFromIngredients(supabase: any, text: string) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { source: "unknown" };

  const ngrams = generateNgrams(tokens, 3).slice(0, 50);
  // ilike escapes: strip % from user input; PostgREST .or() takes filter syntax
  const orConditions = ngrams
    .map((n) => `ingredient_name.ilike.%${n.replace(/%/g, "")}%`)
    .join(",");

  const { data: matches, error } = await supabase
    .from("ingredient_allergens")
    .select("ingredient_name, allergens")
    .or(orConditions)
    .limit(50);

  if (error || !matches || matches.length === 0) {
    return { source: "unknown" };
  }

  const allergenSet = new Set<string>();
  matches.forEach((m: any) =>
    (m.allergens || []).forEach((a: string) => allergenSet.add(a))
  );

  return {
    source: "ingredient_inferred",
    allergens: Array.from(allergenSet),
    matched_ingredients: matches.map((m: any) => m.ingredient_name),
    confidence: "medium",
  };
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dishes } = await req.json(); // [{ name, description?, raw_text? }]
    if (!Array.isArray(dishes)) {
      return new Response(
        JSON.stringify({ error: "dishes must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = [];
    for (const dish of dishes) {
      // Stage 1: dish-name match
      const queryName = dish.name || dish.raw_text || "";
      const dishMatch = queryName ? await findDishMatch(supabase, queryName) : null;
      if (dishMatch) {
        results.push({ ...dish, ...dishMatch });
        continue;
      }

      // Stage 2: ingredient inference from description (or fallback to name)
      const textToScan = dish.description || dish.raw_text || dish.name || "";
      const ingredientMatch = textToScan
        ? await inferFromIngredients(supabase, textToScan)
        : { source: "unknown" };
      results.push({ ...dish, ...ingredientMatch });
    }

    const summary = {
      total: results.length,
      verified: results.filter((r) => r.source === "verified").length,
      ingredient_inferred: results.filter((r) => r.source === "ingredient_inferred").length,
      unknown: results.filter((r) => r.source === "unknown").length,
    };

    return new Response(JSON.stringify({ results, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("match-menu error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
