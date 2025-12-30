/**
 * Comprehensive translation database for ingredients, allergens, and dietary info
 * Supports 20 languages for menu localization
 */

export type LangCode = "nl" | "en" | "fr" | "es" | "de" | "it" | "hu" | "id" | "tr" | "vi" | "th" | "uk" | "pt" | "ru" | "hi" | "pl" | "zh" | "ja" | "ko" | "ar";

export interface TranslatedItem {
  original: string;
  translated: string;
}

// Allergen translations (EU 14 major allergens)
export const allergenTranslations: Record<string, Record<LangCode, string>> = {
  'gluten': { 
    nl: 'Gluten', en: 'Gluten', fr: 'Gluten', es: 'Gluten', de: 'Gluten', 
    it: 'Glutine', hu: 'Glutén', id: 'Gluten', tr: 'Gluten', vi: 'Gluten', 
    th: 'กลูเตน', uk: 'Глютен', pt: 'Glúten', ru: 'Глютен', hi: 'ग्लूटेन', 
    pl: 'Gluten', zh: '麸质', ja: 'グルテン', ko: '글루텐', ar: 'الغلوتين' 
  },
  'lactose': { 
    nl: 'Lactose', en: 'Lactose', fr: 'Lactose', es: 'Lactosa', de: 'Laktose', 
    it: 'Lattosio', hu: 'Laktóz', id: 'Laktosa', tr: 'Laktoz', vi: 'Lactose', 
    th: 'แลคโตส', uk: 'Лактоза', pt: 'Lactose', ru: 'Лактоза', hi: 'लैक्टोज', 
    pl: 'Laktoza', zh: '乳糖', ja: '乳糖', ko: '유당', ar: 'اللاكتوز' 
  },
  'noten': { 
    nl: 'Noten', en: 'Nuts', fr: 'Noix', es: 'Frutos secos', de: 'Nüsse', 
    it: 'Frutta a guscio', hu: 'Diófélék', id: 'Kacang', tr: 'Kuruyemiş', vi: 'Hạt', 
    th: 'ถั่ว', uk: 'Горіхи', pt: 'Frutos secos', ru: 'Орехи', hi: 'मेवे', 
    pl: 'Orzechy', zh: '坚果', ja: 'ナッツ', ko: '견과류', ar: 'المكسرات' 
  },
  "pinda's": { 
    nl: "Pinda's", en: 'Peanuts', fr: 'Arachides', es: 'Cacahuetes', de: 'Erdnüsse', 
    it: 'Arachidi', hu: 'Földimogyoró', id: 'Kacang tanah', tr: 'Yer fıstığı', vi: 'Đậu phộng', 
    th: 'ถั่วลิสง', uk: 'Арахіс', pt: 'Amendoins', ru: 'Арахис', hi: 'मूंगफली', 
    pl: 'Orzeszki ziemne', zh: '花生', ja: 'ピーナッツ', ko: '땅콩', ar: 'الفول السوداني' 
  },
  'schaaldieren': { 
    nl: 'Schaaldieren', en: 'Shellfish', fr: 'Crustacés', es: 'Mariscos', de: 'Schalentiere', 
    it: 'Crostacei', hu: 'Rákfélék', id: 'Kerang', tr: 'Kabuklu deniz ürünleri', vi: 'Động vật có vỏ', 
    th: 'หอย', uk: 'Молюски', pt: 'Mariscos', ru: 'Моллюски', hi: 'शंख', 
    pl: 'Skorupiaki', zh: '贝类', ja: '甲殻類', ko: '갑각류', ar: 'المحار' 
  },
  'vis': { 
    nl: 'Vis', en: 'Fish', fr: 'Poisson', es: 'Pescado', de: 'Fisch', 
    it: 'Pesce', hu: 'Hal', id: 'Ikan', tr: 'Balık', vi: 'Cá', 
    th: 'ปลา', uk: 'Риба', pt: 'Peixe', ru: 'Рыба', hi: 'मछली', 
    pl: 'Ryba', zh: '鱼', ja: '魚', ko: '생선', ar: 'السمك' 
  },
  'eieren': { 
    nl: 'Eieren', en: 'Eggs', fr: 'Œufs', es: 'Huevos', de: 'Eier', 
    it: 'Uova', hu: 'Tojás', id: 'Telur', tr: 'Yumurta', vi: 'Trứng', 
    th: 'ไข่', uk: 'Яйця', pt: 'Ovos', ru: 'Яйца', hi: 'अंडे', 
    pl: 'Jajka', zh: '鸡蛋', ja: '卵', ko: '달걀', ar: 'البيض' 
  },
  'soja': { 
    nl: 'Soja', en: 'Soy', fr: 'Soja', es: 'Soja', de: 'Soja', 
    it: 'Soia', hu: 'Szója', id: 'Kedelai', tr: 'Soya', vi: 'Đậu nành', 
    th: 'ถั่วเหลือง', uk: 'Соя', pt: 'Soja', ru: 'Соя', hi: 'सोया', 
    pl: 'Soja', zh: '大豆', ja: '大豆', ko: '대두', ar: 'الصويا' 
  },
  'sesam': { 
    nl: 'Sesam', en: 'Sesame', fr: 'Sésame', es: 'Sésamo', de: 'Sesam', 
    it: 'Sesamo', hu: 'Szezám', id: 'Wijen', tr: 'Susam', vi: 'Mè', 
    th: 'งา', uk: 'Кунжут', pt: 'Sésamo', ru: 'Кунжут', hi: 'तिल', 
    pl: 'Sezam', zh: '芝麻', ja: 'ゴマ', ko: '참깨', ar: 'السمسم' 
  },
  'selderij': { 
    nl: 'Selderij', en: 'Celery', fr: 'Céleri', es: 'Apio', de: 'Sellerie', 
    it: 'Sedano', hu: 'Zeller', id: 'Seledri', tr: 'Kereviz', vi: 'Cần tây', 
    th: 'ขึ้นฉ่าย', uk: 'Селера', pt: 'Aipo', ru: 'Сельдерей', hi: 'अजवाइन', 
    pl: 'Seler', zh: '芹菜', ja: 'セロリ', ko: '셀러리', ar: 'الكرفس' 
  },
  'mosterd': { 
    nl: 'Mosterd', en: 'Mustard', fr: 'Moutarde', es: 'Mostaza', de: 'Senf', 
    it: 'Senape', hu: 'Mustár', id: 'Mustard', tr: 'Hardal', vi: 'Mù tạt', 
    th: 'มัสตาร์ด', uk: 'Гірчиця', pt: 'Mostarda', ru: 'Горчица', hi: 'सरसों', 
    pl: 'Musztarda', zh: '芥末', ja: 'マスタード', ko: '겨자', ar: 'الخردل' 
  },
  'sulfiet': { 
    nl: 'Sulfiet', en: 'Sulfite', fr: 'Sulfites', es: 'Sulfitos', de: 'Sulfite', 
    it: 'Solfiti', hu: 'Szulfit', id: 'Sulfit', tr: 'Sülfit', vi: 'Sulfit', 
    th: 'ซัลไฟต์', uk: 'Сульфіти', pt: 'Sulfitos', ru: 'Сульфиты', hi: 'सल्फाइट', 
    pl: 'Siarczyny', zh: '亚硫酸盐', ja: '亜硫酸塩', ko: '아황산염', ar: 'الكبريتيت' 
  },
  'weekdieren': { 
    nl: 'Weekdieren', en: 'Molluscs', fr: 'Mollusques', es: 'Moluscos', de: 'Weichtiere', 
    it: 'Molluschi', hu: 'Puhatestűek', id: 'Moluska', tr: 'Yumuşakçalar', vi: 'Động vật thân mềm', 
    th: 'หอยทาก', uk: 'Молюски', pt: 'Moluscos', ru: 'Моллюски', hi: 'मोलस्क', 
    pl: 'Mięczaki', zh: '软体动物', ja: '軟体動物', ko: '연체동물', ar: 'الرخويات' 
  },
  'lupine': { 
    nl: 'Lupine', en: 'Lupin', fr: 'Lupin', es: 'Altramuz', de: 'Lupinen', 
    it: 'Lupino', hu: 'Csillagfürt', id: 'Lupin', tr: 'Acı bakla', vi: 'Lupin', 
    th: 'ลูปิน', uk: 'Люпин', pt: 'Tremoço', ru: 'Люпин', hi: 'ल्यूपिन', 
    pl: 'Łubin', zh: '羽扇豆', ja: 'ルピナス', ko: '루핀', ar: 'الترمس' 
  },
};

// Dietary info translations
export const dietaryTranslations: Record<string, Record<LangCode, string>> = {
  'vegetarisch': { 
    nl: 'Vegetarisch', en: 'Vegetarian', fr: 'Végétarien', es: 'Vegetariano', de: 'Vegetarisch', 
    it: 'Vegetariano', hu: 'Vegetáriánus', id: 'Vegetarian', tr: 'Vejetaryen', vi: 'Chay', 
    th: 'มังสวิรัติ', uk: 'Вегетаріанський', pt: 'Vegetariano', ru: 'Вегетарианский', hi: 'शाकाहारी', 
    pl: 'Wegetariański', zh: '素食', ja: 'ベジタリアン', ko: '채식', ar: 'نباتي' 
  },
  'veganistisch': { 
    nl: 'Veganistisch', en: 'Vegan', fr: 'Végan', es: 'Vegano', de: 'Vegan', 
    it: 'Vegano', hu: 'Vegán', id: 'Vegan', tr: 'Vegan', vi: 'Thuần chay', 
    th: 'วีแกน', uk: 'Веганський', pt: 'Vegano', ru: 'Веганский', hi: 'शुद्ध शाकाहारी', 
    pl: 'Wegański', zh: '纯素', ja: 'ビーガン', ko: '비건', ar: 'نباتي صرف' 
  },
  'glutenvrij': { 
    nl: 'Glutenvrij', en: 'Gluten-free', fr: 'Sans gluten', es: 'Sin gluten', de: 'Glutenfrei', 
    it: 'Senza glutine', hu: 'Gluténmentes', id: 'Bebas gluten', tr: 'Glutensiz', vi: 'Không gluten', 
    th: 'ปราศจากกลูเตน', uk: 'Безглютеновий', pt: 'Sem glúten', ru: 'Без глютена', hi: 'ग्लूटेन मुक्त', 
    pl: 'Bezglutenowy', zh: '无麸质', ja: 'グルテンフリー', ko: '글루텐 프리', ar: 'خالي من الغلوتين' 
  },
  'lactosevrij': { 
    nl: 'Lactosevrij', en: 'Lactose-free', fr: 'Sans lactose', es: 'Sin lactosa', de: 'Laktosefrei', 
    it: 'Senza lattosio', hu: 'Laktózmentes', id: 'Bebas laktosa', tr: 'Laktozsuz', vi: 'Không lactose', 
    th: 'ปราศจากแลคโตส', uk: 'Безлактозний', pt: 'Sem lactose', ru: 'Без лактозы', hi: 'लैक्टोज मुक्त', 
    pl: 'Bezlaktozowy', zh: '无乳糖', ja: '乳糖不使用', ko: '유당 프리', ar: 'خالي من اللاكتوز' 
  },
  'halal': { 
    nl: 'Halal', en: 'Halal', fr: 'Halal', es: 'Halal', de: 'Halal', 
    it: 'Halal', hu: 'Halal', id: 'Halal', tr: 'Helal', vi: 'Halal', 
    th: 'ฮาลาล', uk: 'Халяль', pt: 'Halal', ru: 'Халяль', hi: 'हलाल', 
    pl: 'Halal', zh: '清真', ja: 'ハラール', ko: '할랄', ar: 'حلال' 
  },
  'biologisch': { 
    nl: 'Biologisch', en: 'Organic', fr: 'Bio', es: 'Ecológico', de: 'Bio', 
    it: 'Biologico', hu: 'Bio', id: 'Organik', tr: 'Organik', vi: 'Hữu cơ', 
    th: 'ออร์แกนิก', uk: 'Органічний', pt: 'Biológico', ru: 'Органический', hi: 'जैविक', 
    pl: 'Bio', zh: '有机', ja: 'オーガニック', ko: '유기농', ar: 'عضوي' 
  },
};

// Common ingredient translations
export const ingredientTranslations: Record<string, Record<LangCode, string>> = {
  // Proteins
  'kip': { nl: 'Kip', en: 'Chicken', fr: 'Poulet', es: 'Pollo', de: 'Huhn', it: 'Pollo', hu: 'Csirke', id: 'Ayam', tr: 'Tavuk', vi: 'Gà', th: 'ไก่', uk: 'Курка', pt: 'Frango', ru: 'Курица', hi: 'मुर्गी', pl: 'Kurczak', zh: '鸡肉', ja: '鶏肉', ko: '닭고기', ar: 'دجاج' },
  'rundvlees': { nl: 'Rundvlees', en: 'Beef', fr: 'Bœuf', es: 'Ternera', de: 'Rindfleisch', it: 'Manzo', hu: 'Marhahús', id: 'Sapi', tr: 'Dana eti', vi: 'Thịt bò', th: 'เนื้อวัว', uk: 'Яловичина', pt: 'Carne de vaca', ru: 'Говядина', hi: 'गोमांस', pl: 'Wołowina', zh: '牛肉', ja: '牛肉', ko: '소고기', ar: 'لحم بقر' },
  'varkensvlees': { nl: 'Varkensvlees', en: 'Pork', fr: 'Porc', es: 'Cerdo', de: 'Schweinefleisch', it: 'Maiale', hu: 'Sertéshús', id: 'Babi', tr: 'Domuz eti', vi: 'Thịt heo', th: 'หมู', uk: 'Свинина', pt: 'Carne de porco', ru: 'Свинина', hi: 'सूअर का मांस', pl: 'Wieprzowina', zh: '猪肉', ja: '豚肉', ko: '돼지고기', ar: 'لحم خنزير' },
  'lam': { nl: 'Lam', en: 'Lamb', fr: 'Agneau', es: 'Cordero', de: 'Lamm', it: 'Agnello', hu: 'Bárány', id: 'Domba', tr: 'Kuzu', vi: 'Thịt cừu', th: 'เนื้อแกะ', uk: 'Баранина', pt: 'Cordeiro', ru: 'Баранина', hi: 'मेमने का मांस', pl: 'Jagnięcina', zh: '羊肉', ja: 'ラム', ko: '양고기', ar: 'لحم غنم' },
  'zalm': { nl: 'Zalm', en: 'Salmon', fr: 'Saumon', es: 'Salmón', de: 'Lachs', it: 'Salmone', hu: 'Lazac', id: 'Salmon', tr: 'Somon', vi: 'Cá hồi', th: 'ปลาแซลมอน', uk: 'Лосось', pt: 'Salmão', ru: 'Лосось', hi: 'सामन', pl: 'Łosoś', zh: '三文鱼', ja: 'サーモン', ko: '연어', ar: 'سلمون' },
  'garnalen': { nl: 'Garnalen', en: 'Shrimp', fr: 'Crevettes', es: 'Gambas', de: 'Garnelen', it: 'Gamberetti', hu: 'Garnéla', id: 'Udang', tr: 'Karides', vi: 'Tôm', th: 'กุ้ง', uk: 'Креветки', pt: 'Camarões', ru: 'Креветки', hi: 'झींगा', pl: 'Krewetki', zh: '虾', ja: 'エビ', ko: '새우', ar: 'جمبري' },
  
  // Vegetables
  'tomaat': { nl: 'Tomaat', en: 'Tomato', fr: 'Tomate', es: 'Tomate', de: 'Tomate', it: 'Pomodoro', hu: 'Paradicsom', id: 'Tomat', tr: 'Domates', vi: 'Cà chua', th: 'มะเขือเทศ', uk: 'Помідор', pt: 'Tomate', ru: 'Помидор', hi: 'टमाटर', pl: 'Pomidor', zh: '番茄', ja: 'トマト', ko: '토마토', ar: 'طماطم' },
  'ui': { nl: 'Ui', en: 'Onion', fr: 'Oignon', es: 'Cebolla', de: 'Zwiebel', it: 'Cipolla', hu: 'Hagyma', id: 'Bawang', tr: 'Soğan', vi: 'Hành', th: 'หัวหอม', uk: 'Цибуля', pt: 'Cebola', ru: 'Лук', hi: 'प्याज', pl: 'Cebula', zh: '洋葱', ja: '玉ねぎ', ko: '양파', ar: 'بصل' },
  'knoflook': { nl: 'Knoflook', en: 'Garlic', fr: 'Ail', es: 'Ajo', de: 'Knoblauch', it: 'Aglio', hu: 'Fokhagyma', id: 'Bawang putih', tr: 'Sarımsak', vi: 'Tỏi', th: 'กระเทียม', uk: 'Часник', pt: 'Alho', ru: 'Чеснок', hi: 'लहसुन', pl: 'Czosnek', zh: '大蒜', ja: 'ニンニク', ko: '마늘', ar: 'ثوم' },
  'paprika': { nl: 'Paprika', en: 'Bell pepper', fr: 'Poivron', es: 'Pimiento', de: 'Paprika', it: 'Peperone', hu: 'Paprika', id: 'Paprika', tr: 'Biber', vi: 'Ớt chuông', th: 'พริกหยวก', uk: 'Перець', pt: 'Pimentão', ru: 'Перец', hi: 'शिमला मिर्च', pl: 'Papryka', zh: '甜椒', ja: 'パプリカ', ko: '파프리카', ar: 'فلفل' },
  'champignons': { nl: 'Champignons', en: 'Mushrooms', fr: 'Champignons', es: 'Champiñones', de: 'Champignons', it: 'Funghi', hu: 'Gomba', id: 'Jamur', tr: 'Mantar', vi: 'Nấm', th: 'เห็ด', uk: 'Гриби', pt: 'Cogumelos', ru: 'Грибы', hi: 'मशरूम', pl: 'Pieczarki', zh: '蘑菇', ja: 'マッシュルーム', ko: '버섯', ar: 'فطر' },
  'spinazie': { nl: 'Spinazie', en: 'Spinach', fr: 'Épinards', es: 'Espinacas', de: 'Spinat', it: 'Spinaci', hu: 'Spenót', id: 'Bayam', tr: 'Ispanak', vi: 'Rau chân vịt', th: 'ผักโขม', uk: 'Шпинат', pt: 'Espinafre', ru: 'Шпинат', hi: 'पालक', pl: 'Szpinak', zh: '菠菜', ja: 'ほうれん草', ko: '시금치', ar: 'سبانخ' },
  'sla': { nl: 'Sla', en: 'Lettuce', fr: 'Laitue', es: 'Lechuga', de: 'Salat', it: 'Lattuga', hu: 'Saláta', id: 'Selada', tr: 'Marul', vi: 'Rau diếp', th: 'ผักกาดหอม', uk: 'Салат', pt: 'Alface', ru: 'Салат', hi: 'सलाद', pl: 'Sałata', zh: '生菜', ja: 'レタス', ko: '상추', ar: 'خس' },
  'komkommer': { nl: 'Komkommer', en: 'Cucumber', fr: 'Concombre', es: 'Pepino', de: 'Gurke', it: 'Cetriolo', hu: 'Uborka', id: 'Mentimun', tr: 'Salatalık', vi: 'Dưa chuột', th: 'แตงกวา', uk: 'Огірок', pt: 'Pepino', ru: 'Огурец', hi: 'खीरा', pl: 'Ogórek', zh: '黄瓜', ja: 'きゅうり', ko: '오이', ar: 'خيار' },
  'wortel': { nl: 'Wortel', en: 'Carrot', fr: 'Carotte', es: 'Zanahoria', de: 'Karotte', it: 'Carota', hu: 'Sárgarépa', id: 'Wortel', tr: 'Havuç', vi: 'Cà rốt', th: 'แครอท', uk: 'Морква', pt: 'Cenoura', ru: 'Морковь', hi: 'गाजर', pl: 'Marchewka', zh: '胡萝卜', ja: 'にんじん', ko: '당근', ar: 'جزر' },
  'aardappel': { nl: 'Aardappel', en: 'Potato', fr: 'Pomme de terre', es: 'Patata', de: 'Kartoffel', it: 'Patata', hu: 'Burgonya', id: 'Kentang', tr: 'Patates', vi: 'Khoai tây', th: 'มันฝรั่ง', uk: 'Картопля', pt: 'Batata', ru: 'Картофель', hi: 'आलू', pl: 'Ziemniak', zh: '土豆', ja: 'じゃがいも', ko: '감자', ar: 'بطاطس' },
  'rijst': { nl: 'Rijst', en: 'Rice', fr: 'Riz', es: 'Arroz', de: 'Reis', it: 'Riso', hu: 'Rizs', id: 'Nasi', tr: 'Pirinç', vi: 'Cơm', th: 'ข้าว', uk: 'Рис', pt: 'Arroz', ru: 'Рис', hi: 'चावल', pl: 'Ryż', zh: '米饭', ja: 'ご飯', ko: '밥', ar: 'أرز' },
  
  // Dairy
  'kaas': { nl: 'Kaas', en: 'Cheese', fr: 'Fromage', es: 'Queso', de: 'Käse', it: 'Formaggio', hu: 'Sajt', id: 'Keju', tr: 'Peynir', vi: 'Phô mai', th: 'ชีส', uk: 'Сир', pt: 'Queijo', ru: 'Сыр', hi: 'पनीर', pl: 'Ser', zh: '奶酪', ja: 'チーズ', ko: '치즈', ar: 'جبن' },
  'room': { nl: 'Room', en: 'Cream', fr: 'Crème', es: 'Nata', de: 'Sahne', it: 'Panna', hu: 'Tejszín', id: 'Krim', tr: 'Krema', vi: 'Kem', th: 'ครีม', uk: 'Вершки', pt: 'Nata', ru: 'Сливки', hi: 'क्रीम', pl: 'Śmietana', zh: '奶油', ja: 'クリーム', ko: '크림', ar: 'كريمة' },
  'boter': { nl: 'Boter', en: 'Butter', fr: 'Beurre', es: 'Mantequilla', de: 'Butter', it: 'Burro', hu: 'Vaj', id: 'Mentega', tr: 'Tereyağı', vi: 'Bơ', th: 'เนย', uk: 'Масло', pt: 'Manteiga', ru: 'Масло', hi: 'मक्खन', pl: 'Masło', zh: '黄油', ja: 'バター', ko: '버터', ar: 'زبدة' },
};

/**
 * Translate an allergen to the target language
 */
export function translateAllergen(allergen: string, targetLang: LangCode): TranslatedItem {
  const normalized = allergen.toLowerCase().trim();
  
  if (allergenTranslations[normalized] && allergenTranslations[normalized][targetLang]) {
    return {
      original: allergen,
      translated: allergenTranslations[normalized][targetLang]
    };
  }
  
  return {
    original: allergen,
    translated: allergen.charAt(0).toUpperCase() + allergen.slice(1)
  };
}

/**
 * Translate dietary info to the target language
 */
export function translateDietary(dietary: string, targetLang: LangCode): TranslatedItem {
  const normalized = dietary.toLowerCase().trim();
  
  if (dietaryTranslations[normalized] && dietaryTranslations[normalized][targetLang]) {
    return {
      original: dietary,
      translated: dietaryTranslations[normalized][targetLang]
    };
  }
  
  return {
    original: dietary,
    translated: dietary.charAt(0).toUpperCase() + dietary.slice(1)
  };
}

/**
 * Translate an ingredient to the target language
 */
export function translateIngredient(ingredient: string, targetLang: LangCode): TranslatedItem {
  const normalized = ingredient.toLowerCase().trim();
  
  if (ingredientTranslations[normalized] && ingredientTranslations[normalized][targetLang]) {
    return {
      original: ingredient,
      translated: ingredientTranslations[normalized][targetLang]
    };
  }
  
  // Try to find partial match
  for (const [key, translations] of Object.entries(ingredientTranslations)) {
    if (normalized.includes(key) && translations[targetLang]) {
      return {
        original: ingredient,
        translated: translations[targetLang]
      };
    }
  }
  
  return {
    original: ingredient,
    translated: ingredient.charAt(0).toUpperCase() + ingredient.slice(1)
  };
}

/**
 * Translate all items in a list
 */
export function translateList(items: string[], targetLang: LangCode, type: 'allergen' | 'dietary' | 'ingredient'): TranslatedItem[] {
  const translateFn = type === 'allergen' 
    ? translateAllergen 
    : type === 'dietary' 
      ? translateDietary 
      : translateIngredient;
  
  return items.map(item => translateFn(item, targetLang));
}
