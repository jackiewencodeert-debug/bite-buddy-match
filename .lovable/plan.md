## Feiten uit de huidige Lovable-koppeling

- Lovable ziet voor dit project backend-ref `rpmsztjsvbtigdtbtcnm`.
- De anon/publishable key in Lovable hoort ook bij `rpmsztjsvbtigdtbtcnm`.
- `LOVABLE_API_KEY` bestaat in deze Lovable-koppeling als managed runtime secret.
- De door Claude Code genoemde ref `ljnnfogyprnmbtnkfwag` is niet de backend waar deze Lovable-projectsessie nu op aangesloten is.
- Een testcall via Lovable’s gekoppelde backend gaf nu eerst `Missing authorization header`, dus nog geen bewijs dat de AI-key runtime faalt op de gekoppelde backend.

## Plan

1. Test `analyze-menu` op de door Lovable gekoppelde backend met expliciete Authorization header en minimale body.
2. Controleer recente `analyze-menu` logs direct na die test op:
   - `LOVABLE_API_KEY not configured`
   - AI Gateway errors
   - input-validatie/foto-body errors
3. Als de gekoppelde backend werkt: rapporteer dat Claude Code op de verkeerde backend-ref test en dat `ljnnfogyprnmbtnkfwag` niet representatief is voor deze Lovable-app.
4. Als de gekoppelde backend alsnog `LOVABLE_API_KEY not configured` geeft: roteer/provisioneer de managed `LOVABLE_API_KEY` opnieuw via de Lovable AI Gateway tool en test opnieuw.
5. Als de app werkelijk naar `ljnnfogyprnmbtnkfwag` moet wijzen, dan is dit geen codefix maar een connector/project-koppeling issue: dan moeten we de Lovable Cloud-koppeling op projectniveau herstellen of bewust migreren, zonder secrets in chat te plakken.

## Technisch

De source gebruikt `Deno.env.get("LOVABLE_API_KEY")` in `supabase/functions/analyze-menu/index.ts` en roept `https://ai.gateway.lovable.dev/v1/chat/completions` aan. De fout kan dus alleen betrouwbaar worden vastgesteld op de backend-ref waar de app en deployed edge function daadwerkelijk draaien.