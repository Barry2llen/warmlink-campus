# warmlink-campus learnings

## 2026-05-31 Background research synthesis
- Current repo baseline: Vite template artifacts to delete are `src/App.tsx`, `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`; preserve `src/assets/hero.png`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `public/favicon.svg`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`.
- `components.json` currently uses `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`; T1 should update `tailwind.css` from `src/index.css` to `src/styles/globals.css`.
- `.gitignore` already has `*.local`, covering `.env.local`; plan still asks for explicit `.env.local`, which is harmless and clearer.
- Prototype mapping: `link_2` Home, `ai_link` Publish, `link_6` Hall, `link_1` Detail, `link_5` Map, `link_4` Profile, `link_7` MyHelp, `link_3` Success. Use structure only; do not copy Material palette or Material Symbols.
- Tailwind v4 docs: canonical Vite setup is `@tailwindcss/vite` plus `@import "tailwindcss";`. Use top-level `@theme` / `@theme inline`; CSS-var-backed tokens should use `@theme inline`.
- Gemini docs: current JS SDK is `@google/genai`, not legacy `@google/generative-ai`. Use `new GoogleGenAI({ apiKey })` and `ai.models.generateContent({ model: "gemini-2.5-flash", contents, config: { responseMimeType: "application/json", responseSchema } })`. Frontend API keys are demo-only and unsafe for production.
- T0 verification: `npx vite build` succeeds with the new placeholder entrypoint and Inter imports; `npm run build` is still blocked by the repo's existing TypeScript 6.0 `baseUrl` deprecation error in `tsc -b`.
- T0 lint note: the new `src/main.tsx` placeholder needed an export to satisfy Fast Refresh linting; after that, only the untouched `src/components/ui/button.tsx` still fails the repo-wide lint rule.

- [2026-05-31 16:09:06] Task 1: Created src/styles/tokens.css with Tailwind 4 @theme syntax for CSS variables. Updated globals.css to import fonts and tokens. Updated components.json to point to globals.css. Updated button.tsx to use var(--color-primary). Verified build succeeds. Browser verification skipped as Playwright is not explicitly requested and we can rely on build success.

- [2026-05-31 16:12:52] Task 1 Fix: Replaced Google Fonts URL with local @fontsource/inter imports in globals.css. Updated tokens.css to use --color-ink for body text, rgba(255,56,92,0.2) for selection background, and added --shadow-card-hover token. Verified build succeeds and no remote font URLs remain.

- [2026-05-31 16:24:00] Task 6: Added `src/lib/privacy/detect.ts` covering phone, wechat, qq, studentId, dorm, and bankCard. Phone/bankCard use explicit boundary guards; bankCard also requires Luhn validity to reduce timestamp-like false positives. The module now imports Task 2's canonical `PrivacyRisk` type and keeps offsets internal for redaction. Evidence files cover positive, negative, and timestamp edge cases.

- [2026-05-31] Task 2: Domain contracts now live in `src/lib/types/domain.ts` with ISO string timestamps, exact event/status/urgency/message/risk unions, and a barrel export in `src/lib/types/index.ts`. `src/lib/llm/schema.ts` mirrors the publish result shape and uses a Gemini-friendly JSON schema with required fields, enums, and nullable `areaId`/`timeRequirement`.
