import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AllergenFeedback {
  id: string;
  ingredients: string[] | null;
  missed_allergens: string[];
  confirmed_allergens: string[];
  false_positives: string[];
}

interface AllergenPattern {
  id: string;
  ingredient_pattern: string;
  allergen: string;
  confidence_score: number;
  feedback_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting batch feedback processing...");

    // Get unprocessed feedback (limit to 500 per batch for performance)
    const { data: feedbackList, error: fetchError } = await supabase
      .from("allergen_feedback")
      .select("id, ingredients, missed_allergens, confirmed_allergens, false_positives")
      .eq("is_processed", false)
      .limit(500);

    if (fetchError) {
      console.error("Error fetching feedback:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch feedback", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!feedbackList || feedbackList.length === 0) {
      console.log("No unprocessed feedback found");
      return new Response(
        JSON.stringify({ message: "No feedback to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${feedbackList.length} feedback items...`);

    // Collect all pattern updates in memory first
    const patternUpdates: Map<string, { allergen: string; change: number }> = new Map();
    const processedIds: string[] = [];

    for (const feedback of feedbackList as AllergenFeedback[]) {
      const ingredients = feedback.ingredients || [];
      
      // Process missed allergens - should be added
      for (const missedAllergen of feedback.missed_allergens || []) {
        for (const ingredient of ingredients) {
          const key = `${ingredient.toLowerCase().trim()}|${missedAllergen}`;
          const existing = patternUpdates.get(key);
          patternUpdates.set(key, {
            allergen: missedAllergen,
            change: (existing?.change || 0) + 0.1
          });
        }
      }
      
      // Process confirmed allergens - boost confidence
      for (const confirmedAllergen of feedback.confirmed_allergens || []) {
        for (const ingredient of ingredients) {
          const key = `${ingredient.toLowerCase().trim()}|${confirmedAllergen}`;
          const existing = patternUpdates.get(key);
          patternUpdates.set(key, {
            allergen: confirmedAllergen,
            change: (existing?.change || 0) + 0.05
          });
        }
      }
      
      // Process false positives - reduce confidence
      for (const falsePositive of feedback.false_positives || []) {
        for (const ingredient of ingredients) {
          const key = `${ingredient.toLowerCase().trim()}|${falsePositive}`;
          const existing = patternUpdates.get(key);
          patternUpdates.set(key, {
            allergen: falsePositive,
            change: (existing?.change || 0) - 0.1
          });
        }
      }
      
      processedIds.push(feedback.id);
    }

    console.log(`Aggregated ${patternUpdates.size} pattern updates`);

    // Apply pattern updates
    let updatedCount = 0;
    let createdCount = 0;

    for (const [key, update] of patternUpdates) {
      const [ingredientPattern, allergen] = key.split("|");
      
      // Check if pattern exists
      const { data: existing } = await supabase
        .from("allergen_patterns")
        .select("id, confidence_score, feedback_count")
        .eq("ingredient_pattern", ingredientPattern)
        .eq("allergen", allergen)
        .maybeSingle();

      if (existing) {
        // Update existing pattern
        const newConfidence = Math.max(0, Math.min(1, existing.confidence_score + update.change));
        
        await supabase
          .from("allergen_patterns")
          .update({
            confidence_score: newConfidence,
            feedback_count: existing.feedback_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        
        updatedCount++;
      } else if (update.change > 0) {
        // Only create new patterns for positive feedback
        await supabase
          .from("allergen_patterns")
          .insert({
            ingredient_pattern: ingredientPattern,
            allergen: update.allergen,
            confidence_score: Math.min(1, 0.5 + update.change),
            feedback_count: 1
          });
        
        createdCount++;
      }
    }

    // Mark feedback as processed in batch
    if (processedIds.length > 0) {
      const { error: updateError } = await supabase
        .from("allergen_feedback")
        .update({ is_processed: true })
        .in("id", processedIds);

      if (updateError) {
        console.error("Error marking feedback as processed:", updateError);
      }
    }

    const result = {
      message: "Batch processing complete",
      processed: processedIds.length,
      patternsUpdated: updatedCount,
      patternsCreated: createdCount,
      timestamp: new Date().toISOString()
    };

    console.log("Batch processing result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Batch processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});