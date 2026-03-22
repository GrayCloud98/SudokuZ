import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Board } from '../logic/board';
import type { Difficulty } from '../logic/generator';

interface UsePersistenceArgs {
  puzzle: Board;
  solution: Board;
  board: Board;
  difficulty: Difficulty;
  isSolved: boolean;
  loadGame: (puzzle: Board, solution: Board, board: Board, difficulty: Difficulty) => void;
}

const DEBOUNCE_MS = 2_000;

export function useGamePersistence({
  puzzle,
  solution,
  board,
  difficulty,
  isSolved,
  loadGame,
}: UsePersistenceArgs) {
  const { user } = useAuth();
  // track whether we have already attempted to load a saved game on mount
  const hasLoaded = useRef(false);
  const [isLoadingGame, setIsLoadingGame] = useState(false);

  // load saved game on mount, runs once per session
  useEffect(() => {
    if (!user || hasLoaded.current) return;
    hasLoaded.current = true;

    async function loadSavedGame() {
      setIsLoadingGame(true);
      const { data, error } = await supabase
        .from('games')
        .select('puzzle, solution, board, difficulty')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('failed to load saved game:', error.message);
        setIsLoadingGame(false);
        return;
      }

      if (data) {
        loadGame(data.puzzle, data.solution, data.board, data.difficulty);
      }

      setIsLoadingGame(false);
    }

    loadSavedGame();
  }, [user]);

  // debounced auto-save -- fires 2s after the last board change
  // skips if not logged in or game is already solved
  useEffect(() => {
    if (!user || isSolved) return;

    const timeout = setTimeout(async () => {
      const { error } = await supabase.from('games').upsert(
        {
          user_id: user.id,
          puzzle,
          solution,
          board,
          difficulty,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('auto-save failed:', error.message);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [user, isSolved, puzzle, solution, board, difficulty]);

  // call this on win to remove the completed game from the save slot
  async function clearSavedGame() {
    if (!user) return;
    const { error } = await supabase.from('games').delete().eq('user_id', user.id);
    if (error) {
      console.error('failed to clear saved game:', error.message);
    }
  }

  return { clearSavedGame, isLoadingGame };
}
