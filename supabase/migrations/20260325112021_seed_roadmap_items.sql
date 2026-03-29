-- seeds roadmap items for phases 0 through 4
-- reflects actual project history as of phase 4 completion

insert into public.roadmap_items (title, description, phase, status) values

-- phase 0
('Create GitHub repo', 'Private repo, README, .gitignore, MIT license', 'Phase 0 · Setup', 'done'),
('Scaffold project with Expo', 'npx create-expo-app with blank TypeScript template', 'Phase 0 · Setup', 'done'),
('Install React Native Web', 'Enables browser support alongside mobile', 'Phase 0 · Setup', 'done'),
('Install and configure ESLint + Prettier', 'Code style and formatting enforced on save', 'Phase 0 · Setup', 'done'),
('Set up Husky + lint-staged', 'Pre-commit hook runs eslint and prettier on staged files', 'Phase 0 · Setup', 'done'),
('Configure conventional commits', 'commitlint enforces commit message format', 'Phase 0 · Setup', 'done'),
('Set up Jest for unit testing', 'Jest with Expo recommended config', 'Phase 0 · Setup', 'done'),
('Add GitHub branch protection', 'Protect main: CI must pass, no direct push', 'Phase 0 · Setup', 'done'),
('Add GitHub Actions CI workflow', 'Runs lint and unit tests on every PR', 'Phase 0 · Setup', 'done'),
('Connect repo to Vercel', 'Auto-deploys web build on push to main', 'Phase 0 · Setup', 'done'),
('Create Supabase project', 'Project created, URL and anon key saved to .env.local', 'Phase 0 · Setup', 'done'),

-- phase 1
('Implement board representation', '6x6 board with TypeScript types, 0 represents empty cell', 'Phase 1 · Game Logic', 'done'),
('Implement validation function', 'Checks row, column, and 2x3 box for conflicts', 'Phase 1 · Game Logic', 'done'),
('Implement backtracking solver', 'Returns solved board or null if unsolvable', 'Phase 1 · Game Logic', 'done'),
('Implement puzzle generator', 'Generates uniquely solvable puzzles by difficulty', 'Phase 1 · Game Logic', 'done'),
('Write unit tests for all logic', 'Jest tests for validator, solver, and generator', 'Phase 1 · Game Logic', 'done'),
('Implement timer utility', 'useTimer hook with start, pause, stop, and mm:ss format', 'Phase 1 · Game Logic', 'done'),
('Implement difficulty levels', 'Easy, medium, and hard with tuned givens count', 'Phase 1 · Game Logic', 'done'),

-- phase 2
('Build SudokuBoard component', 'Renders the 6x6 grid, highlights selected cell', 'Phase 2 · Core UI', 'done'),
('Build SudokuCell component', 'Shows value or empty, handles press, highlights errors', 'Phase 2 · Core UI', 'done'),
('Build NumberPad component', 'Buttons 1 to 6 plus erase, works for touch and keyboard', 'Phase 2 · Core UI', 'done'),
('Wire up game state with useReducer', 'Central state with selectCell, placeNumber, erase, newGame, loadGame', 'Phase 2 · Core UI', 'done'),
('Add error highlighting', 'Real-time highlight on conflicting cells', 'Phase 2 · Core UI', 'done'),
('Add keyboard navigation', 'Arrow keys move selection, numbers place values, delete erases', 'Phase 2 · Core UI', 'done'),
('Add win detection', 'Detects complete valid board and shows win screen', 'Phase 2 · Core UI', 'done'),
('Add notes/pencil mode', 'Toggle pencil mode so cells can hold multiple candidate numbers', 'Phase 2 · Core UI', 'parked'),
('Add component tests', 'Testing library tests for board render, cell selection, number placement', 'Phase 2 · Core UI', 'parked'),

-- phase 3
('Set up Supabase Auth', 'Email, GitHub, and Google OAuth enabled', 'Phase 3 · Auth', 'done'),
('Install and configure Supabase client', 'createClient with env vars in lib/supabase.ts', 'Phase 3 · Auth', 'done'),
('Build AuthContext', 'Provides user, session, profile, isAdmin, signIn, signOut, and guest mode', 'Phase 3 · Auth', 'done'),
('Build Login screen', 'Email and password form plus GitHub and Google OAuth', 'Phase 3 · Auth', 'done'),
('Build Sign Up screen', 'Email and password registration with confirmation flow', 'Phase 3 · Auth', 'done'),
('Add protected routes', 'Unauthenticated users redirected to login via Expo Router', 'Phase 3 · Auth', 'done'),
('Add user profile display', 'Avatar and username in header with sign out button', 'Phase 3 · Auth', 'done'),

-- phase 4
('Design and create DB schema', 'Tables: profiles, games, user_progress with RLS on all', 'Phase 4 · Data Persistence', 'done'),
('Save in-progress games', 'Debounced auto-save on board change, resumes on next visit', 'Phase 4 · Data Persistence', 'done'),
('Save completed games', 'Inserts into user_progress on win with difficulty, time, and date', 'Phase 4 · Data Persistence', 'done'),
('Lock board on win', 'Prevents edits after solving, enforced in reducer', 'Phase 4 · Data Persistence', 'done'),
('Build secret admin screen', 'Role-based access with full CRUD roadmap checklist backed by Supabase', 'Phase 4 · Data Persistence', 'done'),
('Build stats screen', 'Games played and best time per difficulty', 'Phase 4 · Data Persistence', 'parked'),
('Build leaderboard', 'Top 10 times per difficulty, public view', 'Phase 4 · Data Persistence', 'parked');