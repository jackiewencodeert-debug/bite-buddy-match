## Plan: Afronden sessie + behandelen discussiepunten

### Stap 1 — Verifieer `dish_match_events` migratie
Via `supabase--read_query`: check of tabel bestaat, kolommen kloppen (verified_count, ingredient_inferred_count, unknown_count, dishes jsonb, user_id, menu_id, created_at), en RLS policies actief zijn. Indien tabel ontbreekt → nieuwe migratie aanmaken via `supabase--migration`.

### Stap 2 — Regenereer `types.ts` impliciet
Na bevestiging dat migratie applied is, regenereert Lovable types.ts automatisch bij de volgende build. Daarna patchen we Scan.tsx om de `(supabase as any)` cast te verwijderen — losse kleine commit.

### Stap 3 — Beslissingen op de 8 discussiepunten

Mijn voorstel per punt (vraag bevestiging waar nodig):

1. **MenuEditor telemetry**: skippen ✅ (eetgever-curatie geeft geen zinvolle source-distributie).
2. **types.ts regen**: doen na stap 1 ✅.
3. **bun vs npm**: kies **bun** (Lovable's default, kleinere lockfile-diffs). Verwijder `package-lock.json` uit repo, voeg toe aan `.gitignore`.
4. **GuestMenuResults badges**: 5-regel patch — gelijkstellen aan ingelogd ✅ (zelfde data is al binnen, UX-consistentie wint).
5. **Multi-language vertalingen**: rule-based laag via `businessTranslations.ts` dictionary toevoegen aan match-menu response (Stage-3 enrichment). Behoudt feature zonder AI-kosten.
6. **Stripe + Resend secrets**: laten staan tot KvK rond ✅.
7. **Bundle 2.5MB**: dynamische imports voor PDF.js + Tesseract.js — aparte refactor-commit ná deze verificatie-loop.
8. **AdMob test-ID**: synchroniseer Info.plist met productie-ID uit capacitor.config.ts → één bron van waarheid.

### Stap 4 — Uitvoering volgorde (deze loop)
1. `read_query` op `dish_match_events` → bevestig schema
2. Indien OK: patch `Scan.tsx` om cast te verwijderen
3. Patch `GuestMenuResults.tsx` voor badges (punt 4)
4. Sync AdMob production ID in `ios/App/App/Info.plist` (punt 8)
5. Build verifiëren

### Stap 5 — Opvolgloop (apart, na user-test in Xcode)
- Multi-language rule-based vertaal-laag in match-menu (punt 5)
- Bundle splitting voor PDF.js/Tesseract (punt 7)
- Cleanup `package-lock.json` (punt 3)

### Wachten op user
- Xcode build + scan-test van test-menu.png
- Verificatie `SELECT * FROM dish_match_events ORDER BY created_at DESC LIMIT 1`

### Vragen ter bevestiging
- Akkoord met **bun** als enige package manager?
- Akkoord met rule-based vertaal-laag (geen AI) voor punt 5?
- Akkoord met badges-gelijktrekking voor guests (punt 4)?
