# warmlink-campus decisions

## 2026-05-31 Start Work
- Active plan: `.sisyphus/plans/warmlink-campus.md`.
- Design source of truth: `DESIGN.md` Airbnb language. Prototype HTML under `docs/pages/*` is structure/function reference only; do not copy Material palette or Material Symbols.
- User selected warmth-glow `#FFB347` as a semantic companion color only for warmth/temperature/badge/report accents; Rausch `#ff385c` remains brand + primary CTA.
- Gemini key will live in `.env`; implementation must also work without it via same-schema fallback.
- Data persistence must be pure in-memory mock; no localStorage/persist.

## 2026-05-31 SDK correction
- Updated the plan from legacy `@google/generative-ai` to current `@google/genai` based on official Gemini JS SDK research. T0 installs `@google/genai`; T5 uses `GoogleGenAI` + `ai.models.generateContent`.

## 2026-05-31 Task 6 privacy detector
- After Task 2 landed `src/lib/llm/schema.ts`, Task 6 imports and re-exports the canonical `PrivacyRisk`/`PrivacyRiskKind` contract from that schema.
- Privacy detection remains fully local: regex + boundary/filter logic only, with no LLM or remote calls.
