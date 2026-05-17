## Plan: Zero-AI schema migratie uitvoeren

Voer de aangeleverde SQL uit als één migratie via de Lovable Cloud migration tool. Idempotent — veilig bij herhaling.

### Wat de migratie doet

1. **Extensie**: `pg_trgm` aanzetten (fuzzy text matching)
2. **5 tabellen**: `restaurants`, `curated_menus`, `curated_dishes`, `dish_aliases`, `ingredient_allergens` — met allergeen/dieet CHECK-constraints beperkt tot EU-14 + 6 dieet-tags
3. **6 indexen**: GIN trigram-indexen op naam-velden + FK-indexen op `menu_id` / `restaurant_id`
4. **2 RPC's**:
   - `is_admin(uid)` — wrapper rond bestaande `has_role(uid,'admin'::app_role)` zodat `AdminMenuImport.tsx` werkt zonder code-wijziging
   - `fuzzy_dish_match(search_text, threshold)` — 3-stage match (exact / fuzzy name / alias fuzzy), top 5 alleen verified dishes
5. **RLS**: public SELECT op alle 5 tabellen (nodig voor scan-flow zonder login), admin-only ALL via `has_role`
6. **Storage bucket** `menu-uploads` (privé) + policies: authenticated upload, owner-only read

### Beslissing nodig vóór ik run

De SQL gebruikt `auth.role() = 'authenticated'` in de storage INSERT-policy. Project gebruikt **auto-guest login** (anonieme sessies tellen als `authenticated`), dus dat is OK — guests kunnen uploaden. Bevestig of dat gewenst is, anders restrict ik naar non-anonymous (`auth.jwt()->>'is_anonymous' = 'false'`).

### Na de migratie (verificatie)

Ik check direct:
- `information_schema.tables` → 5 rijen
- `pg_proc` → `fuzzy_dish_match` + `is_admin` aanwezig
- `storage.buckets` → `menu-uploads` bestaat
- Linter draaien voor RLS / security warnings

### Code-impact (geen wijzigingen nodig)

- `AdminMenuImport.tsx` roept `rpc("is_admin",{uid})` — werkt direct dankzij wrapper
- `match-menu` edge function query't `ingredient_allergens` + `rpc("fuzzy_dish_match")` — werkt direct
- Geen frontend-edits in deze stap

### Niet in scope

- Seed-data voor `ingredient_allergens` (komt in volgende stap)
- Cleanup van `_archive/analyze-menu-deprecated/`
- Verwijderen van `menu-images` bucket (blijft, wordt elders gebruikt)

Akkoord = ik draai de migratie en lever verificatie-output.