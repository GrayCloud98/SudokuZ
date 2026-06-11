import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SudokuBoard } from '@/components/SudokuBoard';
import { NumberPad } from '@/components/NumberPad';
import { GameControls } from '@/components/GameControls';
import { useGameState } from '@/hooks/useGameState';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useTimer } from '@/hooks/useTimer';
import { WinScreen } from '@/components/WinScreen';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, spacing, radius } from '@/theme/theme';
import * as B from '@/logic/board';
import type { Difficulty } from '@/logic/generator';

const MAX_GAME_WIDTH = 480;

export default function GameScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { difficulty: diffParam, fresh } = useLocalSearchParams<{
    difficulty: string;
    fresh: string;
  }>();
  const difficulty = ['easy', 'medium', 'hard'].includes(diffParam as string)
    ? (diffParam as Difficulty)
    : 'medium';

  const {
    gameBoard,
    puzzle,
    solution,
    selectedCell,
    isSolved,
    difficulty: activeDifficulty,
    notesMode,
    mistakes,
    hintsRemaining,
    canUndo,
    selectCell,
    placeNumber,
    erase,
    toggleNotesMode,
    undo,
    hint,
    newGame,
    loadGame,
  } = useGameState(difficulty);

  const [isPaused, setIsPaused] = useState(false);
  const { time, seconds, start, pause, stop } = useTimer();
  const { clearSavedGame, isLoadingGame } = useGamePersistence({
    puzzle,
    solution,
    board: gameBoard.values,
    difficulty: activeDifficulty,
    isSolved,
    loadSaved: fresh !== '1',
    loadGame,
  });

  useEffect(() => {
    start();
  }, []);

  // pause (not stop) so the final time survives for the win screen
  useEffect(() => {
    if (isSolved) pause();
  }, [isSolved]);

  function togglePause() {
    if (isSolved) return;
    setIsPaused((paused) => {
      if (paused) start();
      else pause();
      return !paused;
    });
  }

  function handleNewGame(nextDifficulty: Difficulty) {
    newGame(nextDifficulty);
    setIsPaused(false);
    stop();
    start();
  }

  async function handleWin() {
    await clearSavedGame();
    if (!user) return;
    const { error } = await supabase.from('user_progress').insert({
      user_id: user.id,
      difficulty: activeDifficulty,
      time_seconds: seconds,
      puzzle_id: null,
    });
    if (error) console.error('failed to save score:', error.message);
  }

  useKeyboard({
    selectedCell,
    onSelectCell: isPaused ? () => {} : selectCell,
    onPlaceNumber: isPaused ? () => {} : placeNumber,
    onErase: isPaused ? () => {} : erase,
  });

  // Board fills the viewport on phones, capped on desktop
  const cellSize = Math.min(
    64,
    Math.floor((Math.min(width, MAX_GAME_WIDTH) - spacing['2xl'] * 2 - 10) / B.GRID_SIZE)
  );
  const boardWidth = cellSize * B.GRID_SIZE + 10;

  return (
    <View style={styles.container}>
      <Header
        difficulty={activeDifficulty}
        time={time}
        mistakes={mistakes}
        isPaused={isPaused}
        onTogglePause={togglePause}
      />

      <View style={styles.game}>
        {!isLoadingGame && (
          <View style={styles.column}>
            <View style={styles.boardWrap}>
              <SudokuBoard
                gameBoard={gameBoard}
                selectedCell={selectedCell}
                cellSize={cellSize}
                onCellPress={isPaused ? () => {} : selectCell}
              />
              {isPaused && (
                <Pressable
                  style={[styles.pauseOverlay, { width: boardWidth }]}
                  onPress={togglePause}
                >
                  <View style={styles.pauseIconWrap}>
                    <Feather name="play" size={28} color={colors.textPrimary} />
                  </View>
                  <Text style={styles.pauseTitle}>Paused</Text>
                  <Text style={styles.pauseHint}>Tap to resume</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.controls}>
              <GameControls
                notesMode={notesMode}
                canUndo={canUndo}
                hintsRemaining={hintsRemaining}
                onUndo={undo}
                onErase={erase}
                onToggleNotes={toggleNotesMode}
                onHint={hint}
              />
            </View>

            <View style={styles.pad}>
              <NumberPad onNumberPress={placeNumber} gameBoard={gameBoard} notesMode={notesMode} />
            </View>

            {isSolved && (
              <WinScreen
                onNewGame={handleNewGame}
                onWin={handleWin}
                time={time}
                difficulty={activeDifficulty}
                mistakes={mistakes}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  game: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  column: {
    width: '100%',
    maxWidth: MAX_GAME_WIDTH,
    alignItems: 'center',
    gap: 28,
  },
  boardWrap: {
    alignItems: 'center',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderOuter,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pauseIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pauseTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pauseHint: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textMuted,
  },
  controls: {
    width: '100%',
  },
  pad: {
    width: '100%',
  },
});
