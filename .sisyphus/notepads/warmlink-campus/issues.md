# warmlink-campus issues

- `npm run build` currently fails at `tsc -b` with `TS5101` because the existing tsconfig uses deprecated `baseUrl` under TypeScript 6.0. This is outside T0's allowed file set.
- `lsp_diagnostics` could not fully validate CSS/JSON edits because the environment is missing the Biome LSP executable.
- `npm run lint` still fails on untouched `src/components/ui/button.tsx` because of the existing `react-refresh/only-export-components` rule; T0 intentionally left that file unchanged.

- [2026-05-31 16:09:12] Task 1: tsc --noEmit fails with 'Option baseUrl is deprecated and will stop functioning in TypeScript 7.0'. This is a known issue and does not block Vite build.

- [2026-05-31 16:24:00] Task 6 follow-up resolved: `src/lib/privacy/detect.ts` imports the canonical `PrivacyRisk` type from `src/lib/llm/schema.ts`; no privacy-schema follow-up remains.

- [2026-05-31] Task 2: `npx tsc --noEmit -p tsconfig.app.json` is still blocked by the existing TS 6 `baseUrl` deprecation (TS5101). No tsconfig changes were made per scope.
