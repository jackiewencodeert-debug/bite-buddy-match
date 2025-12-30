/**
 * Comprehensive allergen database for local menu analysis
 * Maps ingredients to their allergens and provides dish recognition
 */

// EU 14 major allergens
export const MAJOR_ALLERGENS = [
  'gluten',
  'lactose',
  'noten',
  'pinda\'s',
  'schaaldieren',
  'vis',
  'eieren',
  'soja',
  'sesam',
  'selderij',
  'mosterd',
  'sulfiet',
  'weekdieren',
  'lupine'
] as const;

export type MajorAllergen = typeof MAJOR_ALLERGENS[number];

export interface IngredientInfo {
  allergens: MajorAllergen[];
  aliases?: string[]; // Alternative names in different languages
}

// Comprehensive ingredient to allergen mapping
export const ingredientAllergenMap: Record<string, IngredientInfo> = {
  // Gluten containing ingredients
  'tarwe': { allergens: ['gluten'], aliases: ['wheat', 'weizen', 'blé', 'froment'] },
  'bloem': { allergens: ['gluten'], aliases: ['flour', 'mehl', 'farine'] },
  'pasta': { allergens: ['gluten'], aliases: ['noodles', 'spaghetti', 'penne', 'fusilli', 'tagliatelle'] },
  'brood': { allergens: ['gluten'], aliases: ['bread', 'brot', 'pain', 'toast', 'ciabatta', 'focaccia'] },
  'paneermeel': { allergens: ['gluten'], aliases: ['breadcrumbs', 'paniermehl', 'chapelure'] },
  'gerst': { allergens: ['gluten'], aliases: ['barley', 'gerste', 'orge'] },
  'rogge': { allergens: ['gluten'], aliases: ['rye', 'roggen', 'seigle'] },
  'spelt': { allergens: ['gluten'], aliases: ['dinkel', 'épeautre'] },
  'havermout': { allergens: ['gluten'], aliases: ['oatmeal', 'oats', 'haferflocken', 'avoine'] },
  'couscous': { allergens: ['gluten'] },
  'bulgur': { allergens: ['gluten'] },
  'seitan': { allergens: ['gluten'] },
  'pannenkoek': { allergens: ['gluten', 'eieren', 'lactose'], aliases: ['pancake', 'pfannkuchen', 'crêpe'] },
  'pizza': { allergens: ['gluten', 'lactose'] },
  'croissant': { allergens: ['gluten', 'lactose', 'eieren'] },
  'cake': { allergens: ['gluten', 'eieren', 'lactose'] },
  'taart': { allergens: ['gluten', 'eieren', 'lactose'], aliases: ['pie', 'torte', 'tarte'] },
  'biscuit': { allergens: ['gluten', 'eieren', 'lactose'], aliases: ['cookie', 'keks'] },
  'wrap': { allergens: ['gluten'], aliases: ['tortilla'] },
  'naan': { allergens: ['gluten', 'lactose'] },
  'pita': { allergens: ['gluten'] },
  'bagel': { allergens: ['gluten', 'eieren'] },
  'pretzel': { allergens: ['gluten'] },
  'croutons': { allergens: ['gluten'] },

  // Dairy/Lactose containing ingredients
  'melk': { allergens: ['lactose'], aliases: ['milk', 'milch', 'lait', 'leche'] },
  'kaas': { allergens: ['lactose'], aliases: ['cheese', 'käse', 'fromage', 'queso'] },
  'room': { allergens: ['lactose'], aliases: ['cream', 'sahne', 'crème'] },
  'boter': { allergens: ['lactose'], aliases: ['butter', 'beurre', 'mantequilla'] },
  'yoghurt': { allergens: ['lactose'], aliases: ['yogurt', 'joghurt'] },
  'kwark': { allergens: ['lactose'], aliases: ['quark', 'fromage blanc'] },
  'mascarpone': { allergens: ['lactose'] },
  'ricotta': { allergens: ['lactose'] },
  'mozzarella': { allergens: ['lactose'] },
  'parmesan': { allergens: ['lactose'], aliases: ['parmigiano', 'parmezaan'] },
  'gorgonzola': { allergens: ['lactose'] },
  'brie': { allergens: ['lactose'] },
  'camembert': { allergens: ['lactose'] },
  'feta': { allergens: ['lactose'] },
  'gouda': { allergens: ['lactose'] },
  'cheddar': { allergens: ['lactose'] },
  'roomijs': { allergens: ['lactose', 'eieren'], aliases: ['ice cream', 'eis', 'glace'] },
  'crème fraîche': { allergens: ['lactose'] },
  'slagroom': { allergens: ['lactose'], aliases: ['whipped cream', 'schlagsahne'] },
  'bechamelsaus': { allergens: ['lactose', 'gluten'], aliases: ['béchamel', 'white sauce'] },

  // Nuts
  'amandelen': { allergens: ['noten'], aliases: ['almonds', 'mandeln', 'amandes'] },
  'walnoten': { allergens: ['noten'], aliases: ['walnuts', 'walnüsse', 'noix'] },
  'hazelnoten': { allergens: ['noten'], aliases: ['hazelnuts', 'haselnüsse', 'noisettes'] },
  'cashewnoten': { allergens: ['noten'], aliases: ['cashews', 'cashewkerne', 'noix de cajou'] },
  'pistachenoten': { allergens: ['noten'], aliases: ['pistachios', 'pistazien', 'pistaches'] },
  'pecannoten': { allergens: ['noten'], aliases: ['pecans', 'pekannüsse', 'noix de pécan'] },
  'macadamia': { allergens: ['noten'] },
  'pijnboompitten': { allergens: ['noten'], aliases: ['pine nuts', 'pinienkerne', 'pignons'] },
  'paranoten': { allergens: ['noten'], aliases: ['brazil nuts', 'paranüsse', 'noix du brésil'] },
  'notenpasta': { allergens: ['noten'], aliases: ['nut butter', 'nussbutter'] },
  'pesto': { allergens: ['noten', 'lactose'], aliases: ['basil pesto'] },
  'praline': { allergens: ['noten', 'lactose'] },
  'marzipan': { allergens: ['noten'], aliases: ['marsepein'] },
  'nougat': { allergens: ['noten'] },

  // Peanuts
  'pinda': { allergens: ['pinda\'s'], aliases: ['peanut', 'erdnuss', 'cacahuète', 'arachide'] },
  'pindakaas': { allergens: ['pinda\'s'], aliases: ['peanut butter', 'erdnussbutter', 'beurre de cacahuète'] },
  'satésaus': { allergens: ['pinda\'s', 'soja'], aliases: ['peanut sauce', 'satay sauce'] },
  'pindasaus': { allergens: ['pinda\'s'] },

  // Shellfish
  'garnalen': { allergens: ['schaaldieren'], aliases: ['shrimp', 'prawns', 'garnelen', 'crevettes'] },
  'kreeft': { allergens: ['schaaldieren'], aliases: ['lobster', 'hummer', 'homard'] },
  'krab': { allergens: ['schaaldieren'], aliases: ['crab', 'krabbe', 'crabe'] },
  'langoustine': { allergens: ['schaaldieren'], aliases: ['scampi'] },
  'rivierkreeft': { allergens: ['schaaldieren'], aliases: ['crayfish', 'flusskrebs', 'écrevisse'] },

  // Fish
  'zalm': { allergens: ['vis'], aliases: ['salmon', 'lachs', 'saumon'] },
  'tonijn': { allergens: ['vis'], aliases: ['tuna', 'thunfisch', 'thon'] },
  'kabeljauw': { allergens: ['vis'], aliases: ['cod', 'kabeljau', 'morue', 'cabillaud'] },
  'haring': { allergens: ['vis'], aliases: ['herring', 'hering', 'hareng'] },
  'makreel': { allergens: ['vis'], aliases: ['mackerel', 'makrele', 'maquereau'] },
  'sardine': { allergens: ['vis'], aliases: ['sardines'] },
  'ansjovis': { allergens: ['vis'], aliases: ['anchovy', 'sardelle', 'anchois'] },
  'forel': { allergens: ['vis'], aliases: ['trout', 'forelle', 'truite'] },
  'zeebaars': { allergens: ['vis'], aliases: ['sea bass', 'wolfsbarsch', 'bar'] },
  'dorade': { allergens: ['vis'], aliases: ['sea bream', 'goldbrasse', 'daurade'] },
  'schol': { allergens: ['vis'], aliases: ['plaice', 'scholle', 'plie'] },
  'tong': { allergens: ['vis'], aliases: ['sole', 'seezunge'] },
  'paling': { allergens: ['vis'], aliases: ['eel', 'aal', 'anguille'] },
  'vissaus': { allergens: ['vis'], aliases: ['fish sauce', 'nuoc mam'] },
  'oestersaus': { allergens: ['vis', 'weekdieren'], aliases: ['oyster sauce'] },
  'worcestersaus': { allergens: ['vis'], aliases: ['worcestershire sauce'] },
  'caesar': { allergens: ['vis', 'eieren'], aliases: ['caesar dressing'] }, // Contains anchovies

  // Eggs
  'ei': { allergens: ['eieren'], aliases: ['egg', 'ei', 'oeuf', 'huevo'] },
  'eierdooier': { allergens: ['eieren'], aliases: ['egg yolk', 'eigelb', 'jaune d\'oeuf'] },
  'eiwit': { allergens: ['eieren'], aliases: ['egg white', 'eiklar', 'blanc d\'oeuf'] },
  'mayonaise': { allergens: ['eieren'], aliases: ['mayo', 'mayonnaise'] },
  'aioli': { allergens: ['eieren'] },
  'hollandaise': { allergens: ['eieren', 'lactose'] },
  'béarnaise': { allergens: ['eieren', 'lactose'] },
  'meringue': { allergens: ['eieren'] },
  'omelet': { allergens: ['eieren', 'lactose'], aliases: ['omelette'] },
  'quiche': { allergens: ['eieren', 'lactose', 'gluten'] },
  'frittata': { allergens: ['eieren', 'lactose'] },
  'tiramisu': { allergens: ['eieren', 'lactose', 'gluten'] },
  'carbonara': { allergens: ['eieren', 'lactose', 'gluten'] },

  // Soy
  'sojasaus': { allergens: ['soja', 'gluten'], aliases: ['soy sauce', 'shoyu', 'tamari'] },
  'tofu': { allergens: ['soja'], aliases: ['bean curd'] },
  'tempeh': { allergens: ['soja'] },
  'edamame': { allergens: ['soja'] },
  'miso': { allergens: ['soja', 'gluten'] },
  'sojamelk': { allergens: ['soja'], aliases: ['soy milk', 'sojamilch', 'lait de soja'] },
  'sojabonen': { allergens: ['soja'], aliases: ['soybeans', 'sojabohnen'] },
  'teriyaki': { allergens: ['soja', 'gluten'] },
  'ketjap': { allergens: ['soja'], aliases: ['kecap'] },
  'hoisin': { allergens: ['soja', 'gluten'] },

  // Sesame
  'sesamzaad': { allergens: ['sesam'], aliases: ['sesame seeds', 'sesamsamen', 'graines de sésame'] },
  'sesamolie': { allergens: ['sesam'], aliases: ['sesame oil', 'sesamöl', 'huile de sésame'] },
  'tahini': { allergens: ['sesam'], aliases: ['tahina', 'sesampasta'] },
  'hummus': { allergens: ['sesam'] },
  'halvah': { allergens: ['sesam', 'noten'] },
  'za\'atar': { allergens: ['sesam'] },
  'gomasio': { allergens: ['sesam'] },

  // Celery
  'selderij': { allergens: ['selderij'], aliases: ['celery', 'sellerie', 'céleri'] },
  'knolselderij': { allergens: ['selderij'], aliases: ['celeriac', 'knollensellerie', 'céleri-rave'] },
  'bleekselderij': { allergens: ['selderij'], aliases: ['celery stalks'] },
  'selderijzout': { allergens: ['selderij'], aliases: ['celery salt'] },
  'bouillon': { allergens: ['selderij'], aliases: ['broth', 'bouillon', 'fond'] },

  // Mustard
  'mosterd': { allergens: ['mosterd'], aliases: ['mustard', 'senf', 'moutarde'] },
  'dijonsaus': { allergens: ['mosterd'], aliases: ['dijon'] },
  'mosterdzaad': { allergens: ['mosterd'], aliases: ['mustard seeds', 'senfkörner'] },
  'honingmosterd': { allergens: ['mosterd'] },

  // Molluscs
  'mosselen': { allergens: ['weekdieren'], aliases: ['mussels', 'miesmuscheln', 'moules'] },
  'oesters': { allergens: ['weekdieren'], aliases: ['oysters', 'austern', 'huîtres'] },
  'sint-jakobsschelpen': { allergens: ['weekdieren'], aliases: ['scallops', 'coquilles saint-jacques'] },
  'inktvis': { allergens: ['weekdieren'], aliases: ['squid', 'calamari', 'tintenfisch', 'calamar'] },
  'octopus': { allergens: ['weekdieren'], aliases: ['pulpo', 'poulpe'] },
  'kokkels': { allergens: ['weekdieren'], aliases: ['cockles'] },
  'venusschelpen': { allergens: ['weekdieren'], aliases: ['clams', 'vongole'] },
  'slak': { allergens: ['weekdieren'], aliases: ['snail', 'escargot', 'schnecke'] },

  // Sulfite (common in wine, dried fruits, preservatives)
  'wijn': { allergens: ['sulfiet'], aliases: ['wine', 'wein', 'vin'] },
  'azijn': { allergens: ['sulfiet'], aliases: ['vinegar', 'essig', 'vinaigre'] },
  'gedroogde abrikozen': { allergens: ['sulfiet'] },
  'rozijnen': { allergens: ['sulfiet'], aliases: ['raisins'] },

  // Lupin
  'lupine': { allergens: ['lupine'], aliases: ['lupin'] },
  'lupinebloem': { allergens: ['lupine'], aliases: ['lupin flour'] },
};

// Common dish names and their typical allergens
export const dishAllergenMap: Record<string, MajorAllergen[]> = {
  // Italian dishes
  'pizza margherita': ['gluten', 'lactose'],
  'pizza': ['gluten', 'lactose'],
  'lasagne': ['gluten', 'lactose', 'eieren'],
  'spaghetti bolognese': ['gluten', 'selderij'],
  'spaghetti carbonara': ['gluten', 'eieren', 'lactose'],
  'risotto': ['lactose'],
  'tiramisu': ['gluten', 'eieren', 'lactose'],
  'panna cotta': ['lactose'],
  'bruschetta': ['gluten'],
  'carpaccio': ['eieren'], // Often served with mayo
  'vitello tonnato': ['vis', 'eieren'],
  'caprese': ['lactose'],
  'gnocchi': ['gluten', 'eieren', 'lactose'],
  'ravioli': ['gluten', 'eieren'],
  'tortellini': ['gluten', 'eieren'],
  
  // Asian dishes
  'sushi': ['vis', 'soja', 'sesam'],
  'sashimi': ['vis', 'soja'],
  'ramen': ['gluten', 'soja', 'eieren'],
  'pad thai': ['pinda\'s', 'vis', 'eieren'],
  'tom yum': ['schaaldieren', 'vis'],
  'satay': ['pinda\'s', 'soja'],
  'nasi goreng': ['soja', 'eieren', 'schaaldieren'],
  'bami goreng': ['gluten', 'soja', 'eieren'],
  'tempura': ['gluten', 'eieren'],
  'gyoza': ['gluten', 'soja', 'sesam'],
  'spring rolls': ['gluten'],
  'dim sum': ['gluten', 'soja', 'sesam'],
  'kung pao': ['pinda\'s', 'soja'],
  'general tso': ['soja', 'gluten'],
  'teriyaki': ['soja', 'gluten'],
  'miso soup': ['soja', 'vis'],
  'pho': ['vis', 'soja'],
  'banh mi': ['gluten', 'soja'],
  'bibimbap': ['soja', 'sesam', 'eieren'],
  'curry': ['lactose'],
  'massaman': ['pinda\'s', 'vis'],
  
  // French dishes
  'quiche lorraine': ['gluten', 'eieren', 'lactose'],
  'croissant': ['gluten', 'lactose', 'eieren'],
  'croque monsieur': ['gluten', 'lactose'],
  'croque madame': ['gluten', 'lactose', 'eieren'],
  'bouillabaisse': ['vis', 'schaaldieren'],
  'coq au vin': ['sulfiet', 'gluten'],
  'escargot': ['weekdieren', 'lactose'],
  'foie gras': ['sulfiet'],
  'crème brûlée': ['lactose', 'eieren'],
  'mousse au chocolat': ['eieren', 'lactose'],
  'tarte tatin': ['gluten', 'lactose'],
  'macaron': ['noten', 'eieren'],
  'pain au chocolat': ['gluten', 'lactose'],
  
  // Dutch/Belgian dishes
  'bitterballen': ['gluten', 'lactose'],
  'kroket': ['gluten', 'lactose'],
  'frikandel': ['gluten'],
  'stamppot': ['lactose'],
  'pannenkoeken': ['gluten', 'eieren', 'lactose'],
  'poffertjes': ['gluten', 'eieren', 'lactose'],
  'stroopwafel': ['gluten', 'lactose', 'eieren'],
  'erwtensoep': ['selderij'],
  'haring': ['vis'],
  'kibbeling': ['vis', 'gluten'],
  'lekkerbek': ['vis', 'gluten'],
  'mosselen': ['weekdieren', 'selderij'],
  'moules frites': ['weekdieren', 'gluten'],
  'waterzooi': ['lactose', 'selderij', 'eieren'],
  'stoofvlees': ['gluten', 'selderij'],
  'vol-au-vent': ['gluten', 'lactose'],
  
  // American dishes
  'burger': ['gluten', 'sesam', 'eieren'],
  'hamburger': ['gluten', 'sesam', 'eieren'],
  'cheeseburger': ['gluten', 'sesam', 'eieren', 'lactose'],
  'hot dog': ['gluten', 'mosterd'],
  'club sandwich': ['gluten', 'eieren'],
  'caesar salad': ['vis', 'eieren', 'lactose', 'gluten'],
  'mac and cheese': ['gluten', 'lactose'],
  'pancakes': ['gluten', 'eieren', 'lactose'],
  'waffles': ['gluten', 'eieren', 'lactose'],
  'cheesecake': ['gluten', 'lactose', 'eieren'],
  'brownie': ['gluten', 'eieren', 'lactose', 'noten'],
  'buffalo wings': ['lactose'],
  
  // Mexican dishes
  'burrito': ['gluten', 'lactose'],
  'taco': ['gluten', 'lactose'],
  'nachos': ['lactose'],
  'quesadilla': ['gluten', 'lactose'],
  'guacamole': [],
  'enchiladas': ['gluten', 'lactose'],
  'fajitas': ['gluten', 'lactose'],
  'churros': ['gluten', 'eieren'],
  
  // Middle Eastern dishes
  'falafel': ['sesam', 'gluten'],
  'hummus': ['sesam'],
  'shawarma': ['sesam', 'gluten'],
  'kebab': ['gluten', 'sesam'],
  'döner': ['gluten', 'sesam', 'lactose'],
  'baklava': ['noten', 'gluten'],
  'tabouleh': ['gluten'],
  'baba ganoush': ['sesam'],
  'lahmacun': ['gluten'],
  'pide': ['gluten', 'eieren', 'lactose'],
  
  // Indian dishes
  'naan': ['gluten', 'lactose'],
  'samosa': ['gluten'],
  'pakora': ['gluten'],
  'tandoori': ['lactose'],
  'butter chicken': ['lactose'],
  'tikka masala': ['lactose'],
  'biryani': [],
  'dal': [],
  'paneer': ['lactose'],
  'korma': ['lactose', 'noten'],
  'vindaloo': [],
  'raita': ['lactose'],
  'kulfi': ['lactose', 'noten'],
  'gulab jamun': ['gluten', 'lactose'],
  
  // Greek dishes
  'moussaka': ['gluten', 'lactose', 'eieren'],
  'souvlaki': [],
  'gyros': ['gluten', 'lactose'],
  'tzatziki': ['lactose'],
  'spanakopita': ['gluten', 'lactose', 'eieren'],
  'dolmades': [],
  'baklava': ['noten', 'gluten'],
  'greek salad': ['lactose'],
  
  // Breakfast items
  'eggs benedict': ['gluten', 'eieren', 'lactose'],
  'french toast': ['gluten', 'eieren', 'lactose'],
  'omelette': ['eieren', 'lactose'],
  'scrambled eggs': ['eieren', 'lactose'],
  'granola': ['noten', 'gluten'],
  'muesli': ['noten', 'gluten', 'lactose'],
  'croissant': ['gluten', 'lactose', 'eieren'],
  
  // Desserts
  'ice cream': ['lactose', 'eieren'],
  'chocolate cake': ['gluten', 'eieren', 'lactose'],
  'apple pie': ['gluten', 'lactose'],
  'carrot cake': ['gluten', 'eieren', 'noten'],
  'profiteroles': ['gluten', 'eieren', 'lactose'],
  'éclair': ['gluten', 'eieren', 'lactose'],
  'crêpe': ['gluten', 'eieren', 'lactose'],
  'sorbet': [],
  'panna cotta': ['lactose'],
  'flan': ['eieren', 'lactose'],
  'pavlova': ['eieren'],
};

/**
 * Find allergens for an ingredient
 */
export function findAllergensForIngredient(ingredient: string): MajorAllergen[] {
  const normalized = ingredient.toLowerCase().trim();
  
  // Direct match
  if (ingredientAllergenMap[normalized]) {
    return ingredientAllergenMap[normalized].allergens;
  }
  
  // Check aliases
  for (const [key, info] of Object.entries(ingredientAllergenMap)) {
    if (info.aliases?.some(alias => alias.toLowerCase() === normalized)) {
      return info.allergens;
    }
  }
  
  // Partial match (ingredient contains known allergen ingredient)
  for (const [key, info] of Object.entries(ingredientAllergenMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return info.allergens;
    }
    if (info.aliases?.some(alias => normalized.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalized))) {
      return info.allergens;
    }
  }
  
  return [];
}

/**
 * Find allergens for a dish name
 */
export function findAllergensForDish(dishName: string): MajorAllergen[] {
  const normalized = dishName.toLowerCase().trim();
  
  // Direct match
  if (dishAllergenMap[normalized]) {
    return dishAllergenMap[normalized];
  }
  
  // Partial match
  for (const [key, allergens] of Object.entries(dishAllergenMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return allergens;
    }
  }
  
  return [];
}

/**
 * Detect allergens from ingredients list
 */
export function detectAllergensFromIngredients(ingredients: string[]): MajorAllergen[] {
  const allergenSet = new Set<MajorAllergen>();
  
  for (const ingredient of ingredients) {
    const allergens = findAllergensForIngredient(ingredient);
    allergens.forEach(a => allergenSet.add(a));
  }
  
  return Array.from(allergenSet);
}
