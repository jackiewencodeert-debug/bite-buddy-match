## Plan: Afronden seed + verificatie + Claude cowork samenvatting

### Stap 1 — Uitvoeren `dish_aliases` insert
Voer de voorbereide `INSERT INTO dish_aliases ... WHERE NOT EXISTS` query uit (~150 aliases, idempotent via NOT EXISTS join op `curated_dishes.name`).

### Stap 2 — Verificatie (read-only)
Run deze checks via `supabase--read_query`:
- `SELECT COUNT(*) FROM dish_aliases;` — verwacht ≥150
- `SELECT COUNT(*) FROM curated_dishes WHERE verified = true;` — verwacht 146
- `SELECT COUNT(*) FROM restaurants;` — verwacht 151
- `SELECT * FROM fuzzy_dish_match('snert', 0.4);` — moet Erwtensoep returnen
- `SELECT * FROM fuzzy_dish_match('carbonara', 0.4);` — moet Spaghetti Carbonara returnen
- `SELECT * FROM fuzzy_dish_match('pad thai', 0.4);` — moet Pad Thai kip returnen
- `SELECT COUNT(*) FROM ingredient_allergens;` — verwacht 368

### Stap 3 — Edge function end-to-end test
`supabase--test_edge_functions` op `match-menu` met sample input (bv. `{"dishes":[{"name":"Spaghetti Carbonara"},{"name":"Pad Thai"}]}`) om te bevestigen dat Stage-1 (fuzzy) en Stage-2 (ingredient inference) werken.

### Stap 4 — Samenvatting voor Claude cowork
Lever een markdown-blok met:
- **Database state**: alle counts (restaurants, curated_menus, curated_dishes, dish_aliases, ingredient_allergens)
- **RPC's**: `fuzzy_dish_match`, `is_admin`, `has_role` — status + test resultaten
- **Storage buckets**: `menu-uploads` (private), `menu-images` (public)
- **Edge functions**: `match-menu` (nieuw, deployed), `analyze-menu` (legacy, blijft staan)
- **Migraties uitgevoerd**: 00_schema, 01_ingredients, 02_restaurants, 03_menu_dishes, 04_aliases
- **RLS**: public read op alle curated_* + ingredient_allergens + dish_aliases; admin write
- **Bekende gaps / TODO voor Claude**: bv. frontend integratie van `match-menu`, fallback naar Gemini bij low-confidence matches, eter UI om matches te tonen
- **Niets aangeraakt**: bestaande `menus`, `dishes`, `profiles`, auth flows blijven intact

Geen frontend code wijzigingen in deze loop — puur data seed + verificatie + handoff doc.
