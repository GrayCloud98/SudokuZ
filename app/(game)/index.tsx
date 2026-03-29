import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SudokuBoard } from '@/components/SudokuBoard';
import { NumberPad } from '@/components/NumberPad';
import { useGameState } from '@/hooks/useGameState';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useTimer } from '@/hooks/useTimer';
import { WinScreen } from '@/components/WinScreen';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function GameScreen() {
  const { user } = useAuth();
  const {
    gameBoard,
    puzzle,
    solution,
    selectedCell,
    isSolved,
    difficulty,
    selectCell,
    placeNumber,
    erase,
    newGame,
    loadGame,
  } = useGameState('easy');
  const { seconds, start, stop } = useTimer();
  const { clearSavedGame, isLoadingGame } = useGamePersistence({
    puzzle,
    solution,
    board: gameBoard.values,
    difficulty,
    isSolved,
    loadGame,
  });

  // start timer on mount, stop when solved
  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (isSolved) stop();
  }, [isSolved]);

  // called once when win screen mounts -- clears save slot and records score
  async function handleWin() {
    await clearSavedGame();
    if (!user) return;
    const { error } = await supabase.from('user_progress').insert({
      user_id: user.id,
      difficulty,
      time_seconds: seconds,
      puzzle_id: null,
    });
    if (error) {
      console.error('failed to save score:', error.message);
    }
  }

  useKeyboard({
    selectedCell,
    onSelectCell: selectCell,
    onPlaceNumber: placeNumber,
    onErase: erase,
  });

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.game}>
        {isLoadingGame ? null : (
          <>
            <SudokuBoard
              gameBoard={gameBoard}
              selectedCell={selectedCell}
              onCellPress={selectCell}
            />
            <NumberPad onNumberPress={(num) => placeNumber(num)} onErase={erase} />
            {isSolved && <WinScreen onNewGame={newGame} onWin={handleWin} />}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  game: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
