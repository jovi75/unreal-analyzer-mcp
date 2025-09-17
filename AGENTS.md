# Repository Guidelines

## Project Structure & Modules
- `src/` houses all TypeScript sources. `index.ts` registers MCP tools and transport; `analyzer.ts` contains the Tree-sitter driven analyzers; supporting enums and fixtures live under `src/types/`.
- `src/__tests__/` keeps Jest specs, mocks for Tree-sitter, and the shared `setup.ts` bootstrap.
- `build/` stores compiled ESM output from `tsc`; regenerate it after code edits rather than hand-editing.
- Root configs (`glama.json`, `jest.config.js`, `tsconfig.json`) define the MCP manifest, test harness, and compiler behaviour—update them together when adding capabilities.

## Build, Test, and Local Runs
- `npm install` – install dependencies.
- `npm run build` – compile TypeScript to `build/` with strict checks; run this before publishing or committing.
- `npm start` – launch `node build/index.js` for manual MCP tool calls.
- `npm test` – execute Jest (`ts-jest` ESM mode). Use `npm test -- --watch` while iterating.

## Coding Style & Naming
- Stick to TypeScript with explicit types on exported APIs. Two-space indentation, single quotes, and trailing commas match the current codebase.
- Use PascalCase for classes (`UnrealCodeAnalyzer`), camelCase for functions/locals, and SCREAMING_SNAKE_CASE for const enums such as the genre flags.
- Mirror existing module boundaries: keep new analyzers inside `analyzer.ts` or dedicated helpers under `src/` so builds remain tree-shakeable.

## Testing Expectations
- Place new specs in `src/__tests__` using the `*.test.ts` suffix and Jest mocks when native bindings are required.
- Cover new tool surfaces by asserting server responses (see `index.test.ts`). Prefer deterministic fixtures over scanning the real filesystem.
- Document verification steps in PR descriptions: commands run, sample tool payloads, or logs from `npm start` sessions.

## Commit & PR Checklist
- Write imperative, concise commit messages (`fix glob sync fallback`, `add subsystem fixtures`) in line with the existing history.
- PRs should outline behaviour changes, note impacted tools, link any issues, and list the tests executed. Attach screenshots or transcripts when altering agent responses.
- Avoid committing generated artifacts (`build/`) unless release tooling requires it; reviewers expect source-only diffs.

## Agent & Security Notes
- Never hardcode local Unreal paths; accept user-configured directories like `set_unreal_path` does and validate existence.
- When expanding filesystem access, reuse the cached glob helpers to keep scans predictable in sandboxed environments.
- Keep `README.md` and `glama.json` in sync whenever tools or arguments change so downstream agents advertise accurate capabilities.
