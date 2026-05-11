# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run in browser

npm run lint           # ESLint (TypeScript)
npm run format         # Prettier
npm test               # Jest (all tests)
npx jest __tests__/foo.test.ts  # Single test file
```

Pre-commit hooks run lint-staged (ESLint + Prettier) automatically on `.ts/.tsx/.json/.md` files.

## Architecture

**SudokuZ** is a cross-platform 6×6 Sudoku app built with Expo/React Native + Supabase, supporting iOS, Android, and Web via React Native Web.

### Routing (Expo Router — file-based)

```
app/_layout.tsx       ← Root layout; wraps app in AuthProvider
app/index.tsx         ← Splash/redirect: sends unauthenticated users to /(auth)/, others to /(game)/
app/(auth)/login.tsx
app/(auth)/signup.tsx
app/(game)/index.tsx  ← Main game screen
app/(game)/admin.tsx  ← Admin panel (requires admin role from profile)
```

### State layers

| Layer        | Location                          | Responsibility                                              |
| ------------ | --------------------------------- | ----------------------------------------------------------- |
| Auth/profile | `src/context/AuthContext.tsx`     | Session, OAuth, guest mode, role check                      |
| Game state   | `src/hooks/useGameState.ts`       | Reducer-based: board, selection, notes, undo, win detection |
| Persistence  | `src/hooks/useGamePersistence.ts` | Debounced (2s) auto-save to Supabase `games` table          |
| Timer        | `src/hooks/useTimer.ts`           | mm:ss format                                                |
| Keyboard     | `src/hooks/useKeyboard.ts`        | Arrow keys, number keys 1–6, Delete/Backspace               |

### Pure game logic (`src/logic/`)

All functions here are dependency-free (no React):

- `board.ts` — data structures, board↔string serialization (36-char strings for DB storage)
- `validator.ts` — placement validation, conflict detection, completion check
- `generator.ts` — puzzle generation at 3 difficulties (easy: 24 givens, medium: 18, hard: 14)
- `solver.ts` — backtracking solver + unique-solution validator

### Supabase schema (tables)

- `profiles` — user metadata including `is_admin` flag
- `games` — saved game state per user (board as 36-char string)
- `user_progress` — score records (`user_id`, `difficulty`, `time_seconds`)
- `roadmap_items` — admin-managed roadmap entries

Client is initialized in `lib/supabase.ts`.

### Path alias

`@/*` resolves to `src/*` (configured in `tsconfig.json` and Metro).

### TypeScript

Strict mode is enabled. The project targets Expo's base TS config.
