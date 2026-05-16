import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { colors } from '@/theme/theme';
import type { Difficulty } from '@/logic/generator';

export default function GameScreen() {
  const { user } = useAuth();
  const { difficulty: diffParam } = useLocalSearchParams<{ difficulty: string }>();
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

  const { time, seconds, start, stop } = useTimer();
  const { clearSavedGame, isLoadingGame } = useGamePersistence({
    puzzle,
    solution,
    board: gameBoard.values,
    difficulty: activeDifficulty,
    isSolved,
    loadGame,
  });

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (isSolved) stop();
  }, [isSolved]);

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
    onSelectCell: selectCell,
    onPlaceNumber: placeNumber,
    onErase: erase,
  });

  return (
    <View style={styles.container}>
      <Header difficulty={activeDifficulty} time={time} mistakes={mistakes} />

      <View style={styles.game}>
        {!isLoadingGame && (
          <>
            <View style={styles.boardWrap}>
              <SudokuBoard
                gameBoard={gameBoard}
                selectedCell={selectedCell}
                onCellPress={selectCell}
              />
            </View>

            <View style={styles.controls}>
              <GameControls
                notesMode={notesMode}
                canUndo={canUndo}
                onUndo={undo}
                onErase={erase}
                onToggleNotes={toggleNotesMode}
                onHint={hint}
              />
            </View>

            <View style={styles.pad}>
              <NumberPad onNumberPress={placeNumber} gameBoard={gameBoard} />
            </View>

            {isSolved && (
              <WinScreen
                onNewGame={newGame}
                onWin={handleWin}
                time={time}
                difficulty={activeDifficulty}
                mistakes={mistakes}
              />
            )}
          </>
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
    gap: 28,
    paddingVertical: 16,
  },
  boardWrap: {
    alignItems: 'center',
  },
  controls: {
    width: '100%',
  },
  pad: {
    width: '100%',
  },
});
