# AGENTS.md - Developer Guide for L2Earn

## Project Overview

L2Earn is a web application that helps users learn valuable skills and generate value from their knowledge. It uses an open LLM layer (OpenAI Chat Completions / Anthropic Messages compatible, BYOK: the user supplies their own endpoint and key at runtime) to generate personalized career roadmaps and course content, with Supabase as the backend for data persistence (optional; falls back to built-in mock data). The frontend is a static SPA deployed to GitHub Pages.

Developer handbook: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) (service APIs, how-to guides, testing, troubleshooting). Architecture spine: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Build Commands

```bash
# Development
pnpm dev              # Start Vite dev server on port 3000

# Build
pnpm build            # Build for production (output: dist/)
pnpm preview          # Preview production build

# Build against a GitHub Pages sub-path
BASE_PATH=/l2earn/ pnpm build
BASE_PATH=/l2earn/ pnpm preview   # http://localhost:4173/l2earn/

# Type checking (app code / test code are split across two tsconfigs)
pnpm typecheck        # tsc -p tsconfig.json (app only; legacy/, cypress/, __tests__ excluded)
pnpm typecheck:test   # tsc -p tsconfig.test.json (tests)
pnpm verify           # typecheck + typecheck:test + test:ci + build

# Testing
pnpm test             # Run all Jest tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
pnpm test:ci          # CI mode: run all tests once with coverage
```

### Running a Single Test

```bash
# Run specific test file
pnpm test -- Dashboard.test.tsx

# Run tests matching a pattern
pnpm test -- --testNamePattern="Dashboard"

# Run specific test in watch mode
pnpm test -- --watch --testNamePattern="should render"
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022
- JSX: react-jsx
- Module resolution: bundler
- Path alias: `@/*` maps to root directory

### Naming Conventions
- **Components**: PascalCase (e.g., `Dashboard.tsx`, `CoursePlayer.tsx`)
- **Services/Utils**: camelCase (e.g., `dbService.ts`, `llmService.ts`)
- **Interfaces**: PascalCase with descriptive names (e.g., `Course`, `LearningPathData`)
- **Types**: Same as interfaces, use TypeScript's `type` for unions/primitives

### File Organization

```
Root/
├── components/          # React components (UI layer)
│   ├── Dashboard.tsx
│   ├── CoursePlayer.tsx
│   └── ...
├── services/            # Business logic & external APIs
│   ├── llm/             # Open LLM layer: presets, providers, transport, types
│   │   ├── providers/   # OpenAI / Anthropic protocol adapters
│   │   ├── presets.ts   # Vendor presets (OpenAI, Anthropic, DeepSeek, ...)
│   │   ├── transport.ts # Timeout / retry / error normalization
│   │   └── types.ts     # LlmConnection, LlmSettings, LlmError, ...
│   ├── llmService.ts    # Business-level AI calls (path/course/tutor generation)
│   ├── llmConfig.ts     # BYOK settings + key storage (sessionStorage/localStorage)
│   ├── dbService.ts
│   └── supabase.ts
├── index.html           # HTML entry (CSP meta, fonts, #root)
├── index.tsx            # React mount entry (imports ./index.css)
├── index.css            # Tailwind directives + base styles/custom utilities
├── types.ts             # Global TypeScript interfaces
├── App.tsx              # Main application entry
├── tailwind.config.js   # Tailwind v3 config (custom animations live here)
├── postcss.config.js    # tailwindcss + autoprefixer
├── vite.config.ts       # Vite config (base path derivation, dev CSP strip)
├── jest.config.ts       # Jest configuration
└── tsconfig.json        # TypeScript configuration

src/
├── services/__tests__/  # Service unit tests
├── components/__tests__/ # Component tests
└── setupTests.ts        # Jest setup file
```

### Import Order

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. External libraries
import { AreaChart, Area } from 'recharts';
import { TrendingUp, BookOpen } from 'lucide-react';

// 3. Internal components
import { Dashboard } from './components/Dashboard';
import { CoursePlayer } from './components/CoursePlayer';

// 4. Services & utilities
import { dbService } from './services/dbService';
import { generateCareerPath } from './services/llmService';

// 5. Types
import { Course, LearningPathData, ViewState } from './types';
```

### Component Guidelines

- Use functional components with TypeScript
- Define Props interfaces explicitly (e.g., `interface DashboardProps { ... }`)
- Use `React.FC<Props>` type for component declaration when needed
- Extract reusable sub-components within the same file when appropriate

### Error Handling

- Use try/catch for async operations (API calls, database operations)
- Log errors to console with descriptive messages
- Set appropriate error state in UI components
- Provide fallback mock data for development/demo purposes

```typescript
try {
  const result = await generateCareerPath(role, interests, goal, language);
  setDashboardState(prev => ({ ...prev, path: result, isGenerating: false }));
} catch (e) {
  console.error(e);
  setDashboardState(prev => ({ ...prev, isGenerating: false, error: "Failed to generate" }));
}
```

### Testing Conventions

- Test files location: `src/**/__tests__/*.test.tsx` or `src/**/*.test.ts`
- Use `@testing-library/react` for component testing
- Use `jest.mock()` for mocking external dependencies
- Follow the pattern: `describe('Component Name', () => { it('should...', () => { ... }) })`
- Clear mocks in `beforeEach`: `jest.clearAllMocks()`

### CSS & Styling

- Uses Tailwind CSS **v3**, built locally (`tailwindcss` + `postcss` + `autoprefixer`), not via CDN
- Config: `tailwind.config.js` (`content` covers `index.html`, `index.tsx`, `App.tsx`, `components/`, `src/`)
- Entry stylesheet: `index.css` (`@tailwind base/components/utilities` + body font + `.scrollbar-hide`/`.custom-scrollbar`)
- Custom animations are defined in `tailwind.config.js` (`animate-fade-in`, `animate-scale-up`, `animate-gradient-x`); add new ones there rather than as ad-hoc CSS
- Common color palette: slate (text/borders), indigo (primary), emerald (success)

### State Management

- Use React `useState` for local component state
- Lift state to parent components when shared across views
- Use descriptive state names (e.g., `dashboardState`, `treeState`)

### API Keys & Environment

- AI is **BYOK (Bring Your Own Key)**: the user picks a preset (or a custom endpoint) and enters the key in
  **Settings → AI 引擎** at runtime. Settings live in `services/llmConfig.ts`: endpoint/model in
  `localStorage`, key in `sessionStorage` by default (`localStorage` only if the user opts in).
- There is **no build-time env injection** of AI settings (the `define` block was removed from
  `vite.config.ts`), so keys never end up in the bundle. Do not reintroduce `LLM_*` `define` entries.
- `.env` is therefore only useful for local tooling/tests; never commit it.

#### Browser-direct calls: CORS & key exposure

- Requests go **straight from the browser** to the user's endpoint; there is no proxy. The endpoint must
  send permissive CORS headers, otherwise the browser blocks the call. OpenAI-compatible gateways usually
  do; Anthropic's Messages API additionally requires the `anthropic-dangerous-direct-browser-access`
  header (the provider adapter adds it automatically).
- Because the key lives in browser storage, **any same-origin script can read it** (XSS, browser
  extensions, malicious devtools snippets). That is why `index.html` pins a CSP with `script-src 'self'`
  and the app ships no third-party scripts. Use a dedicated low-quota key and never check "remember this
  key" on a shared machine.
- Keys must never be logged, put in URLs, or committed; `.gitignore` already excludes `.env*`.

#### GitHub Pages is static-only

- There is no server, no runtime `process.env`, and no secrets at runtime. Everything is built at CI time
  and served as static files from `dist/` (published via `.github/workflows/deploy.yml`).
- The site is served from a sub-path (`/l2earn/`) unless the repo is `<owner>.github.io`; `base` is
  derived from `BASE_PATH` / `GITHUB_REPOSITORY` in `vite.config.ts`. A wrong `base` means 404s on
  `/assets/*`.
- Since there are no server routes, `dist/404.html` (a copy of `index.html`) and `dist/.nojekyll` are
  produced by the workflow for SPA fallback and correct static publishing.
- Supabase is optional (demo/mock data is used when absent). Build-time env is limited to
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; they are read **once in `index.tsx`** via
  `configureSupabase()` and handed to services through `getSupabaseClient()` — services never touch
  `import.meta.env` (it is ESM-only and breaks Jest's CJS transform). The anon key is public-by-design
  (RLS-protected); a `service_role` key must never ship in the frontend.

## Key Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v3 (local PostCSS build)
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: open LLM layer in `services/llm/*` (OpenAI Chat Completions + Anthropic Messages protocols),
  called from `services/llmService.ts`; BYOK runtime config in `services/llmConfig.ts`
- **Backend**: Supabase (optional)
- **Testing**: Jest, @testing-library/react
- **Deployment**: GitHub Pages via `.github/workflows/deploy.yml` (sub-path `base` from `BASE_PATH`)

## Project Views

The app uses a view-based routing system defined in `types.ts`:
- `landing` - Landing page for unauthenticated users
- `dashboard` - Main user dashboard with AI Career Architect
- `marketplace` - Course listing
- `learning` - Course player
- `learning-tree` - AI-generated learning roadmap
- `studio` - Content creator studio
- `whitepaper` - Manifesto/whitepaper page
