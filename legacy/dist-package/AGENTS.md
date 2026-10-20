# AGENTS.md - Developer Guide for L2Earn

## Project Overview

L2Earn is a web application that helps users learn valuable skills and generate value from their knowledge. It uses AI (Gemini API) to generate personalized career roadmaps and course content, with Supabase as the backend for data persistence.

## Build Commands

```bash
# Development
pnpm dev              # Start Vite dev server on port 3000

# Build
pnpm build            # Build for production
pnpm preview          # Preview production build

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
- **Services/Utils**: camelCase (e.g., `dbService.ts`, `geminiService.ts`)
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
│   ├── dbService.ts
│   ├── geminiService.ts
│   └── supabase.ts
├── types.ts             # Global TypeScript interfaces
├── App.tsx              # Main application entry
├── vite.config.ts       # Vite configuration
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
import { generateCareerPath } from './services/geminiService';

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

- Uses Tailwind CSS utility classes
- Common color palette: slate (text/borders), indigo (primary), emerald (success)
- Use semantic class names for readability
- Use `animate-fade-in` for smooth transitions

### State Management

- Use React `useState` for local component state
- Lift state to parent components when shared across views
- Use descriptive state names (e.g., `dashboardState`, `treeState`)

### API Keys & Environment

- Store API keys in `.env` files (see `.env.example`)
- Required: `GEMINI_API_KEY` for AI features
- Supabase keys needed for backend features (optional for demo mode)

## Key Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: Google Gemini API (@google/genai)
- **Backend**: Supabase (optional)
- **Testing**: Jest, @testing-library/react

## Project Views

The app uses a view-based routing system defined in `types.ts`:
- `landing` - Landing page for unauthenticated users
- `dashboard` - Main user dashboard with AI Career Architect
- `marketplace` - Course listing
- `learning` - Course player
- `learning-tree` - AI-generated learning roadmap
- `studio` - Content creator studio
- `whitepaper` - Manifesto/whitepaper page
