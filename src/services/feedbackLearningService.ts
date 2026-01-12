import { supabase } from "@/integrations/supabase/client";
import { getCachedPatterns, setCachedPatterns } from "./indexedDBCache";

export interface LearnedPattern {
  ingredient_pattern: string;
  allergen: string;
  confidence_score: number;
  feedback_count: number;
}

// In-memory cache for current session
let patternsCache: LearnedPattern[] = [];
let lastCacheUpdate = 0;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in-memory

/**
 * Load learned allergen patterns with IndexedDB + memory caching
 * Priority: Memory cache -> IndexedDB -> Database
 */
export async function loadLearnedPatterns(): Promise<LearnedPattern[]> {
  const now = Date.now();
  
  // 1. Return memory cache if still valid
  if (patternsCache.length > 0 && now - lastCacheUpdate < MEMORY_CACHE_TTL) {
    return patternsCache;
  }

  // 2. Try IndexedDB cache (persists across sessions, 1 hour TTL)
  try {
    const cachedData = await getCachedPatterns<LearnedPattern[]>();
    if (cachedData && cachedData.length > 0) {
      patternsCache = cachedData;
      lastCacheUpdate = now;
      console.log(`Loaded ${patternsCache.length} patterns from IndexedDB cache`);
      return patternsCache;
    }
  } catch (error) {
    console.debug("IndexedDB cache miss:", error);
  }

  // 3. Fetch from database using secure function
  try {
    const { data, error } = await supabase
      .rpc("get_allergen_patterns");

    if (error) {
      console.error("Error loading learned patterns:", error);
      return patternsCache;
    }

    // Map the result to include feedback_count (default to 0 since function doesn't expose it)
    patternsCache = (data || []).map((p: any) => ({
      ingredient_pattern: p.ingredient_pattern,
      allergen: p.allergen,
      confidence_score: p.confidence_score,
      feedback_count: 0
    }));
    lastCacheUpdate = now;
    
    // Save to IndexedDB for future sessions
    await setCachedPatterns(patternsCache);
    
    console.log(`Loaded ${patternsCache.length} patterns from database, cached to IndexedDB`);
    return patternsCache;
  } catch (error) {
    console.error("Error loading learned patterns:", error);
    return patternsCache;
  }
}

/**
 * Find learned allergens for an ingredient
 */
export function findLearnedAllergens(ingredient: string, patterns: LearnedPattern[]): string[] {
  const normalized = ingredient.toLowerCase().trim();
  const allergens: string[] = [];
  
  for (const pattern of patterns) {
    // Direct match
    if (pattern.ingredient_pattern === normalized) {
      allergens.push(pattern.allergen);
      continue;
    }
    
    // Partial match (ingredient contains pattern or pattern contains ingredient)
    if (normalized.includes(pattern.ingredient_pattern) || 
        pattern.ingredient_pattern.includes(normalized)) {
      // Only add if confidence is high enough for partial matches
      if (pattern.confidence_score >= 0.7) {
        allergens.push(pattern.allergen);
      }
    }
  }
  
  return [...new Set(allergens)]; // Remove duplicates
}

/**
 * Process unprocessed feedback and update allergen patterns
 * This can be called periodically or after new feedback is submitted
 */
export async function processFeedbackAndLearn(): Promise<number> {
  try {
    // Get unprocessed feedback
    const { data: feedbackList, error: fetchError } = await supabase
      .from("allergen_feedback")
      .select("*")
      .eq("is_processed", false)
      .limit(100);

    if (fetchError || !feedbackList || feedbackList.length === 0) {
      return 0;
    }

    console.log(`Processing ${feedbackList.length} feedback items`);
    
    let patternsUpdated = 0;
    const processedIds: string[] = [];

    for (const feedback of feedbackList) {
      const ingredients = feedback.ingredients || [];
      
      // Process missed allergens - these should be added to patterns
      for (const missedAllergen of feedback.missed_allergens || []) {
        for (const ingredient of ingredients) {
          const normalizedIngredient = ingredient.toLowerCase().trim();
          
          // Update or create pattern
          await upsertPattern(normalizedIngredient, missedAllergen, 0.1); // Add confidence
          patternsUpdated++;
        }
      }
      
      // Process confirmed allergens - increase confidence
      for (const confirmedAllergen of feedback.confirmed_allergens || []) {
        for (const ingredient of ingredients) {
          const normalizedIngredient = ingredient.toLowerCase().trim();
          await upsertPattern(normalizedIngredient, confirmedAllergen, 0.05); // Small boost
          patternsUpdated++;
        }
      }
      
      // Process false positives - decrease confidence
      for (const falsePositive of feedback.false_positives || []) {
        for (const ingredient of ingredients) {
          const normalizedIngredient = ingredient.toLowerCase().trim();
          await upsertPattern(normalizedIngredient, falsePositive, -0.1); // Reduce confidence
          patternsUpdated++;
        }
      }
      
      processedIds.push(feedback.id);
    }

    // Mark feedback as processed
    if (processedIds.length > 0) {
      await supabase
        .from("allergen_feedback")
        .update({ is_processed: true })
        .in("id", processedIds);
    }

    // Invalidate cache
    lastCacheUpdate = 0;
    
    console.log(`Processed ${processedIds.length} feedback items, updated ${patternsUpdated} patterns`);
    return patternsUpdated;
  } catch (error) {
    console.error("Error processing feedback:", error);
    return 0;
  }
}

/**
 * Upsert an allergen pattern with confidence adjustment
 */
async function upsertPattern(ingredient: string, allergen: string, confidenceChange: number): Promise<void> {
  try {
    // Check if pattern exists
    const { data: existing } = await supabase
      .from("allergen_patterns")
      .select("*")
      .eq("ingredient_pattern", ingredient)
      .eq("allergen", allergen)
      .single();

    if (existing) {
      // Update existing pattern
      const newConfidence = Math.max(0, Math.min(1, existing.confidence_score + confidenceChange));
      const newCount = existing.feedback_count + 1;
      
      await supabase
        .from("allergen_patterns")
        .update({
          confidence_score: newConfidence,
          feedback_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else if (confidenceChange > 0) {
      // Only create new pattern for positive feedback
      await supabase
        .from("allergen_patterns")
        .insert({
          ingredient_pattern: ingredient,
          allergen: allergen,
          confidence_score: 0.5 + confidenceChange, // Start at 0.5 + adjustment
          feedback_count: 1
        });
    }
  } catch (error) {
    // Ignore individual pattern errors (likely duplicate key)
    console.debug("Pattern upsert:", ingredient, allergen, error);
  }
}

/**
 * Submit feedback (batch processed hourly via edge function)
 * No longer triggers immediate learning - more efficient at scale
 */
export async function submitFeedbackWithLearning(
  dishName: string,
  ingredients: string[],
  detectedAllergens: string[],
  confirmedAllergens: string[],
  missedAllergens: string[],
  falsePositives: string[],
  feedbackType: "confirmation" | "correction"
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("allergen_feedback").insert({
      user_id: user?.id || null,
      dish_name: dishName,
      detected_allergens: detectedAllergens,
      confirmed_allergens: confirmedAllergens,
      missed_allergens: missedAllergens,
      false_positives: falsePositives,
      ingredients: ingredients,
      feedback_type: feedbackType,
      is_processed: false
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }

    // Feedback is now batch processed hourly by edge function
    // No immediate processing for better scalability
    console.log("Feedback submitted, will be processed in next batch");
    
    return true;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return false;
  }
}
