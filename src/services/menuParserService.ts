import { 
  findAllergensForDish, 
  detectAllergensFromIngredients,
  MajorAllergen 
} from '@/data/allergenDatabase';
import { 
  loadLearnedPatterns, 
  findLearnedAllergens,
  LearnedPattern 
} from './feedbackLearningService';

// Cache for learned patterns
let cachedPatterns: LearnedPattern[] = [];

export interface ParsedDish {
  id: string;
  name: string;
  description?: string;
  price?: string;
  ingredients: string[];
  allergens: string[];
  dietary_info: string[];
  category?: string;
}

export interface ParsedMenu {
  dishes: ParsedDish[];
  categories: string[];
  isMenu: boolean;
}

// Common menu section headers
const CATEGORY_KEYWORDS = [
  'voorgerechten', 'starters', 'appetizers', 'entrées', 'vorspeisen',
  'hoofdgerechten', 'main courses', 'mains', 'plats principaux', 'hauptgerichte',
  'nagerechten', 'desserts', 'nachspeisen',
  'dranken', 'drinks', 'beverages', 'boissons', 'getränke',
  'bijgerechten', 'side dishes', 'beilagen', 'accompagnements',
  'salades', 'salads', 'salate',
  'soepen', 'soups', 'suppen', 'soupes',
  'pasta', 'pizza', 'grill', 'vis', 'fish', 'poisson',
  'vlees', 'meat', 'viande', 'fleisch',
  'vegetarisch', 'vegetarian', 'vegan',
  'lunch', 'diner', 'dinner', 'ontbijt', 'breakfast', 'brunch',
  'specials', 'dagschotel', 'menu van de dag', 'plat du jour'
];

// Price patterns
const PRICE_PATTERNS = [
  /€\s*(\d+[.,]\d{2})/g,
  /(\d+[.,]\d{2})\s*€/g,
  /EUR?\s*(\d+[.,]\d{2})/gi,
  /(\d+[.,]\d{2})\s*EUR?/gi,
  /\$\s*(\d+[.,]\d{2})/g,
  /(\d+[.,]\d{2})\s*\$/g,
  /(\d+[.,]\d{2})(?:\s|$)/g, // Just numbers at end of line
];

// Dietary indicators
const DIETARY_INDICATORS: Record<string, string[]> = {
  'vegetarisch': ['(v)', '🥬', '🌱', 'vegetarisch', 'vegetarian', 'végétarien'],
  'veganistisch': ['(ve)', '(vg)', '🌿', 'vegan', 'veganistisch', 'végan'],
  'glutenvrij': ['(gf)', 'glutenvrij', 'gluten-free', 'sans gluten', 'glutenfrei'],
  'lactosevrij': ['(lf)', 'lactosevrij', 'lactose-free', 'sans lactose'],
  'halal': ['halal', '🕌'],
  'biologisch': ['bio', 'organic', 'biologisch', '🌾'],
};

/**
 * Check if text looks like a menu
 */
function isLikelyMenu(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for menu indicators
  const hasCategory = CATEGORY_KEYWORDS.some(kw => lowerText.includes(kw));
  const hasPrices = PRICE_PATTERNS.some(p => p.test(text));
  const hasMultipleLines = text.split('\n').filter(l => l.trim().length > 0).length > 3;
  
  return (hasCategory || hasPrices) && hasMultipleLines;
}

/**
 * Extract price from text
 */
function extractPrice(text: string): string | undefined {
  for (const pattern of PRICE_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    const match = pattern.exec(text);
    if (match) {
      const priceValue = match[1] || match[0];
      // Format consistently
      const normalized = priceValue.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0 && num < 1000) {
        return `€${num.toFixed(2).replace('.', ',')}`;
      }
    }
  }
  return undefined;
}

/**
 * Detect dietary info from text
 */
function detectDietaryInfo(text: string): string[] {
  const dietary: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [diet, indicators] of Object.entries(DIETARY_INDICATORS)) {
    if (indicators.some(ind => lowerText.includes(ind.toLowerCase()) || text.includes(ind))) {
      dietary.push(diet);
    }
  }
  
  return dietary;
}

/**
 * Extract ingredients from description
 */
function extractIngredients(description: string): string[] {
  // Common separators for ingredients
  const separators = /[,;|\/•·]|\s+met\s+|\s+with\s+|\s+en\s+|\s+and\s+/gi;
  
  // Split and clean
  const parts = description.split(separators)
    .map(p => p.trim())
    .filter(p => p.length > 1 && p.length < 50);
  
  return parts;
}

/**
 * Initialize learned patterns from the database
 */
export async function initializeLearnedPatterns(): Promise<void> {
  cachedPatterns = await loadLearnedPatterns();
}

/**
 * Parse OCR text into structured menu data
 */
export async function parseMenuFromText(ocrText: string): Promise<ParsedMenu> {
  // Load learned patterns if not cached
  if (cachedPatterns.length === 0) {
    cachedPatterns = await loadLearnedPatterns();
  }

  if (!isLikelyMenu(ocrText)) {
    return {
      dishes: [],
      categories: [],
      isMenu: false
    };
  }

  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const dishes: ParsedDish[] = [];
  const foundCategories: string[] = [];
  let currentCategory: string | undefined;
  let dishCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Check if this is a category header
    const matchedCategory = CATEGORY_KEYWORDS.find(kw => 
      lowerLine.includes(kw) && line.length < 50
    );
    
    if (matchedCategory && !extractPrice(line)) {
      currentCategory = line;
      if (!foundCategories.includes(line)) {
        foundCategories.push(line);
      }
      continue;
    }
    
    // Try to parse as a dish
    const price = extractPrice(line);
    
    // If line has a price or is a potential dish name (not too long, not too short)
    if (price || (line.length > 3 && line.length < 100)) {
      // Get dish name (remove price if present)
      let dishName = line;
      for (const pattern of PRICE_PATTERNS) {
        pattern.lastIndex = 0;
        dishName = dishName.replace(pattern, '').trim();
      }
      
      // Skip if remaining name is too short
      if (dishName.length < 3) continue;
      
      // Look for description in next line(s)
      let description = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // If next line doesn't have a price and isn't a category, it might be description
        if (!extractPrice(nextLine) && 
            !CATEGORY_KEYWORDS.some(kw => nextLine.toLowerCase().includes(kw)) &&
            nextLine.length > 5 && nextLine.length < 200) {
          description = nextLine;
          i++; // Skip this line in next iteration
        }
      }
      
      // Extract ingredients from description
      const ingredients = description ? extractIngredients(description) : [];
      
      // Detect allergens from static database
      const dishAllergens = findAllergensForDish(dishName);
      const ingredientAllergens = detectAllergensFromIngredients(ingredients);
      
      // Also check learned patterns from user feedback
      const learnedAllergens: string[] = [];
      for (const ingredient of ingredients) {
        const learned = findLearnedAllergens(ingredient, cachedPatterns);
        learnedAllergens.push(...learned);
      }
      
      const allAllergens = [...new Set([...dishAllergens, ...ingredientAllergens, ...learnedAllergens])];
      
      // Detect dietary info
      const dietaryInfo = detectDietaryInfo(dishName + ' ' + description);
      
      dishes.push({
        id: `dish-${dishCounter++}`,
        name: dishName,
        description: description || undefined,
        price: price,
        ingredients,
        allergens: allAllergens,
        dietary_info: dietaryInfo,
        category: currentCategory
      });
    }
  }

  return {
    dishes,
    categories: foundCategories,
    isMenu: dishes.length > 0
  };
}

/**
 * Enhance dish with additional allergen detection
 */
export function enhanceDishAllergens(dish: ParsedDish): ParsedDish {
  const existingAllergens = new Set(dish.allergens);
  
  // Re-check with all available data
  const dishAllergens = findAllergensForDish(dish.name);
  const ingredientAllergens = detectAllergensFromIngredients(dish.ingredients);
  const descriptionAllergens = dish.description 
    ? detectAllergensFromIngredients(extractIngredients(dish.description))
    : [];
  
  [...dishAllergens, ...ingredientAllergens, ...descriptionAllergens]
    .forEach(a => existingAllergens.add(a));
  
  return {
    ...dish,
    allergens: Array.from(existingAllergens)
  };
}
