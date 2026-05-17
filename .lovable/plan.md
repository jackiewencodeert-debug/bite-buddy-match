## Plan: Seed `ingredient_allergens` met ±320 Nederlandse ingrediënten

Voer de aangeleverde INSERT uit via de Lovable data-insert tool. Idempotent via `ON CONFLICT (ingredient_name) DO NOTHING`, dus veilig her-runbaar.

### Wat het doet

- Voegt ingrediënten toe met velden: `ingredient_name`, `ingredient_aliases`, `allergens` (EU-14), `notes`
- Dekt alle 14 EU-allergenen + vleesopties zonder allergeen + groente/fruit/kruiden/specerijen + bereide gerechten (frikandel, bitterbal, quiche...) + dranken
- Stage-2 inference in `match-menu` edge function gebruikt deze tabel direct

### Opmerkingen op de data

- **Telling**: comment zegt "369", echte unieke rijen ≈ **319** (kop telt ongeveer 322 entries; 'seitan' staat 2× in lijst, 2e wordt door ON CONFLICT genegeerd; 'kappertjes' staat als hoofdrij én als alias bij 'kapper'). Geen probleem — ON CONFLICT handelt dat netjes af.
- **Geheugenregel-conflict**: 'kikkererwten' heeft note "Wel basis voor falafel/hummus" — suggereert dat gluten-/lactose-info ergens bedoeld is, maar onze diëten zijn beperkt tot Vegetarisch/Veganistisch/Kosher/Halal. Allergenen blijven correct (EU-14), geen actie.
- **Note bij `kikkererwten`** lijkt half-zin ("Wel basis voor..."). Laat ik staan — admin kan later editen.

### Verificatie na insert

```
SELECT COUNT(*) FROM ingredient_allergens;
SELECT allergen, COUNT(*) FROM (
  SELECT unnest(allergens) AS allergen FROM ingredient_allergens
) t GROUP BY allergen ORDER BY 2 DESC;
```

Verwacht: ~315-320 rijen, en alle 14 EU-allergenen aanwezig.

### Niet in scope

- Geen wijzigingen aan tabellen / RLS / edge functions
- Geen frontend-edits
- Geen seed van `curated_dishes` of `restaurants` (komt later via admin import-UI)

Akkoord = ik draai de insert en lever de COUNT-output.